import React, { useEffect, useState } from "react";
import { setHash } from "../router.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
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
import ConsoleShell from "./ConsoleShell.jsx";
import More from "../pages/More.jsx";
import CrewHub from "../pages/CrewHub.jsx";
import Summary from "../pages/Summary.jsx";
import BodyHealth from "../pages/BodyHealth.jsx";
import BodyDiagnostic from "../pages/BodyDiagnostic.jsx";
import { HEALTH_AREAS, areaPage } from "../data/healthAreas.js";

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
export const PAGES = [...NAV.flatMap((g) => g.pages), { id: "more", C: More }, { id: "crewHub", C: CrewHub }, { id: "summary", C: Summary }, ...Object.keys(HEALTH_AREAS).flatMap((partKey) => [
  { id: areaPage(partKey), C: (props) => <BodyHealth {...props} partKey={partKey} /> },
  { id: "review-" + partKey, C: (props) => <BodyDiagnostic {...props} partKey={partKey} /> },
])];

// One astronaut's personal app: mission bar, sidebar navigation, current page
export default function Dashboard({ person, routeId = person.id, onSwitch, onOpenPerson, initialPage = "today" }) {
  const known = (p) => (PAGES.some((x) => x.id === p) ? p : "today");
  const [nav, setNav] = useState({ page: known(initialPage), params: {}, n: 0 });
  useEffect(() => setHash(routeId, nav.page, true), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Back/forward buttons: follow the address bar
  useEffect(() => {
    const p = known(initialPage);
    setNav((prev) => (prev.page === p ? prev : { page: p, params: {}, n: prev.n + 1 }));
  }, [initialPage]);
  const go = (page, params = {}) => {
    if (page === "body" && HEALTH_AREAS[params.part]) page = areaPage(params.part);
    setNav((prev) => ({ page, params, n: prev.n + 1 })); // n forces a fresh page even if it's the same one
    setHash(routeId, page);
    window.scrollTo?.(0, 0);
  };
  const Page = (PAGES.find((p) => p.id === nav.page) || PAGES[0]).C;

  return <ConsoleShell person={person} page={nav.page} go={go} onSwitch={onSwitch} onOpenPerson={onOpenPerson}>
    <ErrorBoundary key={nav.n}><Page person={person} go={go} params={nav.params} onSwitch={onSwitch} onOpenPerson={onOpenPerson} /></ErrorBoundary>
  </ConsoleShell>;

}
