import React from "react";
import { useStore, alertsFor, healthScore, overallStatus, tasksFor, streak, points, notifyCMO, sendReport } from "../backend/api.js";
import { COLORS, STATUS_LABEL } from "../lib.js";

const LEVEL_CLASS = { red: "red", yellow: "yellow", info: "info" };

export default function Today({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const alerts = alertsFor(state, pid);
  const status = overallStatus(state, pid);
  const tasks = tasksFor(state, pid);

  return (
    <div>
      <h2>Today · day {state.mission.day}</h2>
      <div className="grid3">
        <div className="card stat">
          <div className="muted small">Health score</div>
          <div className="big">{healthScore(state, pid)}</div>
        </div>
        <div className="card stat">
          <div className="muted small">Status</div>
          <div className="big-ish"><span className="dot" style={{ background: COLORS[status] }} />{STATUS_LABEL[status]}</div>
        </div>
        <div className="card stat">
          <div className="muted small">Streak · points</div>
          <div className="big-ish">🔥 {streak(state, pid)} days · ⭐ {points(state, pid)}</div>
        </div>
      </div>

      <h3>Alerts ({alerts.length})</h3>
      {alerts.length === 0 && <p className="muted">All clear. Nice work.</p>}
      {alerts.map((a) => (
        <div key={a.id} className={"alert " + LEVEL_CLASS[a.level]}>
          <b>{a.title}</b>
          <div>{a.action}</div>
          <div className="row">
            {a.page && <button className="btn small" onClick={() => go(a.page, a.guide ? { guide: a.guide } : {})}>Open</button>}
            {a.part && <button className="btn small" onClick={() => go("body", { part: a.part })}>Show on body map</button>}
            {a.indicator && <button className="btn small" onClick={() => go("trends", { indicator: a.indicator })}>Trend</button>}
            {a.level !== "info" && (
              <button className="btn small" onClick={() => notifyCMO(pid, `${person.name}: ${a.title}`, a.level)}>Notify CMO</button>
            )}
            {(a.escalate || a.level === "red") && (
              <button className="btn small" onClick={() => { sendReport(pid, "health"); go("earth"); }}>Send report to flight surgeon</button>
            )}
          </div>
        </div>
      ))}

      <h3>Today's tasks</h3>
      <ul className="tasks">
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            {t.done ? "✅" : "⬜"} {t.label} <span className="muted small">+{t.points}{t.weekly ? " · weekly" : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
