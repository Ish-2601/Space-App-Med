import React, { useEffect, useRef, useState } from "react";
import { useStore, update } from "../backend/store.js";
import {
  sandboxEnabled,
  setSandboxMode,
  privateRecordsFor,
  pendingEscalations,
  resolveSandboxEscalation,
} from "../backend/sandbox.js";
import { recordMotorSample } from "../backend/homeUpgrades.js";
import {
  DISPLAY_MODES,
  getDisplay,
  setDisplay,
  applyDisplay,
} from "../display.js";
import {
  executeMissionCommand,
  normalizeVoiceCommand,
  VOICE_COMMANDS,
} from "./handsFree.js";

export function CircadianSelector({ value, onChange, id = "circadian-mode" }) {
  return (
    <label className="circadian-selector" htmlFor={id}>
      <span className="sr-only">Circadian display mode</span>
      <select
        id={id}
        aria-label="Circadian display mode"
        value={value.mode}
        onChange={(event) => onChange(setDisplay({ mode: event.target.value }))}
      >
        {DISPLAY_MODES.map((mode) => (
          <option key={mode.id} value={mode.id}>
            {mode.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CriticalEscalation({ record, crew }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus?.();
  }, [record.id]);
  const name =
    crew.find((person) => person.id === record.pid)?.name || "Crew member";
  return (
    <div className="mission-modal-backdrop">
      <section
        className="mission-escalation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="critical-title"
        aria-describedby="critical-description"
        ref={dialog}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = [...dialog.current.querySelectorAll("button")];
          const index = buttons.indexOf(document.activeElement);
          if (
            (event.shiftKey && index === 0) ||
            (!event.shiftKey && index === buttons.length - 1)
          ) {
            event.preventDefault();
            buttons[event.shiftKey ? buttons.length - 1 : 0]?.focus();
          }
        }}
      >
        <p className="eyebrow">Private sandbox · Critical threshold</p>
        <h2 id="critical-title">This entry needs immediate attention</h2>
        <p id="critical-description">
          {name}'s private entry crossed a life-safety trigger. Choose whether
          to share the critical finding with the medical officer and simulated
          Earth link.
        </p>
        <ul>
          {record.criticalReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p className="small muted">
          Only this finding is shared when you escalate. Other sandbox entries
          stay separate. This prototype does not contact an actual emergency
          service.
        </p>
        <div className="row">
          <button
            className="btn danger"
            onClick={() => resolveSandboxEscalation(record.id, true)}
          >
            Escalate critical finding
          </button>
          <button
            className="btn"
            onClick={() => resolveSandboxEscalation(record.id, false)}
          >
            Keep private for now
          </button>
        </div>
      </section>
    </div>
  );
}

export default function MissionUtilityBar({ person, navigate }) {
  const state = useStore();
  const isPrivate = sandboxEnabled(state);
  const [display, setDisp] = useState(getDisplay);
  const [handsFree, setHandsFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(
    "Commands work with your microphone or the buttons below.",
  );
  const [showRecords, setShowRecords] = useState(false);
  const [recordFilter, setRecordFilter] = useState("health");
  const [now, setNow] = useState(Date.now);
  const recognition = useRef(null);
  const runCommandRef = useRef(null);
  const enabledRef = useRef(false);
  const pending = pendingEscalations(state);
  const records = person ? privateRecordsFor(state, person.id) : [];
  const lastHealthRecord = records.find(
    (record) => record.kind !== "motorReadiness",
  );
  const visibleRecords = records.filter(
    (record) =>
      recordFilter === "all" ||
      (recordFilter === "timing"
        ? record.kind === "motorReadiness"
        : record.kind !== "motorReadiness"),
  );
  const deadline = state.settings.utilityTimerDeadline || null;
  const timerSeconds = deadline
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 0;

  useEffect(() => {
    const changed = () => {
      const next = getDisplay();
      setDisp(next);
      applyDisplay(next);
    };
    window.addEventListener("displaychange", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("displaychange", changed);
      window.removeEventListener("storage", changed);
    };
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (!person) return;
    let previousTyping = 0;
    let previousTap = 0;
    const inForm = (target) =>
      target instanceof Element &&
      target.closest(
        "form, .checkin-screen, .body-diagnostic, .triage, .diagnostic-form, .question-window, .quick-pulse",
      );
    const keydown = (event) => {
      if (
        !inForm(event.target) ||
        !event.target.matches("input, textarea") ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (
        event.key.length !== 1 &&
        !["Backspace", "Delete"].includes(event.key)
      )
        return;
      const time = performance.now();
      const latencyMs = time - previousTyping;
      if (previousTyping && latencyMs >= 40 && latencyMs <= 10000)
        recordMotorSample(person.id, {
          latencyMs,
          correction: event.key === "Backspace" || event.key === "Delete",
          kind: "typing",
        });
      previousTyping = time;
    };
    const pointer = (event) => {
      if (
        !inForm(event.target) ||
        !event.target.closest("button, input, select, label")
      )
        return;
      const time = performance.now();
      const latencyMs = time - previousTap;
      if (previousTap && latencyMs >= 100 && latencyMs <= 10000)
        recordMotorSample(person.id, {
          latencyMs,
          correction: false,
          kind: "tap",
        });
      previousTap = time;
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", pointer);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", pointer);
    };
  }, [person?.id, isPrivate]);

  useEffect(
    () => () => {
      enabledRef.current = false;
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function beginListening() {
    window.speechSynthesis?.cancel();
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus(
        "Speech recognition is unavailable in this browser. Use the simulated command buttons below.",
      );
      return;
    }
    if (recognition.current) recognition.current.abort();
    const listener = new Recognition();
    listener.lang = "en-US";
    listener.continuous = true;
    listener.interimResults = false;
    listener.onstart = () => {
      if (!enabledRef.current || recognition.current !== listener) {
        listener.abort();
        return;
      }
      setListening(true);
      setVoiceStatus(
        "Listening for one of the five commands. No audio is stored by NASA Med.",
      );
    };
    listener.onresult = (event) => {
      if (!enabledRef.current || recognition.current !== listener) return;
      const result = event.results[event.resultIndex];
      if (result?.isFinal) {
        const command = normalizeVoiceCommand(result[0].transcript);
        if (command) runCommandRef.current?.(command);
        else
          setVoiceStatus(
            "Command not recognized. Say one of the five phrases shown below.",
          );
      }
    };
    listener.onerror = (event) => {
      if (
        !enabledRef.current ||
        recognition.current !== listener ||
        event.error === "aborted"
      )
        return;
      setListening(false);
      setVoiceStatus(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied. Simulated command buttons remain available."
          : "Voice input stopped (" +
              event.error +
              "). Resume the microphone or use the buttons.",
      );
    };
    listener.onend = () => {
      if (recognition.current === listener) setListening(false);
    };
    recognition.current = listener;
    try {
      listener.start();
    } catch {
      setVoiceStatus(
        "Microphone could not start. Use the command buttons or try Resume microphone.",
      );
    }
  }

  function toggleHandsFree() {
    const on = !handsFree;
    enabledRef.current = on;
    setHandsFree(on);
    if (on) beginListening();
    else {
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
      setListening(false);
      setVoiceStatus("Hands-free mode off.");
    }
  }

  function speak(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text)
      return false;
    recognition.current?.abort();
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () =>
      setVoiceStatus(
        "Reading finished. Resume the microphone to listen again.",
      );
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function runCommand(command) {
    if (pending.length) {
      if (command === "Read aloud") {
        speak(
          document.querySelector(".mission-escalation-dialog")?.textContent ||
            "Review the critical-threshold prompt.",
        );
        return;
      }
      setVoiceStatus(
        "Respond to the critical-threshold prompt before continuing voice commands.",
      );
      return;
    }
    if (!person && ["Record vitals", "Next step"].includes(command)) {
      setVoiceStatus(
        "Choose your crew profile before recording vitals or advancing a check.",
      );
      return;
    }
    const message = executeMissionCommand(command, {
      doc: document,
      navigate,
      speak,
      startTimer: () => {
        const started = Date.now();
        setNow(started);
        update((s) => {
          s.settings.utilityTimerDeadline = started + 60000;
        });
      },
    });
    setVoiceStatus(message);
  }
  runCommandRef.current = runCommand;

  return (
    <>
      <section
        className={"mission-utility-bar" + (isPrivate ? " is-private" : "")}
        aria-label="Mission utility bar"
      >
        <div className="mission-utility-controls">
          <button
            className="utility-toggle"
            aria-pressed={isPrivate}
            onClick={() => setSandboxMode(!isPrivate)}
          >
            🔒 Private Sandbox: {isPrivate ? "ON" : "OFF"}
          </button>
          <button
            className="utility-toggle"
            aria-pressed={handsFree}
            onClick={toggleHandsFree}
          >
            🎙️ Hands-Free{handsFree ? " ON" : ""}
            {listening && (
              <span
                className="voice-live-dot"
                aria-label="Microphone listening"
              />
            )}
          </button>
          <CircadianSelector value={display} onChange={setDisp} />
          {person && (
            <button
              className="text-button private-records-button"
              aria-expanded={showRecords}
              onClick={() => setShowRecords(!showRecords)}
            >
              Private records ({records.length})
            </button>
          )}
        </div>
        {isPrivate && (
          <p className="utility-privacy-note" role="status">
            Sandbox entries stay separate from crew scores, CMO notifications
            and Earth reports. Critical readings prompt you before sharing.
            Switching mode clears unsaved forms.
          </p>
        )}
        {isPrivate && lastHealthRecord && (
          <p className="utility-save-status" role="status">
            Saved privately ·{" "}
            {String(lastHealthRecord.kind).replace(/[-_]/g, " ")} ·{" "}
            {new Date(lastHealthRecord.ts).toLocaleTimeString()}
          </p>
        )}
        {display.mode !== "standard" && (
          <p className="utility-mode-note">
            {display.mode === "redshift"
              ? "Red/amber screen palette. “0% blue light” is a mode name, not a measured display spectrum."
              : "Cool cyan screen palette. 480 nm is a design target, not calibrated light therapy."}
          </p>
        )}
        {handsFree && (
          <div className="hands-free-console">
            <div
              className="voice-command-buttons"
              role="group"
              aria-label="Simulated voice commands"
            >
              {VOICE_COMMANDS.map((command) => (
                <button
                  className="btn small"
                  key={command}
                  onClick={() => runCommand(command)}
                >
                  {command}
                </button>
              ))}
              {!listening && (
                <button className="btn small" onClick={beginListening}>
                  Resume microphone
                </button>
              )}
              <button
                className="btn small"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setVoiceStatus("Reading stopped.");
                }}
              >
                Stop reading
              </button>
            </div>
            <p role="status" className="small">
              {voiceStatus}
            </p>
            <p className="small muted">
              Microphone recognition may use your browser's speech service. The
              command buttons perform the same actions without audio. Form
              timing uses counts only; typed content is never captured.
            </p>
          </div>
        )}
        {deadline && (
          <div
            className="mission-voice-timer"
            role="timer"
            aria-label="Hands-free timer"
          >
            <span>
              {timerSeconds > 0
                ? `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`
                : "Timer complete"}
            </span>
            <button
              className="text-button"
              onClick={() =>
                update((s) => {
                  s.settings.utilityTimerDeadline = null;
                })
              }
            >
              Clear timer
            </button>
          </div>
        )}
        {showRecords && person && (
          <section
            className="private-records-drawer"
            aria-label="Private sandbox records"
          >
            <div className="row spread">
              <h2>{person.name} · Private records</h2>
              <button
                className="btn small"
                onClick={() => setShowRecords(false)}
              >
                Close records
              </button>
            </div>
            <p className="muted small">
              Stored locally on this device, separately from the crew health
              record. This is a prototype privacy boundary, not an encrypted
              account.
            </p>
            <label className="private-record-filter">
              Show records{" "}
              <select
                value={recordFilter}
                onChange={(event) => setRecordFilter(event.target.value)}
              >
                <option value="health">Health checks and logs</option>
                <option value="timing">Interaction timing only</option>
                <option value="all">All private records</option>
              </select>
            </label>
            {!records.length && (
              <p>
                No private records yet. Turn Private Sandbox ON, then complete a
                check or log.
              </p>
            )}
            {!!records.length && !visibleRecords.length && (
              <p>No records in this category yet.</p>
            )}
            {visibleRecords.slice(0, 50).map((record) => (
              <details key={record.id} className="private-record-row">
                <summary>
                  {String(record.kind).replace(/[-_]/g, " ")} · Day {record.day}{" "}
                  · {new Date(record.ts).toLocaleTimeString()}{" "}
                  {record.escalationStatus === "shared"
                    ? "· Critical finding shared"
                    : "· Private"}
                </summary>
                <pre>{JSON.stringify(record.payload, null, 2)}</pre>
                {!!record.criticalReasons?.length && (
                  <p>{record.criticalReasons.join(" · ")}</p>
                )}
              </details>
            ))}
            {visibleRecords.length > 50 && (
              <p className="small muted">
                Showing the latest 50 of {visibleRecords.length} records in this
                category.
              </p>
            )}
          </section>
        )}
      </section>
      {pending[0] && (
        <CriticalEscalation record={pending[0]} crew={state.crew} />
      )}
    </>
  );
}
