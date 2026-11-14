import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { indicators, statusOf, simulateHistory, bodyParts } from "./lib.js";

const COLORS = { green: "#2ecc71", yellow: "#f1c40f", red: "#e74c3c", unknown: "#7f8c8d" };
const RANK = { green: 0, unknown: 0, yellow: 1, red: 2 };

export default function App() {
  const history = useMemo(() => simulateHistory(30), []);
  const latest = history[history.length - 1];
  const [selectedPart, setSelectedPart] = useState("heart");
  const [selectedInd, setSelectedInd] = useState("heartRate");

  const statuses = Object.fromEntries(indicators.map((i) => [i.id, statusOf(i, latest[i.id])]));
  const partStatus = (part) =>
    indicators
      .filter((i) => i.bodyPart === part)
      .reduce((w, i) => (RANK[statuses[i.id]] > RANK[w] ? statuses[i.id] : w), "green");

  const ind = indicators.find((i) => i.id === selectedInd);

  return (
    <div className="app">
      <header>
        <h1>🚀 AstroHealth</h1>
        <span className="badge">Prototype · SIMULATED DATA · not medical advice</span>
      </header>

      <main>
        <section className="card">
          <h2>Body map</h2>
          <p className="muted">Click a system to see its status.</p>
          <div className="parts">
            {Object.entries(bodyParts).map(([key, p]) => (
              <button
                key={key}
                className={"part" + (selectedPart === key ? " active" : "")}
                style={{ borderColor: COLORS[partStatus(key)] }}
                onClick={() => {
                  setSelectedPart(key);
                  const first = indicators.find((i) => i.bodyPart === key);
                  if (first) setSelectedInd(first.id);
                }}
              >
                <span className="dot" style={{ background: COLORS[partStatus(key)] }} />
                {p.name}
              </button>
            ))}
          </div>
          <p>{bodyParts[selectedPart].info}</p>
          {/* TODO: replace buttons with a real SVG human figure */}
        </section>

        <section className="card">
          <h2>Today's indicators (Day {latest.day})</h2>
          <ul className="list">
            {indicators.map((i) => (
              <li key={i.id} onClick={() => setSelectedInd(i.id)} className={i.id === selectedInd ? "sel" : ""}>
                <span className="dot" style={{ background: COLORS[statuses[i.id]] }} />
                {i.label}: <b>{latest[i.id]} {i.unit}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="card wide">
          <h2>{ind.label} trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <XAxis dataKey="day" />
              <YAxis domain={["auto", "auto"]} />
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
          {statuses[ind.id] !== "green" && statuses[ind.id] !== "unknown" && (
            <p className={"alert " + statuses[ind.id]}>⚠ {ind.action[statuses[ind.id]]}</p>
          )}
        </section>
      </main>
    </div>
  );
}
