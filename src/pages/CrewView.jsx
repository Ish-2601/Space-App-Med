import React, { useState } from "react";
import {
  useStore,
  crewOverview,
  activeEmergencies,
  markNotificationsRead,
  habitatToday,
  lowStock,
  sendReport,
} from "../backend/api.js";
import CrewAvatar from "../components/CrewAvatar.jsx";
import { EvaBadge, CrewWorkloadHeatmap } from "../components/CrewReadiness.jsx";
import { PageTitle, Panel, Status, Icon } from "../components/ConsoleUI.jsx";
export default function CrewView({ onOpenPerson, go }) {
  const state = useStore(),
    rows = crewOverview(state),
    ems = activeEmergencies(state),
    hab = habitatToday(state),
    low = lowStock(state);
  const [sent, setSent] = useState(false);
  const attention = rows.filter((r) => r.status !== "green").length;
  return (
    <div>
      <PageTitle
        eyebrow="Crew medical officer"
        title="Crew health today"
        description={
          attention
            ? attention +
              " crewmates need attention. Open a health profile to review their latest readings."
            : "All crew health indicators are on track."
        }
      >
        <button
          className="btn primary"
          onClick={() => {
            rows.forEach((r) => sendReport(r.person.id, "health"));
            setSent(true);
          }}
        >
          <Icon name="send" />
          Send crew reports to Earth
        </button>
      </PageTitle>
      {sent && (
        <p className="alert info" role="status">
          Reports for all {rows.length} crew members are queued in the simulated
          Earth link.
        </p>
      )}
      {ems.map((e) => (
        <button
          key={e.id}
          className="alert red emergency-notice"
          onClick={() => go("emergency", { emergencyId: e.id })}
        >
          <Icon name="emergency" />
          {state.crew.find((p) => p.id === e.pid)?.name}: {e.title} in progress{" "}
          <Icon name="arrow" />
        </button>
      ))}
      <div className="summary-grid">
        {[
          ["alert", attention, "Need attention today"],
          [
            "today",
            rows.filter((r) => !r.checkedIn).length,
            "Check-ins still due",
          ],
          ["air", hab.co2 + " mmHg", "Cabin CO₂"],
          ["kit", low.length + " low", "Medical supplies"],
        ].map(([icon, value, label]) => (
          <Panel key={label} className="summary-stat">
            <Icon name={icon} size={27} />
            <div>
              <strong>{value}</strong>
              <span className="muted">{label}</span>
            </div>
          </Panel>
        ))}
      </div>
      <CrewWorkloadHeatmap onOpenPerson={onOpenPerson} />
      <div className="main-with-aside">
        <div className="crew-medical-grid" id="crew-readiness">
          {rows.map((r) => (
            <Panel
              key={r.person.id}
              tone={r.status}
              className="crew-medical-card"
            >
              <div className="crew-card-heading">
                <CrewAvatar person={r.person} />
                <div>
                  <h2>{r.person.name}</h2>
                  <p className="muted small">
                    {r.person.role} ·{" "}
                    {r.checkedIn ? "check-in done" : "check-in due"}
                  </p>
                </div>
                <div className={"crew-card-score text-" + r.status}>
                  {r.score}
                  <small>% health</small>
                </div>
              </div>
              <Status status={r.status} />
              <EvaBadge person={r.person} />
              <ul className="quiet-list">
                {r.alerts.length ? (
                  r.alerts.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <Icon name={a.level === "red" ? "alert" : "info"} />
                      <span>{a.title}</span>
                    </li>
                  ))
                ) : (
                  <li>
                    <Icon name="check" />
                    <span>All checks on track</span>
                  </li>
                )}
              </ul>
              {r.sheltered != null && (
                <p className="small">
                  {r.sheltered
                    ? "Sheltered during the active storm"
                    : "Not yet in the storm shelter"}
                </p>
              )}
              <button className="btn" onClick={() => onOpenPerson(r.person.id)}>
                Open health <Icon name="arrow" size={16} />
              </button>
            </Panel>
          ))}
        </div>
        <aside className="panel-stack">
          <Panel title="Notifications">
            <div className="row spread">
              <b>{state.notifications.filter((n) => !n.read).length} new</b>
              <button className="text-button" onClick={markNotificationsRead}>
                Mark all read
              </button>
            </div>
            {!state.notifications.length && (
              <p className="muted">No notifications yet.</p>
            )}
            <div className="notification-list">
              {state.notifications.slice(0, 30).map((n) => (
                <article
                  key={n.id}
                  className={"notification " + (n.read ? "read" : "")}
                >
                  <Icon name={n.level === "red" ? "alert" : "info"} />
                  <div>
                    <p>{n.text}</p>
                    <span className="small muted">
                      {new Date(n.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {n.read ? " · Read" : ""}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
          <Panel
            title={low.length ? "Running low" : "Medical kit"}
            tone={low.length ? "yellow" : "neutral"}
          >
            {low.length ? (
              low.map((m) => (
                <div key={m.id} className="stock-note">
                  <Icon name="kit" />
                  <div>
                    <b>{m.name}</b>
                    <p className="small muted">{m.stock} left</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                All supplies are above their minimum stock.
              </p>
            )}
            <button className="btn full-width" onClick={() => go("medkit")}>
              Open med kit <Icon name="arrow" size={16} />
            </button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
