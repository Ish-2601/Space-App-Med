import React, { useState } from "react";
import { PageTitle, Panel, Icon } from "../components/ConsoleUI.jsx";
import HealthTrend from "../components/HealthTrend.jsx";
import DigitalTwin from "../components/DigitalTwin.jsx";
import { useStore, historyOf, insightsFor } from "../backend/api.js";
import { indicators, indicatorSummary, round1 } from "../lib.js";

export default function Trends({ person, params = {} }) {
  const state = useStore();
  const [id, setId] = useState(params.indicator || "heartRate");
  const [range, setRange] = useState(30);
  const ind = indicators.find((i) => i.id === id) || indicators[0];
  const full = historyOf(state, person.id);
  const sum = indicatorSummary(ind, full);

  return (
    <div>
      <PageTitle
        eyebrow="Personal health · History"
        title="Your changes over time"
        description="Explore your recent baseline, mission screening ranges and environmental patterns."
      />
      <div className="row">
        <select
          aria-label="Health indicator"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {indicators.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
        {[7, 14, 30, 365].map((n) => (
          <button
            key={n}
            className={"btn small" + (range === n ? " active" : "")}
            onClick={() => setRange(n)}
          >
            {n === 365 ? "All" : `${n} days`}
          </button>
        ))}
      </div>
      <p>
        Latest{" "}
        <b>
          {sum.latest} {ind.unit}
        </b>{" "}
        · first-week summary {round1(sum.baseline)} · {sum.trend}
        {sum.trend !== "steady" &&
          ` (${sum.change > 0 ? "+" : ""}${round1(sum.change)})`}
      </p>
      <div className="card">
        <HealthTrend pid={person.id} indicatorId={ind.id} days={range} />
      </div>
      <p>
        <b>Why it matters:</b> {ind.why}
      </p>
      <p className="muted small">
        NASA risk: {ind.risk} · Sources:{" "}
        {ind.sources.map((s, n) => (
          <a key={s} href={s} target="_blank" rel="noreferrer">
            [{n + 1}]{" "}
          </a>
        ))}
      </p>
      <Patterns person={person} />
      <DigitalTwin pid={person.id} />
    </div>
  );
}

// Patterns in your own data (Bearable-style comparisons between groups of days)
export function Patterns({ person, limit }) {
  const state = useStore();
  const list = insightsFor(state, person.id);
  const shown = limit ? list.slice(0, limit) : list;
  if (limit && !shown.length) return null; // on Today, only show a card when there is something to say
  return (
    <Panel title="Patterns in your data" className="patterns-panel">
      {shown.length ? (
        shown.map((i) => (
          <div className="signal-row" key={i.id}>
            <Icon name="star" />
            <div>
              <b className="signal-title">{i.title}</b>
              <p className="muted small">{i.detail}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="muted">
          Not enough data for patterns yet. Keep logging: each pattern needs at
          least 3 days on each side.
        </p>
      )}
      <p className="small muted">
        A pattern is not proof that one thing causes the other.
      </p>
    </Panel>
  );
}
