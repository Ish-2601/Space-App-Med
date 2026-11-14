import React, { useState } from "react";
import CrewSelect from "./components/CrewSelect.jsx";
import Dashboard from "./components/Dashboard.jsx";
import CrewView from "./pages/CrewView.jsx";
import { useStore } from "./backend/api.js";

export default function App() {
  const state = useStore();
  const [view, setView] = useState({ type: "lobby" });
  const person = view.type === "person" ? state.crew.find((p) => p.id === view.id) : null;

  if (view.type === "cmo") {
    return (
      <div className="app">
        <button className="btn" onClick={() => setView({ type: "lobby" })}>← Back to crew</button>
        <CrewView onOpenPerson={(id) => setView({ type: "person", id })} />
      </div>
    );
  }
  if (!person) {
    return <CrewSelect onSelect={(id) => setView({ type: "person", id })} onMedical={() => setView({ type: "cmo" })} />;
  }
  return <Dashboard key={person.id} person={person} onSwitch={() => setView({ type: "lobby" })} />;
}
