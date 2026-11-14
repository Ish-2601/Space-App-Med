import React from "react";
import { useStore, doseSummary, activeEvent, startSolarEvent, setSheltered, endSolarEvent, ENVIRONMENTS, EMERGENCIES } from "../backend/api.js";
import { round1 } from "../lib.js";
import useNow from "../components/useNow.js";

export default function Radiation({ person }) {
  const state = useStore();
  const now = useNow();
  const pid = person.id;
  const d = doseSummary(state, pid);
  const ev = activeEvent(state);
  const env = ENVIRONMENTS[state.mission.environment];
  const color = d.pct > 80 ? "#e74c3c" : d.pct > 50 ? "#f1c40f" : "#2ecc71";
  const last = state.events.find((e) => !e.active);
  const steps = EMERGENCIES.find((e) => e.id === "spe").steps;

  return (
    <div>
      <h2>Radiation</h2>
      <div className="card">
        <div><b>{round1(d.dose)} mSv</b> of NASA's {d.limit} mSv career limit ({round1(d.pct)}%)</div>
        <div className="meter"><div style={{ width: `${Math.min(100, d.pct)}%`, background: color }} /></div>
        <div className="muted small">Yellow above 50%, red above 80%. You can't see or feel radiation; your dosimeter tracks it.</div>
      </div>

      <div className="grid3">
        <div className="card stat"><div className="muted small">Dose rate here</div><div className="big-ish">{d.rate} mSv/day</div><div className="muted small">{env.label}</div></div>
        <div className="card stat"><div className="muted small">Days until 50% / 80%</div><div className="big-ish">{d.daysTo50} / {d.daysTo80}</div></div>
        <div className="card stat"><div className="muted small">Days until limit</div><div className="big-ish">{d.daysTo100}</div></div>
      </div>
      <p className="muted small">{env.note} Earth background is about 2 mSv per year.</p>

      <h3>Solar particle events</h3>
      {!ev && (
        <>
          <p>No event right now. Space weather is monitored around the clock.</p>
          <button className="btn" onClick={() => startSolarEvent(40)}>Simulate a solar particle event (demo)</button>
          {last && (
            <p className="muted small">
              Last event: you received {last.doses[pid] ?? "?"} mSv ({last.sheltered[pid] ? "sheltered" : "not sheltered"}).
            </p>
          )}
        </>
      )}
      {ev && (
        <div className="alert red">
          <b>☢ Solar particle event in progress · all-clear in {Math.max(0, Math.ceil((ev.endsAt - now) / 1000))} s</b>
          <ol>{steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="row">
            {ev.sheltered[pid]
              ? <button className="btn" onClick={() => setSheltered(pid, false)}>I left the shelter</button>
              : <button className="btn primary" onClick={() => setSheltered(pid, true)}>I'm in the storm shelter</button>}
            <button className="btn small" onClick={endSolarEvent}>End event now (demo)</button>
          </div>
          <h4>Crew shelter status</h4>
          <ul>{state.crew.map((p) => <li key={p.id}>{ev.sheltered[p.id] ? "✅" : "❌"} {p.name}</li>)}</ul>
          <p className="small">Sheltering cuts the event dose by about 90% in this simulation.</p>
        </div>
      )}
    </div>
  );
}
