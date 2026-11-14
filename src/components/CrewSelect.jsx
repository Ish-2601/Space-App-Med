import React from "react";
import Crewmate from "./Crewmate.jsx";
import { crew, mission, personStatus, COLORS, STATUS_LABEL } from "../lib.js";

// First screen: everyone on board. Pick a crew member to open their health view.
export default function CrewSelect({ onSelect }) {
  return (
    <div className="crew-select">
      <h1>🚀 AstroHealth</h1>
      <p className="muted">
        {mission.name} · day {mission.day} · Earth delay {mission.earthDelayMin} min
      </p>
      <h2>Who's checking in?</h2>
      <div className="crew-grid">
        {crew.map((p) => {
          const s = personStatus(p);
          return (
            <button key={p.id} className="crew-card" onClick={() => onSelect(p.id)}>
              <Crewmate color={p.color} />
              <span className="crew-name">{p.name}</span>
              <span className="muted">{p.role}</span>
              <span className="crew-status">
                <span className="dot" style={{ background: COLORS[s] }} />
                {STATUS_LABEL[s]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="badge" style={{ marginTop: 24 }}>Prototype · SIMULATED DATA · not medical advice</p>
    </div>
  );
}
