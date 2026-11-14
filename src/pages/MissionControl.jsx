import React, { useState } from "react";
import { useStore, ENVIRONMENTS, delayText, setEnvironment, setDemoSpeed, advanceDay, startSolarEvent, setLinkOnline, resetAll, exportData } from "../backend/api.js";

// Demo and mission settings
export default function MissionControl() {
  const state = useStore();
  const [confirm, setConfirm] = useState(false);
  const env = ENVIRONMENTS[state.mission.environment];

  function download() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `astrohealth-day${state.mission.day}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h2>Mission control</h2>
      <div className="card">
        <h3>Environment</h3>
        <select value={state.mission.environment} onChange={(e) => setEnvironment(e.target.value)}>
          {Object.entries(ENVIRONMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <p className="small">{env.gravity} · {env.doseRate} mSv/day · Earth delay {delayText(env)}</p>
        <p className="muted small">{env.note}</p>
      </div>

      <div className="card">
        <h3>Demo controls</h3>
        <div className="row">
          <button className="btn" onClick={advanceDay}>Advance to day {state.mission.day + 1}</button>
          <button className="btn" onClick={() => startSolarEvent(40)}>Trigger solar particle event</button>
          <button className="btn" onClick={() => setLinkOnline(!state.link.online)}>{state.link.online ? "Cut Earth link" : "Restore Earth link"}</button>
        </div>
        <label className="small">
          Demo speed: 1 real second = {state.demoSpeed} simulated seconds{" "}
          <select value={state.demoSpeed} onChange={(e) => setDemoSpeed(Number(e.target.value))}>
            {[1, 10, 60, 120].map((n) => <option key={n} value={n}>{n}×</option>)}
          </select>
        </label>
      </div>

      <div className="card">
        <h3>Data</h3>
        <p className="muted small">All data is stored on this device (onboard computer) and works offline.</p>
        <div className="row">
          <button className="btn" onClick={download}>Export data (JSON)</button>
          {!confirm && <button className="btn danger" onClick={() => setConfirm(true)}>Reset all data</button>}
          {confirm && (
            <>
              <span>Reset everything to the starting demo data?</span>
              <button className="btn danger" onClick={() => { resetAll(); setConfirm(false); }}>Yes, reset</button>
              <button className="btn" onClick={() => setConfirm(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
