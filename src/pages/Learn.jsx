import React, { useState } from "react";
import { HAZARDS, RISKS, GUIDING_QUESTIONS, SOURCES } from "../backend/nasa.js";

const PAGE_LABEL = {
  checkin: "Check-in", checks: "Checks", photos: "Photo log", medguide: "Med guide", trends: "Trends", emergency: "Emergency",
  checklists: "Checklists", medkit: "Med kit", habitat: "Habitat", log: "Log activity", quests: "Quests", body: "Body map",
  mind: "Mind", crew: "Crew (CMO)", today: "Today", learn: "Learn", radiation: "Radiation",
};

// NASA hazards and risks, how AstroHealth covers each, and the challenge's guiding questions
export default function Learn({ go }) {
  const [hazard, setHazard] = useState(null);
  const risks = hazard ? RISKS.filter((r) => r.hazards.includes(hazard)) : RISKS;

  return (
    <div>
      <h2>Learn: NASA's hazards and risks</h2>
      <p className="muted">NASA's Human Research Program groups spaceflight dangers into 5 hazards and tracks specific health risks. Here's each one and where AstroHealth helps.</p>

      <div className="grid3">
        {HAZARDS.map((h) => (
          <button key={h.id} className={"card hazard" + (hazard === h.id ? " selected" : "")} onClick={() => setHazard(hazard === h.id ? null : h.id)}>
            <h3>{h.icon} {h.name}</h3>
            <p className="small">{h.summary}</p>
            <ul className="small">{h.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          </button>
        ))}
      </div>

      <div className="row spread">
        <h3>{hazard ? `Risks linked to ${HAZARDS.find((h) => h.id === hazard).name}` : `All ${RISKS.length} HRP risks`}</h3>
        {hazard && <button className="btn small" onClick={() => setHazard(null)}>Show all</button>}
      </div>
      <table className="table">
        <thead><tr><th>Risk</th><th>What happens</th><th>Countermeasures</th><th>In AstroHealth</th></tr></thead>
        <tbody>
          {risks.map((r) => (
            <tr key={r.id}>
              <td><a href={r.url} target="_blank" rel="noreferrer">{r.name}</a></td>
              <td className="small">{r.summary}</td>
              <td className="small">{r.countermeasures.join("; ")}</td>
              <td>{r.tracks.map((t) => <button key={t} className="btn small" onClick={() => go(t)}>{PAGE_LABEL[t]}</button>)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>The challenge's questions, answered</h3>
      {GUIDING_QUESTIONS.map((g) => (
        <details key={g.q} className="card">
          <summary><b>{g.q}</b></summary>
          <p>{g.a}</p>
        </details>
      ))}

      <h3>About this prototype</h3>
      <p className="small">
        Built for the NASA Space Apps Challenge 2026. All crew data is simulated. Thresholds come from NASA, CSA and clinical references; some screening
        thresholds are team-defined and labelled as such. AstroHealth is not a medical device and not medical advice.
      </p>
      <h3>Sources</h3>
      <ul className="small">{SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
    </div>
  );
}
