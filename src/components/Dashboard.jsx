import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Crewmate from "./Crewmate.jsx";
import BodyMap from "./BodyMap.jsx";
import BodyPartDetail from "./BodyPartDetail.jsx";
import { indicators, statusOf, worstStatus, simulateHistory, mission, COLORS } from "../lib.js";

// One astronaut's personal view
export default function Dashboard({ person, onSwitch }) {
  const history = useMemo(() => simulateHistory(person), [person]);
  const latest = history[history.length - 1];
  const [selectedPart, setSelectedPart] = useState("brain");
  const [selectedInd, setSelectedInd] = useState("heartRate");

  const statuses = Object.fromEntries(indicators.map((i) => [i.id, statusOf(i, latest[i.id])]));
  const partStatus = (part) => worstStatus(indicators.filter((i) => i.bodyPart === part).map((i) => statuses[i.id]));
  const ind = indicators.find((i) => i.id === selectedInd);

  return (
    <div className="app">
      <header>
        <div className="who">
          <Crewmate color={person.color} size={44} />
          <div>
            <h1>{person.name}</h1>
            <span className="muted">{person.role} · {mission.name} day {mission.day} · Earth delay {mission.earthDelayMin} min</span>
          </div>
        </div>
        <div className="header-right">
          <span className="badge">SIMULATED DATA · not medical advice</span>
          <button className="switch" onClick={onSwitch}>Switch crew member</button>
        </div>
      </header>

      <main>
        <section className="card">
          <h2>Body map</h2>
          <p className="muted">Tap a body part for your personal status.</p>
          <BodyMap partStatus={partStatus} selected={selectedPart} onSelect={setSelectedPart} />
        </section>

        <section className="card">
          <BodyPartDetail partKey={selectedPart} person={person} history={history} />
        </section>

        <section className="card">
          <h2>Today's indicators (day {latest.day})</h2>
          <ul className="list">
            {indicators.map((i) => (
              <li key={i.id} onClick={() => setSelectedInd(i.id)} className={i.id === selectedInd ? "sel" : ""}>
                <span className="dot" style={{ background: COLORS[statuses[i.id]] }} />
                {i.label}: <b>{latest[i.id]} {i.unit}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>{ind.label} trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <XAxis dataKey="day" stroke="#9aa6c4" />
              <YAxis domain={["auto", "auto"]} stroke="#9aa6c4" />
              <Tooltip />
              <Line type="monotone" dataKey={ind.id} stroke={COLORS[statuses[ind.id]]} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p><b>How to measure:</b> {ind.how}</p>
          <p><b>Why it matters in space:</b> {ind.why}</p>
          <p className="muted">
            NASA risk: {ind.risk} · Sources:{" "}
            {ind.sources.map((s, n) => (
              <a key={s} href={s} target="_blank" rel="noreferrer" style={{ color: "#8fb3ff", marginRight: 6 }}>[{n + 1}]</a>
            ))}
          </p>
        </section>
      </main>
    </div>
  );
}
