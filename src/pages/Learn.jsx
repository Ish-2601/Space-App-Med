import React, { useState } from "react";
import { HAZARDS, RISKS, GUIDING_QUESTIONS, SOURCES } from "../backend/nasa.js";
import { PageTitle, Panel, Back, Icon } from "../components/ConsoleUI.jsx";
const LABELS = {
  checkin: "Check-in",
  checks: "Medical checks",
  photos: "Photos",
  medguide: "Help",
  trends: "Trends",
  emergency: "Emergency",
  checklists: "Checklists",
  medkit: "Med kit",
  habitat: "Ship",
  log: "Activity",
  quests: "Progress",
  body: "Body",
  mind: "Mind",
  crew: "Crew",
  today: "Today",
  learn: "Learn",
  radiation: "Radiation",
};
export default function Learn({ go }) {
  const [hazard, setHazard] = useState(null),
    risks = hazard ? RISKS.filter((r) => r.hazards.includes(hazard)) : RISKS;
  return (
    <div>
      <Back onClick={() => go("more")}>More</Back>
      <PageTitle
        eyebrow="Learn"
        title="How NASA Med maps to NASA's research"
        description="Five hazards shape life beyond Earth. Explore the risks they create and the tools that watch for changes."
      />
      <div className="hazard-grid">
        {HAZARDS.map((h, i) => (
          <button
            key={h.id}
            className={"hazard-card " + (hazard === h.id ? "selected" : "")}
            aria-pressed={hazard === h.id}
            onClick={() => setHazard(hazard === h.id ? null : h.id)}
          >
            <span className="icon-tile">
              <Icon name={["radiation", "crew", "orbit", "body", "air"][i]} />
            </span>
            <h2>{h.name}</h2>
            <p className="muted">{h.summary}</p>
            <span className="small">
              Explore linked risks <Icon name="arrow" size={14} />
            </span>
          </button>
        ))}
      </div>
      {hazard && (
        <Panel title="Hazard details">
          <h2>{HAZARDS.find((h) => h.id === hazard).name}</h2>
          <ul>
            {HAZARDS.find((h) => h.id === hazard).facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button className="btn" onClick={() => setHazard(null)}>
            Show all risks
          </button>
        </Panel>
      )}
      <Panel
        title={hazard ? "Related risks" : "All " + RISKS.length + " risks"}
        className="research-panel"
      >
        <div className="table-scroll">
          <table className="table research-table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>What happens</th>
                <th>Where NASA Med helps</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <span className="risk-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.name}
                    </a>
                  </td>
                  <td>
                    {r.summary}
                    <details>
                      <summary>Countermeasures</summary>
                      <ul>
                        {r.countermeasures.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td>
                    <div className="risk-links">
                      {r.tracks.map((t) => (
                        <button key={t} onClick={() => go(t)}>
                          {LABELS[t] || t}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="main-with-aside">
        <Panel title="The challenge's questions">
          {GUIDING_QUESTIONS.map((g) => (
            <details className="research-question" key={g.q}>
              <summary>{g.q}</summary>
              <p className="muted">{g.a}</p>
            </details>
          ))}
        </Panel>
        <Panel title="Sources">
          <ul className="sources-list">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="small muted">
            All crew data is simulated. Some screening thresholds are
            team-defined. NASA Med is a Space Apps prototype, not a medical
            device.
          </p>
        </Panel>
      </div>
    </div>
  );
}
