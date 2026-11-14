import React from "react";
import { useStore, historyOf, partStatus, symptomsToday, MED_GUIDE } from "../backend/api.js";
import { bodyParts, indicators, indicatorSummary, COLORS, STATUS_LABEL, round1 } from "../lib.js";

// Personalized detail for one body part: status, your readings vs your own baseline, your notes, actions
export default function BodyPartDetail({ partKey, person, go }) {
  const state = useStore();
  const pid = person.id;
  const part = bodyParts[partKey];
  const history = historyOf(state, pid);
  const sums = indicators.filter((i) => i.bodyPart === partKey).map((i) => ({ ind: i, ...indicatorSummary(i, history) }));
  const status = partStatus(state, pid, partKey);
  const syms = symptomsToday(state, pid).filter((s) => s.part === partKey);
  const ci = state.checkins[pid][state.mission.day];
  const note = person.notes?.[partKey];
  const guides = MED_GUIDE.filter((g) => g.part === partKey);
  const firstName = person.name.split(" ").slice(-1)[0];

  return (
    <div className="detail">
      <div className="detail-head">
        <h2>{part.name}</h2>
        <span className="pill" style={{ borderColor: COLORS[status], color: COLORS[status] }}>{STATUS_LABEL[status]}</span>
      </div>

      <h3>For you, {firstName}</h3>
      {note && <p className="note">{note}</p>}
      {syms.map((s) => (
        <p key={s.id} className="alert yellow">You reported today: {s.label}</p>
      ))}
      {partKey === "eyes" && (
        <p className={ci?.vision === "changed" ? "alert yellow" : "muted"}>
          Vision check today: {ci?.vision ? ci.vision : "not done"}.{" "}
          <button className="btn small" onClick={() => go("checkin")}>Do vision check</button>
        </p>
      )}
      {sums.length === 0 && partKey !== "eyes" && <p className="muted">No numeric reading for this area yet.</p>}
      {sums.map(({ ind, latest, baseline, status: s, trend, change }) => (
        <div key={ind.id} className="reading" style={{ borderLeftColor: COLORS[s] }}>
          <div>
            <b>{ind.label}:</b> {latest} {ind.unit}{" "}
            <span className="muted">
              (your baseline {round1(baseline)} · {trend}
              {trend !== "steady" && ` ${change > 0 ? "+" : ""}${round1(change)}`})
            </span>{" "}
            <button className="btn small" onClick={() => go("trends", { indicator: ind.id })}>Trend</button>
          </div>
          {s === "green" ? <div className="muted">In your healthy range. Keep it up.</div> : <div className={"alert " + s}>⚠ {ind.action[s]}</div>}
        </div>
      ))}

      <h3>What's happening in space</h3>
      <p>{part.info}</p>

      <h3>How to protect it</h3>
      <ul>{part.prevention.map((p) => <li key={p}>{p}</li>)}</ul>

      {guides.length > 0 && (
        <>
          <h3>Related symptom guides</h3>
          <div className="row">
            {guides.map((g) => (
              <button key={g.id} className="btn small" onClick={() => go("medguide", { guide: g.id })}>{g.title}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
