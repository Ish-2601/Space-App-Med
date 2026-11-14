import React from "react";
import { bodyParts, indicators, indicatorSummary, worstStatus, COLORS, STATUS_LABEL } from "../lib.js";

const fmt = (n) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10);

// Personalized detail for one body part: status, your readings vs your own baseline, your notes, actions
export default function BodyPartDetail({ partKey, person, history }) {
  const part = bodyParts[partKey];
  const inds = indicators.filter((i) => i.bodyPart === partKey);
  const sums = inds.map((i) => ({ ind: i, ...indicatorSummary(i, history) }));
  const status = worstStatus(sums.map((s) => s.status));
  const note = person.notes?.[partKey];
  const firstName = person.name.split(" ").slice(-1)[0];

  return (
    <div className="detail">
      <div className="detail-head">
        <h2>{part.name}</h2>
        <span className="pill" style={{ borderColor: COLORS[status], color: COLORS[status] }}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <h3>For you, {firstName}</h3>
      {note && <p className="note">{note}</p>}
      {sums.length === 0 && (
        <p className="muted">No numeric reading for this area yet. {part.check ? `Use: ${part.check}.` : ""}</p>
      )}
      {sums.map(({ ind, latest, baseline, status: s, trend, change }) => (
        <div key={ind.id} className="reading" style={{ borderLeftColor: COLORS[s] }}>
          <div>
            <b>{ind.label}:</b> {latest} {ind.unit}{" "}
            <span className="muted">
              (your baseline {fmt(baseline)} · {trend}
              {trend !== "steady" && ` ${change > 0 ? "+" : ""}${fmt(change)}`})
            </span>
          </div>
          {s === "green" ? (
            <div className="muted">In your healthy range. Keep it up.</div>
          ) : (
            <div className={"alert " + s}>⚠ {ind.action[s]}</div>
          )}
        </div>
      ))}

      <h3>What's happening in space</h3>
      <p>{part.info}</p>

      <h3>How to protect it</h3>
      <ul>
        {part.prevention.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
