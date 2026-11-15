import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../backend/store.js";
import {
  latestClinicalRecord,
  saveClinicalRecord,
} from "../../backend/clinicalStore.js";
import { sandboxEnabled } from "../../backend/sandbox.js";
import {
  MEDICAL_PACKS,
  EMERGENCY_SOURCES,
  CPR_BPM,
  CPR_METHODS,
  codeElapsed,
  formatDuration,
  timerRemaining,
} from "../../backend/emergencySpecialized.js";
import { Panel, Icon } from "../ConsoleUI.jsx";
import useNow from "../useNow.js";

export function PackBadge({ pack = "MDP" }) {
  const item = MEDICAL_PACKS[pack] || MEDICAL_PACKS.MDP;
  return (
    <div className="medical-pack-location">
      <span
        className={`medical-pack-badge pack-${item.color}`}
        title={item.name}
      >
        {item.label}
      </span>
      <span>
        {item.drawer} <small>(simulated location)</small>
      </span>
    </div>
  );
}

export function PackLegend() {
  return (
    <details className="pack-legend">
      <summary>Medical pack colors and prototype drawer map</summary>
      <p>
        Red EMTP, White CMP, Blue MDP, Yellow PEP and Pink MTP follow NASA's
        published kit list. That list names the green pack Medical Supply Pack.
        This demo uses Green CCPK as a distinct staging label; it is not an
        official NASA color assignment. Drawer locations below are fictional
        mission configuration.
      </p>
      <div className="pack-legend-grid">
        {Object.keys(MEDICAL_PACKS).map((pack) => (
          <PackBadge key={pack} pack={pack} />
        ))}
      </div>
      <a href={EMERGENCY_SOURCES.packs} target="_blank" rel="noreferrer">
        NASA medical kit contents
      </a>
      {" · "}
      <a
        href={EMERGENCY_SOURCES.contamination}
        target="_blank"
        rel="noreferrer"
      >
        NASA contamination protection guidance
      </a>
    </details>
  );
}

export function StepTimer({ pid, emergencyId, index, seconds, label }) {
  const state = useStore(),
    now = useNow();
  const moduleId = `step-timer-${emergencyId}-${index}`;
  const timer = latestClinicalRecord(state, pid, moduleId, {
    includeDrafts: true,
  })?.payload;
  const remaining = timer ? timerRemaining(timer, now) : seconds;
  const running = timer?.running && remaining > 0;
  const persist = (next) =>
    saveClinicalRecord(pid, moduleId, next, { draft: true });
  return (
    <div className="protocol-step-timer">
      <div>
        <b>{label}</b>
        <output aria-label={label + " time remaining"}>
          {formatDuration(remaining)}
        </output>
      </div>
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={running}
          onClick={() =>
            persist({
              running: true,
              deadline: Date.now() + (remaining || seconds) * 1000,
              remainingMs: (remaining || seconds) * 1000,
            })
          }
        >
          {timer
            ? remaining
              ? "Resume timer"
              : "Restart timer"
            : "Start timer"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!running}
          onClick={() =>
            persist({
              ...timer,
              running: false,
              remainingMs: Math.max(0, timer.deadline - Date.now()),
            })
          }
        >
          Pause
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            persist({
              running: false,
              remainingMs: seconds * 1000,
              deadline: null,
            })
          }
        >
          Reset timer
        </button>
      </div>
      {timer && remaining === 0 && (
        <p role="status">
          Reminder reached. Reassess with the CMO; do not delay urgent care or
          stop treatment because the timer ended.
        </p>
      )}
    </div>
  );
}

function CPRDiagram({ method }) {
  return (
    <svg
      className="cpr-diagram"
      viewBox="0 0 400 210"
      role="img"
      aria-label={
        CPR_METHODS.find((m) => m.id === method).title +
        " training position schematic"
      }
    >
      <rect
        x="8"
        y="8"
        width="384"
        height="194"
        rx="12"
        className="cpr-cabin"
      />
      {method === "bearhug" ? (
        <>
          <circle cx="200" cy="50" r="18" />
          <path d="M200 68v78m0-30-35 58m35-58 35 58M184 77q-60 0-50 36l55 3m27-39q60 0 50 36l-55 3" />
          <circle cx="152" cy="41" r="15" className="cpr-rescuer" />
          <path
            d="M152 56v82m0-50 36 25m-36 25-30 35m30-35 20 36"
            className="cpr-rescuer"
          />
          <path
            d="m186 105 14 10-14 10m28-20-14 10 14 10"
            className="cpr-compression"
          />
          <text x="200" y="192">
            Rescuer behind patient
          </text>
        </>
      ) : (
        <>
          <path d="M52 170h296" className="cpr-restraint" />
          <circle cx="83" cy="148" r="16" />
          <path d="M99 148h130l80-5m-80 5 80 9M135 148l49-18m-49 18 49 15" />
          <path d="M115 137v27m100-25v25" className="cpr-restraint" />
          {method === "handstand" ? (
            <>
              <circle cx="170" cy="105" r="14" className="cpr-rescuer" />
              <path
                d="M170 91V64l-30-36m30 36 30-36M161 115l-22 25m40-25 5 25M129 28h23m37 0h23"
                className="cpr-rescuer"
              />
              <text x="292" y="40">
                Feet braced
              </text>
              <text x="292" y="58">
                on opposite wall
              </text>
            </>
          ) : (
            <>
              <circle cx="177" cy="62" r="15" className="cpr-rescuer" />
              <path
                d="M177 77v35l-29 18-21 28m50-46 31 18 25 28M167 90l-25 50m45-50-4 50"
                className="cpr-rescuer"
              />
              <path
                d="M162 107h30m-66 45 14 12m80-12 14 12"
                className="cpr-restraint"
              />
              <text x="292" y="50">
                Waist and leg
              </text>
              <text x="292" y="68">
                restraints
              </text>
            </>
          )}
          <path d="m150 124 9 14 9-14" className="cpr-compression" />
          <text x="200" y="192">
            Patient secured to CMRS
          </text>
        </>
      )}
    </svg>
  );
}

export default function CPRMetronome({ pid }) {
  const state = useStore(),
    now = useNow();
  const record = latestClinicalRecord(state, pid, "cpr-code", {
    includeDrafts: true,
  })?.payload || {
    running: false,
    elapsedMs: 0,
    method: "handstand",
    events: [],
  };
  const [audible, setAudible] = useState(false),
    [audioMessage, setAudioMessage] = useState(
      "Sound is off. The visual beat works without audio.",
    ),
    [beat, setBeat] = useState(0);
  const audioRef = useRef(null);
  const elapsed = codeElapsed(record, now),
    method = CPR_METHODS.find((m) => m.id === record.method) || CPR_METHODS[0];
  const persist = (next) =>
    saveClinicalRecord(pid, "cpr-code", next, { draft: true });
  useEffect(() => {
    if (!record.running) {
      setBeat(0);
      return;
    }
    const tick = () =>
      setBeat(
        Math.floor(
          (((record.elapsedMs || 0) + Date.now() - record.startedAt) *
            CPR_BPM) /
            60000,
        ),
      );
    tick();
    const interval = setInterval(tick, 40);
    return () => clearInterval(interval);
  }, [record.running, record.startedAt, record.elapsedMs]);
  useEffect(() => {
    if (!record.running || !audible || !audioRef.current) return;
    const context = audioRef.current;
    let next = context.currentTime + 0.05;
    const schedule = () => {
      if (context.state !== "running") return;
      if (next < context.currentTime) next = context.currentTime + 0.03;
      while (next < context.currentTime + 0.12) {
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, next);
        gain.gain.exponentialRampToValueAtTime(0.12, next + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, next + 0.07);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(next);
        oscillator.stop(next + 0.08);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        next += 60 / CPR_BPM;
      }
    };
    schedule();
    const interval = setInterval(schedule, 25);
    return () => clearInterval(interval);
  }, [record.running, audible]);
  useEffect(
    () => () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    },
    [],
  );
  const toggleSound = async () => {
    if (audible) {
      setAudible(false);
      setAudioMessage("Sound muted. Visual pacing continues.");
      return;
    }
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("Audio unsupported");
      if (!audioRef.current || audioRef.current.state === "closed")
        audioRef.current = new Audio();
      await audioRef.current.resume();
      if (audioRef.current.state !== "running")
        throw new Error("Audio blocked");
      setAudible(true);
      setAudioMessage(
        "Audio enabled for this session. Start the metronome to hear beats.",
      );
    } catch {
      setAudible(false);
      setAudioMessage(
        "Audio is unavailable or blocked. Follow the visual beat; try enabling sound again after checking browser audio permissions.",
      );
    }
  };
  return (
    <Panel title="110 BPM Zero-G CPR · ACLS code timer" className="cpr-panel">
      <p className="small muted">
        Training aid for trained crew following the vehicle's approved
        resuscitation protocol. This timer does not assess a pulse, deliver
        shocks or choose medication. Do not practise compressions on a conscious
        person.
      </p>
      <div className="cpr-layout">
        <div>
          <div
            key={record.running ? beat : "idle"}
            className={"cpr-pacer " + (record.running ? "running" : "")}
            aria-label="Visual compression pacer"
          >
            <Icon name="heart" size={48} />
            <strong>{CPR_BPM}</strong>
            <span>beats / minute</span>
          </div>
          <p className="cpr-elapsed">
            Code elapsed <output>{formatDuration(elapsed)}</output>
          </p>
          <p className="small muted">
            {record.running
              ? `Cycle ${Math.floor(elapsed / 120) + 1} · ${formatDuration(120 - (elapsed % 120))} to 2-minute coordination reminder`
              : "Paused · elapsed time is preserved"}
          </p>
          <div className="row">
            <button
              className="btn danger"
              onClick={() =>
                persist(
                  record.running
                    ? { ...record, running: false, elapsedMs: elapsed * 1000 }
                    : { ...record, running: true, startedAt: Date.now() },
                )
              }
            >
              {record.running
                ? "Pause metronome"
                : record.elapsedMs
                  ? "Resume 110 BPM"
                  : "Start 110 BPM"}
            </button>
            <button
              className="btn"
              aria-pressed={audible}
              onClick={toggleSound}
            >
              {audible ? "Mute sound" : "Enable audible beats"}
            </button>
          </div>
          <p role="status" className="small">
            {audioMessage}
          </p>
        </div>
        <div>
          <label>
            CPR positioning guide
            <select
              value={method.id}
              onChange={(e) => persist({ ...record, method: e.target.value })}
            >
              {CPR_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <CPRDiagram method={method.id} />
          <p>{method.instruction}</p>
          <p className="small muted">
            Schematic only. Use current crew training and the CMO's direction.
            Ensure full chest recoil and minimize interruptions; a metronome
            cannot verify compression depth or quality.
          </p>
        </div>
      </div>
      <div className="cpr-event-log">
        <h4>Timestamped code log</h4>
        <div className="row">
          {[
            "CMO present",
            "AED ready",
            "Rhythm review",
            "Return of circulation",
          ].map((label) => (
            <button
              className="btn"
              key={label}
              onClick={() =>
                persist({
                  ...record,
                  events: [
                    ...(record.events || []),
                    { label, seconds: codeElapsed(record), at: Date.now() },
                  ],
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {record.events?.length ? (
          <ol>
            {record.events.slice(-12).map((event, i) => (
              <li key={event.at + "-" + i}>
                <b>{formatDuration(event.seconds)}</b> {event.label}
              </li>
            ))}
          </ol>
        ) : (
          <p className="small muted">
            No events recorded. Buttons record observations; they do not confirm
            a clinical finding.
          </p>
        )}
        <button
          className="text-button"
          disabled={record.running}
          onClick={() => {
            saveClinicalRecord(pid, "cpr-session", {
              elapsedSeconds: elapsed,
              method: method.id,
              events: record.events || [],
              endedAt: Date.now(),
            });
            persist({
              running: false,
              elapsedMs: 0,
              method: method.id,
              events: [],
            });
          }}
        >
          Save code summary and reset timer
        </button>
        <p className="small muted">
          {sandboxEnabled(state)
            ? "Private code log · no CMO notification or Earth report."
            : "Saved on this device. Use the protocol's priority note to send a clinical summary."}{" "}
          2-minute reminders coordinate a trained team; do not pause
          compressions automatically.
        </p>
      </div>
      <a
        className="small"
        href={EMERGENCY_SOURCES.cpr}
        target="_blank"
        rel="noreferrer"
      >
        DGLRM / ESAM microgravity resuscitation guideline
      </a>
    </Panel>
  );
}
