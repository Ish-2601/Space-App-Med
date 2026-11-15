import React, { useEffect, useState } from "react";
import CrewSelect from "./components/CrewSelect.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useStore } from "./backend/api.js";
import { parseHash, setHash } from "./router.js";

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

  if (route.who === "cmo") {
    const cmo = state.crew.find((p) => p.role === "Medical officer") || state.crew[0];
    return (
      <Dashboard key="medical" routeId="cmo" person={cmo} initialPage={route.page || "crew"} onSwitch={toLobby} onOpenPerson={openPerson} />
    );
  }
  const person = state.crew.find((p) => p.id === route.who);
  if (!person) {
    return <CrewSelect onSelect={openPerson} onMedical={() => open("cmo", "crew")} />;
  }
  return <Dashboard key={person.id} routeId={person.id} person={person} initialPage={route.page || "today"} onSwitch={toLobby} onOpenPerson={openPerson} />;
}
