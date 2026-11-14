import React, { useState } from "react";
import { useStore, addJournal, deleteJournal, sendReport, historyOf, COPING } from "../backend/api.js";

export default function Mind({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const [text, setText] = useState("");
  const [mood, setMood] = useState(7);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const entries = state.journal[pid];
  const last7 = historyOf(state, pid).slice(-7).map((r) => r.mood);

  function save() {
    if (!text.trim()) { setError("Write something first"); return; }
    addJournal(pid, text, mood);
    setText("");
  }

  return (
    <div>
      <h2>Mind and mood</h2>
      <p>Mood over the last 7 days: {last7.join(" · ")} <button className="btn small" onClick={() => go("trends", { indicator: "mood" })}>Trend</button></p>

      <h3>Private journal</h3>
      <p className="muted small">Only you can see this. NASA uses journaling to help crews cope with isolation.</p>
      <textarea rows="4" value={text} placeholder="How was today?" onChange={(e) => { setText(e.target.value); setError(""); }} />
      <div className="row">
        <label>Mood now: {mood}/10 <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(Number(e.target.value))} /></label>
        <button className="btn primary" onClick={save}>Save entry</button>
      </div>
      {error && <p className="error">{error}</p>}
      {entries.map((j) => (
        <div key={j.id} className="card journal">
          <div className="muted small">Day {j.day} · mood {j.mood}/10 · {new Date(j.ts).toLocaleTimeString()}</div>
          <p>{j.text}</p>
          <button className="btn small" onClick={() => deleteJournal(pid, j.id)}>Delete</button>
        </div>
      ))}

      <h3>Ideas that help</h3>
      <ul>{COPING.map((c) => <li key={c}>{c}</li>)}</ul>

      <h3>Need to talk?</h3>
      <button className="btn" onClick={() => { sendReport(pid, "psych", "Requesting a private conference with ground support."); setSent(true); }}>
        Request a private conference with ground support
      </button>
      {sent && <p className="muted">Request queued. Track it in Earth link.</p>}
    </div>
  );
}
