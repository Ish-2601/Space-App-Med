import React from "react";
import { useStore, crewOverview, activeEmergencies, markNotificationsRead } from "../backend/api.js";
import { COLORS, STATUS_LABEL } from "../lib.js";

// Crew medical officer (CMO) view: everyone's status, notifications and emergencies
export default function CrewView({ onOpenPerson }) {
  const state = useStore();
  const rows = crewOverview(state);
  const ems = activeEmergencies(state);
  const name = (pid) => state.crew.find((p) => p.id === pid)?.name;

  return (
    <div>
      <h2>Crew medical officer view</h2>
      {ems.map((e) => <div key={e.id} className="alert red">🚨 {name(e.pid)}: {e.title} in progress</div>)}

      <table className="table">
        <thead>
          <tr><th>Crew member</th><th>Status</th><th>Score</th><th>Check-in</th><th>Alerts</th>{rows[0]?.sheltered != null && <th>Shelter</th>}<th /></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.person.id}>
              <td>{r.person.name}<div className="muted small">{r.person.role}</div></td>
              <td><span className="dot" style={{ background: COLORS[r.status] }} />{STATUS_LABEL[r.status]}</td>
              <td>{r.score}</td>
              <td>{r.checkedIn ? "✅" : "Due"}</td>
              <td className="small">{r.alerts.map((a) => <div key={a.id}>{a.level === "red" ? "🔴" : "🟡"} {a.title}</div>)}</td>
              {r.sheltered != null && <td>{r.sheltered ? "✅" : "❌"}</td>}
              <td>{onOpenPerson && <button className="btn small" onClick={() => onOpenPerson(r.person.id)}>Open</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row spread">
        <h3>Notifications</h3>
        <button className="btn small" onClick={markNotificationsRead}>Mark all read</button>
      </div>
      {state.notifications.length === 0 && <p className="muted">No notifications.</p>}
      {state.notifications.slice(0, 50).map((n) => (
        <div key={n.id} className={"notif " + n.level + (n.read ? " read" : "")}>
          <span className="muted small">{new Date(n.ts).toLocaleTimeString()}</span> {n.text}
        </div>
      ))}
    </div>
  );
}
