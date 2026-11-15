import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../backend/store.js";
import { sandboxEnabled } from "../../backend/sandbox.js";
import {
  clinicalRecords,
  latestClinicalRecord,
} from "../../backend/clinicalStore.js";
import {
  catalogModuleDefaults,
  evaluateCatalogModule,
  getCatalogModule,
  saveCatalogModule,
  savePrivateCatalogDraft,
} from "../../backend/catalogModules.js";
import "../../catalog-modules.css";

const patterns = {
  "Two short pulses": [120, 140, 120],
  "Three long pulses": [350, 180, 350, 180, 350],
  "Short-long-short": [100, 120, 400, 120, 100],
};
const tutorialSteps = {
  "Locate the medical pack": [
    "Read the pack color and label",
    "Match the inventory drawer location",
    "Check the seal and expiry label",
  ],
  "Prepare a clean observation workspace": [
    "Find the approved clean workspace",
    "Review the hygiene checklist",
    "Secure equipment before observation",
  ],
  "Document a patient handoff": [
    "Record the concern and onset",
    "Record observations and timestamps",
    "State pending actions and reviewer",
  ],
};

export function catalogModuleFocusTargets(element) {
  return [
    ...element.querySelectorAll("button,input,select,textarea,a[href],summary"),
  ].filter((control) => {
    if (control.disabled || control.getClientRects().length === 0) return false;
    for (
      let ancestor = control.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      if (ancestor.tagName !== "DETAILS" || ancestor.open) continue;
      const summary = [...ancestor.children].find(
        (child) => child.tagName === "SUMMARY",
      );
      if (!summary?.contains(control)) return false;
    }
    return true;
  });
}

export default function CatalogModuleModal({ item, person, onClose, go }) {
  const module = getCatalogModule(item.id);
  const state = useStore();
  const privateMode = sandboxEnabled(state);
  const recordKey = "catalog-" + item.id;
  const load = () => ({
    ...catalogModuleDefaults(module),
    ...(latestClinicalRecord(state, person.id, recordKey)?.payload?.values ||
      {}),
  });
  const [values, setValues] = useState(load);
  const [output, setOutput] = useState(
    () =>
      latestClinicalRecord(state, person.id, recordKey)?.payload?.result ||
      null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [listening, setListening] = useState(false);
  const [navigationStep, setNavigationStep] = useState(1);
  const modal = useRef(null),
    recognition = useRef(null),
    visualTimers = useRef([]),
    dirty = useRef(false),
    current = useRef(values);
  current.current = values;
  useEffect(() => {
    setValues(load());
    setOutput(
      latestClinicalRecord(state, person.id, recordKey)?.payload?.result ||
        null,
    );
    setError("");
    setMessage("");
    dirty.current = false;
  }, [privateMode, person.id, recordKey]);
  useEffect(() => {
    const previous = document.activeElement;
    modal.current?.querySelector("button,input,select,textarea")?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
      previous?.focus?.();
    };
  }, []);
  useEffect(
    () => () => {
      recognition.current?.abort?.();
      visualTimers.current.forEach(clearTimeout);
      if (typeof navigator !== "undefined") navigator.vibrate?.(0);
    },
    [],
  );
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setSeconds((old) => Math.min(old + 1, module.timerSeconds || 30)),
      1000,
    );
    return () => clearInterval(timer);
  }, [running, module.timerSeconds]);
  useEffect(() => {
    if (seconds >= (module.timerSeconds || 30)) setRunning(false);
  }, [seconds, module.timerSeconds]);
  useEffect(() => {
    if (!privateMode || !dirty.current) return;
    const timer = setTimeout(
      () => savePrivateCatalogDraft(item.id, person.id, current.current),
      400,
    );
    return () => clearTimeout(timer);
  }, [values, privateMode, person.id, recordKey]);
  useEffect(
    () => () => {
      if (privateMode && dirty.current)
        savePrivateCatalogDraft(item.id, person.id, current.current);
    },
    [privateMode, person.id, recordKey],
  );
  function change(key, value) {
    dirty.current = true;
    setValues((old) => ({ ...old, [key]: value }));
    setOutput(null);
    setMessage("");
    setError("");
  }
  function submit(event) {
    event.preventDefault();
    try {
      const evaluated = evaluateCatalogModule(item.id, values);
      saveCatalogModule(item.id, person.id, values);
      dirty.current = false;
      setOutput(evaluated.result);
      setError("");
      setMessage(
        privateMode
          ? "Saved only in Private Sandbox."
          : "Saved to this crew member’s local module history.",
      );
    } catch (problem) {
      setError(problem.message);
    }
  }
  function keyDown(event) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const elements = catalogModuleFocusTargets(modal.current);
    if (!elements.length) return;
    if (event.shiftKey && document.activeElement === elements[0]) {
      event.preventDefault();
      elements.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
      event.preventDefault();
      elements[0].focus();
    }
  }
  function dictate() {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage(
        "Speech recognition is unavailable. Type into the note field; it works offline.",
      );
      return;
    }
    const active = new Recognition();
    recognition.current = active;
    active.continuous = false;
    active.interimResults = false;
    active.onresult = (event) => {
      const transcript = [...event.results]
        .map((r) => r[0].transcript)
        .join(" ");
      change("note", (current.current.note + " " + transcript).trim());
      setListening(false);
    };
    active.onerror = () => {
      setListening(false);
      setMessage(
        "Microphone recognition could not finish. Type the note to continue.",
      );
    };
    active.onend = () => setListening(false);
    try {
      active.start();
      setListening(true);
    } catch {
      setMessage("Speech recognition could not start. Use the note field.");
    }
  }
  function haptic() {
    visualTimers.current.forEach(clearTimeout);
    visualTimers.current = [];
    const sequence = patterns[values.pattern];
    let offset = 0;
    sequence.forEach((duration, index) => {
      visualTimers.current.push(
        setTimeout(() => setPulse(index % 2 === 0), offset),
      );
      offset += duration;
    });
    visualTimers.current.push(setTimeout(() => setPulse(false), offset));
    let supported = false;
    try {
      supported = !!navigator.vibrate?.(sequence);
    } catch {
      supported = false;
    }
    setMessage(
      supported
        ? "Vibration requested; visual pulse also shown."
        : "Device vibration unavailable; showing the same pattern visually.",
    );
  }
  function navigate(page) {
    onClose();
    go(page);
  }
  function simulateGesture() {
    visualTimers.current.forEach(clearTimeout);
    setMessage(`Holding simulated gesture for ${values.dwell} seconds…`);
    const command = values.command;
    visualTimers.current = [
      setTimeout(
        () => {
          if (command === "Nod: next step") {
            setNavigationStep(navigationStep + 1);
            setMessage(
              "Simulated next-step command recognized. Step " +
                (navigationStep + 1) +
                ".",
            );
          } else
            navigate(
              command === "Look left: Home"
                ? "today"
                : command === "Look right: Body"
                  ? "body"
                  : "emergency",
            );
        },
        Number(values.dwell) * 1000,
      ),
    ];
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            module: item.id,
            crewId: person.id,
            private: privateMode,
            values,
            result: output,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `nasa-med-module-${item.id}-${person.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const history = clinicalRecords(state, person.id, recordKey).slice(0, 5);
  return (
    <div
      className="catalog-module-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-module-title"
        className={"catalog-module-modal" + (privateMode ? " is-private" : "")}
        onKeyDown={keyDown}
      >
        <header className="catalog-module-header">
          <div>
            <p className="eyebrow">LOCAL PROTOTYPE · MODULE {item.id}</p>
            <h2 id="catalog-module-title">{module.title}</h2>
            <p className="muted">
              {person.name} ·{" "}
              {privateMode ? "Private Sandbox" : "Crew-local record"}
            </p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            aria-label="Close module"
          >
            Close ×
          </button>
        </header>
        <p className="catalog-module-note">{module.note}</p>
        {module.source && (
          <p className="small muted">
            <a href={module.source.url} target="_blank" rel="noreferrer">
              {module.source.title}
            </a>
          </p>
        )}
        <form onSubmit={submit}>
          <div className="catalog-module-fields">
            {module.fields.map((field) => (
              <label key={field.key}>
                {field.label}
                {field.type === "select" ? (
                  <select
                    value={values[field.key]}
                    onChange={(e) => change(field.key, e.target.value)}
                  >
                    {field.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    maxLength={6000}
                    value={values[field.key]}
                    onChange={(e) => change(field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="number"
                    required
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key]}
                    onChange={(e) => change(field.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          {module.widget === "dictation" && (
            <button type="button" className="btn" onClick={dictate}>
              {listening
                ? "Stop dictation"
                : "Start optional microphone dictation"}
            </button>
          )}
          {module.widget === "tutorial" && (
            <section
              className="catalog-tutorial"
              aria-label="Timed procedure orientation"
            >
              <div className="catalog-tutorial-steps">
                {(
                  tutorialSteps[values.procedure] ||
                  tutorialSteps["Locate the medical pack"]
                ).map((label, i) => (
                  <div
                    className={Math.floor(seconds / 10) === i ? "active" : ""}
                    key={label}
                  >
                    <svg viewBox="0 0 64 64" role="img" aria-label={label}>
                      <rect x="10" y="12" width="44" height="42" rx="5" />
                      <path
                        d={
                          i === 0
                            ? "M25 12V6h14v6M22 32h20M32 22v20"
                            : i === 1
                              ? "M20 22h24M20 32h24M20 42h18"
                              : "M20 33l9 9 17-20"
                        }
                      />
                    </svg>
                    <b>
                      {i + 1}. {label}
                    </b>
                  </div>
                ))}
              </div>
              <p aria-live="polite">{seconds} / 30 seconds</p>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (seconds >= 30) setSeconds(0);
                  setRunning(!running);
                }}
              >
                {running
                  ? "Pause"
                  : seconds >= 30
                    ? "Replay orientation"
                    : "Start orientation"}
              </button>
            </section>
          )}
          {(module.widget === "navigation" || module.widget === "thumb") && (
            <nav
              className={
                "catalog-nav-preview " +
                (values.hand === "Left" ? "left" : "right")
              }
              aria-label="Simulated navigation preview"
              style={{ "--reach": (values.reach || 160) + "px" }}
            >
              {[
                ["today", "Home"],
                ["body", "Body"],
                ["emergency", "Emergency"],
              ].map(([page, label]) => (
                <button
                  key={page}
                  className="btn"
                  type="button"
                  onClick={() => navigate(page)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
          {module.widget === "haptic" && (
            <div className="catalog-haptic">
              <span
                className={"catalog-haptic-lamp " + (pulse ? "on" : "")}
                aria-label={pulse ? "Pulse on" : "Pulse off"}
              />
              <button className="btn" type="button" onClick={haptic}>
                Test pattern
              </button>
            </div>
          )}
          {module.widget === "palette" && (
            <div
              className={
                "catalog-palette " +
                (values.palette === "Monochrome"
                  ? "mono"
                  : values.palette.startsWith("Protanopia")
                    ? "protan"
                    : "deutan")
              }
            >
              <span data-status="ok">✓ In range</span>
              <span data-status="review">! Needs review</span>
              <span data-status="urgent">▲ Urgent</span>
            </div>
          )}
          {error && (
            <p role="alert" className="catalog-module-error">
              {error}
            </p>
          )}
          <div className="catalog-module-actions">
            <button className="btn primary" type="submit">
              Evaluate & save locally
            </button>
            <span className="small muted">No external message is sent.</span>
          </div>
        </form>
        {message && <p role="status">{message}</p>}
        {output && (
          <section className="catalog-module-result" aria-label="Module result">
            <h3>{output.headline}</h3>
            <dl>
              {output.metrics.map((entry, index) => (
                <div key={index}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
            <p>{output.explanation}</p>
            <button className="btn small" type="button" onClick={download}>
              Export this result (JSON)
            </button>
          </section>
        )}
        {module.widget === "navigation" && (
          <button className="btn" type="button" onClick={simulateGesture}>
            Simulate selected gesture · step {navigationStep}
          </button>
        )}
        {!!history.length && (
          <details className="catalog-module-history">
            <summary>
              {history.length} recent saved {privateMode ? "private " : ""}
              entries
            </summary>
            {history.map((record) => (
              <article key={record.id}>
                <b>
                  Mission day {record.day} ·{" "}
                  {record.payload.result?.headline || "Saved entry"}
                </b>
                <p className="small muted">
                  {new Date(record.ts).toLocaleString()}
                </p>
                <button
                  className="btn small"
                  type="button"
                  onClick={() => {
                    setValues({
                      ...catalogModuleDefaults(module),
                      ...record.payload.values,
                    });
                    setOutput(record.payload.result || null);
                    dirty.current = false;
                    setMessage("Loaded saved entry for review.");
                  }}
                >
                  Review this entry
                </button>
              </article>
            ))}
          </details>
        )}
      </section>
    </div>
  );
}
