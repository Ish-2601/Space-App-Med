import React, { useState } from "react";
import Crewmate from "./Crewmate.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { useStore, envOf, activeEvent, delayText } from "../backend/api.js";
import Today from "../pages/Today.jsx";
import CheckIn from "../pages/CheckIn.jsx";
import LogActivity from "../pages/LogActivity.jsx";
import Quests from "../pages/Quests.jsx";
import Checks from "../pages/Checks.jsx";
import Photos from "../pages/Photos.jsx";
import Body from "../pages/Body.jsx";
import Trends from "../pages/Trends.jsx";
import Radiation from "../pages/Radiation.jsx";
import Mind from "../pages/Mind.jsx";
import MedGuide from "../pages/MedGuide.jsx";
import MedKit from "../pages/MedKit.jsx";
import Checklists from "../pages/Checklists.jsx";
import Emergency from "../pages/Emergency.jsx";
import EarthLink from "../pages/EarthLink.jsx";
import Habitat from "../pages/Habitat.jsx";
import CrewView from "../pages/CrewView.jsx";
import Learn from "../pages/Learn.jsx";
import MissionControl from "../pages/MissionControl.jsx";

export const NAV = [
  { group: "Daily", pages: [
    { id: "today", label: "🏠 Today", C: Today },
    { id: "checkin", label: "📝 Check-in", C: CheckIn },
    { id: "log", label: "💪 Log activity", C: LogActivity },
    { id: "quests", label: "🏆 Quests", C: Quests },
  ] },
  { group: "Checks", pages: [
    { id: "checks", label: "🩺 Medical checks", C: Checks },
    { id: "photos", label: "📷 Photo log", C: Photos },
  ] },
  { group: "My health", pages: [
    { id: "body", label: "🧍 Body map", C: Body },
    { id: "trends", label: "📈 Trends", C: Trends },
    { id: "radiation", label: "☢ Radiation", C: Radiation },
    { id: "mind", label: "🧠 Mind", C: Mind },
  ] },
  { group: "Help", pages: [
    { id: "medguide", label: "🩹 Med guide", C: MedGuide },
    { id: "medkit", label: "💊 Med kit", C: MedKit },
    { id: "checklists", label: "✅ Checklists", C: Checklists },
  ] },
  { group: "Crew and mission", pages: [
    { id: "earth", label: "🛰 Earth link", C: EarthLink },
    { id: "habitat", label: "🌬 Habitat", C: Habitat },
    { id: "crew", label: "👥 Crew (CMO)", C: CrewView },
    { id: "learn", label: "📚 Learn (NASA)", C: Learn },
    { id: "mission", label: "⚙ Mission control", C: MissionControl },
  ] },
  { group: "", pages: [{ id: "emergency", label: "🚨 Emergency", C: Emergency }] },
];
export const PAGES = NAV.flatMap((g) => g.pages);

// One astronaut's personal app: mission bar, sidebar navigation, current page
export default function Dashboard({ person, onSwitch }) {
  const state = useStore();
  const [nav, setNav] = useState({ page: "today", params: {}, n: 0 });
  const go = (page, params = {}) => {
    setNav((prev) => ({ page, params, n: prev.n + 1 })); // n forces a fresh page even if it's the same one
    window.scrollTo?.(0, 0);
  };
  const env = envOf(state);
  const ev = activeEvent(state);
  const unread = state.notifications.filter((n) => !n.read).length;
  const queued = state.reports.filter((r) => r.status === "queued").length;
  const Page = (PAGES.find((p) => p.id === nav.page) || PAGES[0]).C;

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
          <span>{env.gravity}</span>
          <span>🕑 Earth delay {delayText(env)}</span>
          <span className={state.link.online ? "" : "warn"}>
            {state.link.online ? "📡 Link up" : "📴 Offline"}{queued ? ` · ${queued} queued` : ""}
          </span>
          <button className="btn small" onClick={() => go("crew")} aria-label={`${unread} unread notifications`}>🔔 {unread}</button>
          <button className="btn small" onClick={onSwitch}>Switch crew member</button>
        </div>
      </header>

      {ev && (
        <div className="alert red banner" onClick={() => go("radiation")}>
          ☢ Solar particle event: {ev.sheltered[person.id] ? "you are sheltered. Stay until the all-clear." : "go to the storm shelter now. Tap here."}
        </div>
      )}
      {state.habitat.fault && (
        <div className="alert red banner" onClick={() => go("habitat")}>🌬 CO₂ scrubber fault: cabin CO₂ above NASA's limit. Tap for details.</div>
      )}

      <div className="layout">
        <nav className="sidebar">
          {NAV.map((g) => (
            <div key={g.group || "end"} className="nav-group">
              {g.group && <div className="nav-heading">{g.group}</div>}
              {g.pages.map((p) => (
                <button
                  key={p.id}
                  className={"nav-btn" + (nav.page === p.id ? " active" : "") + (p.id === "emergency" ? " danger" : "")}
                  onClick={() => go(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <section className="page">
          <ErrorBoundary key={nav.n}>
            <Page person={person} go={go} params={nav.params} />
          </ErrorBoundary>
        </section>
      </div>
      <footer className="muted small">Prototype for NASA Space Apps 2026 · SIMULATED DATA · not medical advice</footer>
    </div>
  );
}
