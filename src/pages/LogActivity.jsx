import React, { useState } from "react";
import { useStore, rowFor, logWorkout, addWater, takeMed, medsDue, WORKOUTS } from "../backend/api.js";

// Quick logging: workouts, water, scheduled supplements
export default function LogActivity({ person }) {
  const state = useStore();
  const pid = person.id;
  const row = rowFor(state, pid);
  const [type, setType] = useState(WORKOUTS[0].id);
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState("");
  const workoutsToday = state.exerciseLog[pid].filter((w) => w.day === state.mission.day);
  const meds = medsDue(state, pid);
  const label = (id) => WORKOUTS.find((w) => w.id === id)?.label || id;

  function addWorkout() {
    const m = Number(minutes);
    if (!m || m <= 0 || m > 300) {
      setError("Enter minutes between 1 and 300");
      return;
    }
    logWorkout(pid, type, m);
    setError("");
  }

  return (
    <div>
      <h2>Log activity · day {state.mission.day}</h2>

      <div className="card">
        <h3>Exercise: {row.exercise} / 90 min today</h3>
        <div className="meter"><div style={{ width: `${Math.min(100, (row.exercise / 90) * 100)}%`, background: row.exercise >= 90 ? "#2ecc71" : "#f1c40f" }} /></div>
        <p className="small muted">ISS crews exercise about 1.5 hours a day, 6–7 days a week, to protect bones, muscles and heart. Wearable minutes are included automatically.</p>
        <div className="row">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {WORKOUTS.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <input type="number" min="1" max="300" value={minutes} onChange={(e) => { setMinutes(e.target.value); setError(""); }} style={{ width: 90 }} />
          <span>min</span>
          <button className="btn primary" onClick={addWorkout}>Add workout</button>
        </div>
        {error && <p className="error">{error}</p>}
        {workoutsToday.length > 0 && (
          <ul className="small">{workoutsToday.map((w) => <li key={w.id}>{label(w.type)}: {w.minutes} min</li>)}</ul>
        )}
      </div>

      <div className="card">
        <h3>Water: {row.water} / 2.0 L today</h3>
        <div className="meter"><div style={{ width: `${Math.min(100, (row.water / 2) * 100)}%`, background: row.water >= 2 ? "#2ecc71" : "#f1c40f" }} /></div>
        <p className="small muted">Staying hydrated lowers kidney stone risk (calcium from bone loss) and helps prevent fainting at landing.</p>
        <div className="row">
          <button className="btn" onClick={() => addWater(pid, 0.25)}>+250 mL</button>
          <button className="btn" onClick={() => addWater(pid, 0.5)}>+500 mL (drink bag)</button>
        </div>
      </div>

      <div className="card">
        <h3>Scheduled supplements</h3>
        {meds.length === 0 && <p className="muted">None scheduled.</p>}
        {meds.map((m) => (
          <div key={m.med} className="row">
            <span>{m.done ? "✅" : "⬜"} {m.name} <span className="muted small">({m.freq})</span></span>
            {!m.done && <button className="btn small" onClick={() => takeMed(pid, m.med)}>Mark taken</button>}
          </div>
        ))}
        <p className="small muted">Taking a dose uses one from the shared med kit. Other medicines: see Med kit.</p>
      </div>
    </div>
  );
}
