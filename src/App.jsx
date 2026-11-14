import React, { useState } from "react";
import CrewSelect from "./components/CrewSelect.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useStore } from "./backend/api.js";

export default function App() {
  const state = useStore();
  const [view, setView] = useState({ type: "lobby" });
  const person = view.type === "person" ? state.crew.find((p) => p.id === view.id) : null;

  if (view.type === "cmo") {
    return (
      <Dashboard key="medical" person={state.crew.find((p) => p.role === "Medical officer") || state.crew[0]} initialPage="crew" onSwitch={() => setView({ type: "lobby" })} onOpenPerson={(id) => setView({ type: "person", id })} />
    );
  }
  if (!person) {
    return <CrewSelect onSelect={(id) => setView({ type: "person", id })} onMedical={() => setView({ type: "cmo" })} />;
  }
  return <Dashboard key={person.id} person={person} onSwitch={() => setView({ type: "lobby" })} onOpenPerson={(id) => setView({ type: "person", id })} />;
}
