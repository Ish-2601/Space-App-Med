import React, { useState } from "react";
import { useStore, rowFor, submitCheckIn, SYMPTOMS } from "../backend/api.js";
import { indicators, statusOf, COLORS } from "../lib.js";

// Daily check-in: measurements (pre-filled from sensors where available), vision, motion sickness, symptoms
const AUTO = ["sleep", "exercise", "water", "radiation", "heartRate"]; // read from wearable / devices

export default function CheckIn({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const row = rowFor(state, pid);
  const existing = state.checkins[pid][state.mission.day];
  const [values, setValues] = useState(() => Object.fromEntries(indicators.map((i) => [i.id, row[i.id]])));
  const [vision, setVision] = useState(existing?.vision || "");
  const [motion, setMotion] = useState(existing?.motion || 0);
  const [symptoms, setSymptoms] = useState(existing?.symptoms || []);
  const [error, setError] = useState("");

  const toggleSym = (id) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function submit() {
    const missing = indicators.filter((i) => values[i.id] === "" || values[i.id] == null || Number.isNaN(Number(values[i.id])));
    if (missing.length) {
      setError(`Enter a number for: ${missing.map((i) => i.label).join(", ")}`);
      return;
    }
    submitCheckIn(pid, { values, vision: vision || null, motion, symptoms });
    go("today");
  }

  return (
    <div>
      <h2>Daily check-in</h2>
      {existing && !existing.auto && <p className="alert info">You already checked in today. Submitting again updates today's entry.</p>}
      <p className="muted">Sensor values are pre-filled. Measure the others, then submit. Tap "How and why" for instructions.</p>

      {indicators.map((i) => {
        const s = statusOf(i, Number(values[i.id]));
        return (
          <div key={i.id} className="field" style={{ borderLeftColor: COLORS[s] }}>
            <label>
              <b>{i.label}</b> <span className="muted small">({i.unit}){AUTO.includes(i.id) ? " · from sensors" : ""}</span>
              <input
                type="number" step="any" value={values[i.id]}
                readOnly={i.id === "radiation"}
                onChange={(e) => { setValues({ ...values, [i.id]: e.target.value }); setError(""); }}
              />
            </label>
            <details>
              <summary className="small">How and why</summary>
              <p className="small"><b>How:</b> {i.how}</p>
              <p className="small"><b>Why:</b> {i.why}</p>
              <p className="small muted">Green range: {i.green[0]}–{i.green[1]} {i.unit}</p>
            </details>
          </div>
        );
      })}

      <div className="field">
        <b>Vision self-check</b> <span className="muted small">(weekly: read the near and far chart with each eye)</span>
        <div className="row">
          {[["", "Not done today"], ["normal", "Normal"], ["changed", "Blurry or changed"]].map(([v, label]) => (
            <label key={v} className="radio"><input type="radio" name="vision" checked={vision === v} onChange={() => setVision(v)} /> {label}</label>
          ))}
        </div>
      </div>

      <div className="field">
        <b>Motion sickness: {motion}/10</b>
        <input type="range" min="0" max="10" step="1" value={motion} onChange={(e) => setMotion(Number(e.target.value))} />
      </div>

      <div className="field">
        <b>Any symptoms today?</b>
        <div className="sym-grid">
          {SYMPTOMS.map((s) => (
            <label key={s.id} className="radio">
              <input type="checkbox" checked={symptoms.includes(s.id)} onChange={() => toggleSym(s.id)} /> {s.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <button className="btn primary" onClick={submit}>Submit check-in</button>
    </div>
  );
}
