import React, { useEffect, useState } from "react";
import CrewSelect from "./components/CrewSelect.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useStore } from "./backend/api.js";
import { parseHash, setHash } from "./router.js";
import MissionUtilityBar from "./components/MissionUtilityBar.jsx";
import { sandboxEnabled } from "./backend/sandbox.js";

export default function App() {
  const state = useStore();
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    window.addEventListener("routechange", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
      window.removeEventListener("routechange", on);
    };
  }, []);
  const open = (who, page = "") => {
    setHash(who, page);
    window.scrollTo?.(0, 0);
  };
  const toLobby = () => open("");
  const openPerson = (id) => open(id, "today");

  const person =
    route.who === "cmo"
      ? state.crew.find((p) => p.role === "Medical officer") || state.crew[0]
      : state.crew.find((p) => p.id === route.who);
  const isPrivate = sandboxEnabled(state);
  return (
    <div className={"mission-root" + (isPrivate ? " sandbox-active" : "")}>
      <MissionUtilityBar
        person={person}
        navigate={(page) => open(route.who || "cmo", page)}
      />
      <div key={isPrivate ? "private-workspace" : "crew-workspace"}>
        {person ? (
          <Dashboard
            key={route.who}
            routeId={route.who}
            person={person}
            initialPage={route.page || (route.who === "cmo" ? "crew" : "today")}
            onSwitch={toLobby}
            onOpenPerson={openPerson}
          />
        ) : (
          <CrewSelect
            onSelect={openPerson}
            onMedical={() => open("cmo", "crew")}
          />
        )}
      </div>
    </div>
  );
}
