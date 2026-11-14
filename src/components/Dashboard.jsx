import React, { useState } from "react";
import Crewmate from "./Crewmate.jsx";
import { useStore, ENVIRONMENTS, activeEvent, delayText } from "../backend/api.js";
import Today from "../pages/Today.jsx";
import CheckIn from "../pages/CheckIn.jsx";
import Body from "../pages/Body.jsx";
import Trends from "../pages/Trends.jsx";
import Radiation from "../pages/Radiation.jsx";
import Mind from "../pages/Mind.jsx";
import Quests from "../pages/Quests.jsx";
import MedGuide from "../pages/MedGuide.jsx";
import EarthLink from "../pages/EarthLink.jsx";
import Emergency from "../pages/Emergency.jsx";
import Checklists from "../pages/Checklists.jsx";
import CrewView from "../pages/CrewView.jsx";
import MissionControl from "../pages/MissionControl.jsx";

export const PAGES = [
  { id: "today", label: "🏠 Today", C: Today },
  { id: "checkin", label: "📝 Check-in", C: CheckIn },
  { id: "body", label: "🧍 Body map", C: Body },
  { id: "trends", label: "📈 Trends", C: Trends },
  { id: "radiation", label: "☢ Radiation", C: Radiation },
  { id: "mind", label: "🧠 Mind", C: Mind },
  { id: "quests", label: "🏆 Quests", C: Quests },
  { id: "medguide", label: "🩹 Med guide", C: MedGuide },
  { id: "checklists", label: "✅ Checklists", C: Checklists },
  { id: "earth", label: "🛰 Earth link", C: EarthLink },
  { id: "crew", label: "🩺 Crew (CMO)", C: CrewView },
  { id: "mission", label: "⚙ Mission control", C: MissionControl },
  { id: "emergency", label: "🚨 Emergency", C: Emergency },
];

// One astronaut's personal app: mission bar, sidebar navigation, current page
export default function Dashboard({ person, onSwitch }) {
  const state = useStore();
  const [nav, setNav] = useState({ page: "today", params: {} });
  const go = (page, params = {}) => setNav({ page, params });
  const env = ENVIRONMENTS[state.mission.environment];
  const ev = activeEvent(state);
  const unread = state.notifications.filter((n) => !n.read).length;
  const queued = state.reports.filter((r) => r.status === "queued").length;
  const Page = PAGES.find((p) => p.id === nav.page).C;

  return (
    <div className="app">
      <header>
        <div className="who">
          <Crewmate color={person.color} size={44} />
          <div>
            <h1>{person.name}</h1>
            <span className="muted">{person.role}</span>
          </div>
        </div>
        <div className="mission-bar">
          <span>{state.mission.name} · day {state.mission.day}</span>
          <span>{env.label} · {env.gravity}</span>
          <span>🕑 Earth delay {delayText(env)}</span>
          <span className={state.link.online ? "" : "warn"}>
            {state.link.online ? "📡 Link up" : "📴 Offline"}{queued ? ` · ${queued} queued` : ""}
          </span>
          <button className="btn small" onClick={() => go("crew")}>🔔 {unread}</button>
          <button className="btn small" onClick={onSwitch}>Switch crew member</button>
        </div>
      </header>

      {ev && (
        <div className="alert red banner" onClick={() => go("radiation")}>
          ☢ Solar particle event: {ev.sheltered[person.id] ? "you are sheltered. Stay until the all-clear." : "go to the storm shelter now. Tap here."}
        </div>
      )}

      <div className="layout">
        <nav className="sidebar">
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={"nav-btn" + (nav.page === p.id ? " active" : "") + (p.id === "emergency" ? " danger" : "")}
              onClick={() => go(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <section className="page">
          <Page key={nav.page + JSON.stringify(nav.params)} person={person} go={go} params={nav.params} />
        </section>
      </div>
      <footer className="muted small">Prototype for NASA Space Apps 2026 · SIMULATED DATA · not medical advice</footer>
    </div>
  );
}
