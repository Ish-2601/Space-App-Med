import React, { useState } from "react";
import CrewSelect from "./components/CrewSelect.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { crew } from "./lib.js";

export default function App() {
  const [personId, setPersonId] = useState(null);
  const person = crew.find((p) => p.id === personId);

  if (!person) return <CrewSelect onSelect={setPersonId} />;
  return <Dashboard key={person.id} person={person} onSwitch={() => setPersonId(null)} />;
}
