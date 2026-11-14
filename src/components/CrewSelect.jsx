import React from "react";
import Crewmate from "./Crewmate.jsx";
import { useStore, crewOverview, activeEvent, ENVIRONMENTS, delayText } from "../backend/api.js";
import { COLORS, STATUS_LABEL } from "../lib.js";

// First screen: everyone on board. Pick a crew member to open their health view.
export default function CrewSelect({ onSelect, onMedical }) {
  const state = useStore();
  const env = ENVIRONMENTS[state.mission.environment];
  const ev = activeEvent(state);

  return (
    <div className="crew-select">
      <h1>🚀 AstroHealth</h1>
      <p className="muted">
        {state.mission.name} · day {state.mission.day} · {env.label} · Earth delay {delayText(env)}
      </p>
      {ev && <div className="alert red">☢ Solar particle event in progress: all crew to the storm shelter</div>}
      <h2>Who's checking in?</h2>
      <div className="crew-grid">
        {crewOverview(state).map(({ person: p, status, score, checkedIn, sheltered }) => (
          <button key={p.id} className="crew-card" onClick={() => onSelect(p.id)}>
            <Crewmate color={p.color} />
            <span className="crew-name">{p.name}</span>
            <span className="muted">{p.role}</span>
            <span className="crew-status">
              <span className="dot" style={{ background: COLORS[status] }} />
              {STATUS_LABEL[status]}
            </span>
            <span className="muted small">
              Score {score} · {checkedIn ? "checked in today" : "check-in due"}
              {sheltered != null && (sheltered ? " · sheltered" : " · NOT sheltered")}
            </span>
          </button>
        ))}
      </div>
      <button className="btn" style={{ marginTop: 24 }} onClick={onMedical}>🩺 Crew medical officer view</button>
      <p className="badge" style={{ marginTop: 16 }}>Prototype · SIMULATED DATA · not medical advice</p>
    </div>
  );
}
