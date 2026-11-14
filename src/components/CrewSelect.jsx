import React from "react";
import CrewAvatar from "./CrewAvatar.jsx";
import { Brand, Status } from "./ConsoleUI.jsx";
import { useStore, crewOverview, activeEvent, ENVIRONMENTS, delayText } from "../backend/api.js";
import "./CrewSelect.css";

// First screen: everyone on board. Pick a crew member to open their health view.
export default function CrewSelect({ onSelect, onMedical }) {
  const state = useStore();
  const env = ENVIRONMENTS[state.mission.environment];
  const ev = activeEvent(state);

  return (
    <main className="crew-select">
      <div className="crew-select-inner">
        <header className="crew-heading">
          <p className="eyebrow lobby-eyebrow">Crew health · {state.mission.name}</p>
          <h1><Brand /></h1>
          <svg className="crew-orbit" viewBox="0 0 280 18" aria-hidden="true">
            <path d="M2 15 Q132 -8 278 10 Q148 1 20 18Z" fill="currentColor" />
          </svg>
          <h2>Crew health overview</h2>
          <p>Select a profile to open a personal health dashboard.</p>
        </header>

        {ev && <div className="alert red" role="alert">☢ Solar particle event in progress: all crew to the storm shelter</div>}

        <section className="crew-grid" aria-label="Crew profiles">
          {crewOverview(state).map(({ person, status, score, checkedIn, sheltered, checkupRequired }) => (
            <article key={person.id} className={`crew-card crew-card--${status}`} aria-labelledby={`crew-name-${person.id}`}>
              <span className="lobby-role-tab">{person.role}</span>
              <CrewAvatar person={person} onSelect={() => onSelect(person.id)} editable />
              <dl className="crew-details">
                <div className="crew-identity">
                  <dt>Name</dt>
                  <dd>
                    <button id={`crew-name-${person.id}`} className="crew-name" onClick={() => onSelect(person.id)}>{person.name}</button>
                    <span className="crew-role">{person.role}</span>
                  </dd>
                </div>
                <div className="crew-health">
                  <dt>Health score</dt>
                  <dd>
                    <span className="crew-score">{score}%</span>
                    <div className="crew-score-track" role="meter" aria-label={`${person.name} health score`} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${score}%` }} />
                    </div>
                  </dd>
                </div>
                <div className="crew-checkup">
                  <dt>Checkup</dt>
                  <dd className={`crew-checkup-status ${checkupRequired ? "is-necessary" : "is-clear"}`}>
                    <span className="crew-checkup-icon" aria-hidden="true">{checkupRequired ? "!" : "✓"}</span>
                    {checkupRequired ? "Necessary" : "Not necessary"}
                  </dd>
                </div>
              </dl>
              <Status status={status} />
              <p className="crew-checkin">{checkedIn ? "Checked in today" : "Daily check-in due"}</p>
              {sheltered != null && <p className={`crew-shelter ${sheltered ? "" : "danger-text"}`}>{sheltered ? "In storm shelter" : "Not yet sheltered"}</p>}
            </article>
          ))}
        </section>

        <footer className="crew-footer">
          <p className="crew-mission">{state.mission.name} <span>·</span> Day {state.mission.day} <span>·</span> {env.gravity} <span>·</span> Earth delay {delayText(env)}</p>
          <button className="crew-medical-button" onClick={onMedical}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 4H4v5a5 5 0 0 0 10 0V4h-2M9 14v3a4 4 0 0 0 8 0v-3" />
              <circle cx="17" cy="11" r="3" />
            </svg>
            Crew medical officer view <span aria-hidden="true">→</span>
          </button>
          <p className="crew-disclaimer">NASA Space Apps prototype · Simulated data · Not medical advice</p>
        </footer>
      </div>
    </main>
  );
}
