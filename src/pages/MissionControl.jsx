import React, { useState } from "react";
import {
  useStore, ENVIRONMENTS, delayText, setEnvironment, setDemoSpeed, advanceDay, startSolarEvent, setLinkOnline, setCo2Fault,
  setCalibration, resetAll, exportData, exportCsv,
} from "../backend/api.js";

function download(text, filename, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Demo and mission settings
export default function MissionControl({ person }) {
  const state = useStore();
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const env = ENVIRONMENTS[state.mission.environment];

  return (
    <div>
      <h2>Mission control</h2>
      <div className="card">
        <h3>Environment</h3>
        <select value={state.mission.environment} onChange={(e) => setEnvironment(e.target.value)}>
          {Object.entries(ENVIRONMENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <p className="small">{env.gravity} · {env.doseRate} mSv/day · Earth delay {delayText(env)} · cabin {env.atmosphere.pressureKpa} kPa, {env.atmosphere.o2Pct}% O₂</p>
        <p className="muted small">{env.note} Changing environment affects new days: dose rate, delay, focus areas, which checks apply.</p>
      </div>

      <div className="card">
        <h3>Demo controls</h3>
        <div className="row">
          <button className="btn" onClick={advanceDay}>Advance to day {state.mission.day + 1}</button>
          <button className="btn" onClick={() => startSolarEvent(40)}>Trigger solar particle event</button>
          <button className="btn" onClick={() => setCo2Fault(!state.habitat.fault)}>{state.habitat.fault ? "Fix CO₂ scrubber" : "Trigger CO₂ scrubber fault"}</button>
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
        <p className="muted small">All data is stored on this device (the onboard computer) and works offline. Photos are stored separately and are not in the exports.</p>
        <div className="row">
          <button className="btn" onClick={() => download(exportCsv(person.id), `astrohealth-${person.id}-day${state.mission.day}.csv`, "text/csv")}>Export my readings (CSV)</button>
          <button className="btn" onClick={() => download(exportData(), `astrohealth-day${state.mission.day}.json`, "application/json")}>Export all data (JSON)</button>
          <button className="btn" onClick={() => { setCalibration(null); setMsg("Screen calibration cleared. The vision chart will ask again."); }}>Reset screen calibration</button>
        </div>
        <div className="row">
          {!confirm && <button className="btn danger" onClick={() => setConfirm(true)}>Reset all data</button>}
          {confirm && (
            <>
              <span>Reset everything (including photos) to the starting demo data?</span>
              <button className="btn danger" onClick={async () => { await resetAll(); setConfirm(false); setMsg("Data reset."); }}>Yes, reset</button>
              <button className="btn" onClick={() => setConfirm(false)}>Cancel</button>
            </>
          )}
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="card">
        <h3>Install</h3>
        <p className="small">AstroHealth works offline. In Chrome or Edge, use "Install app" in the address bar (or "Add to Home Screen" on a phone or tablet) to run it like a native app.</p>
      </div>
    </div>
  );
}
