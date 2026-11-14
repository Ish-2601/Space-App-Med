import React, { useState } from "react";
import BodyMap from "../components/BodyMap.jsx";
import BodyPartDetail from "../components/BodyPartDetail.jsx";
import { useStore, partStatus } from "../backend/api.js";

export default function Body({ person, go, params }) {
  const state = useStore();
  const [part, setPart] = useState(params.part || "brain");
  return (
    <div className="grid2">
      <div className="card">
        <h2>Body map</h2>
        <p className="muted">Tap a body part for your personal status. Tap the outline for radiation.</p>
        <BodyMap partStatus={(k) => partStatus(state, person.id, k)} selected={part} onSelect={setPart} />
      </div>
      <div className="card">
        <BodyPartDetail partKey={part} person={person} go={go} />
      </div>
    </div>
  );
}
