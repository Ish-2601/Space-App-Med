import React from "react";
import { CrewBioDome, RecoveryNotice } from "../components/HomeUpgrades.jsx";
import { recoveryStatus, completeRecovery } from "../backend/homeUpgrades.js";
import {
  useStore,
  tasksFor,
  streak,
  points,
  badgesFor,
} from "../backend/api.js";
import {
  PageTitle,
  Panel,
  Segments,
  Icon,
  Status,
} from "../components/ConsoleUI.jsx";
const PAGES = {
  checkin: "checkin",
  exercise: "log",
  water: "log",
  sleep: "checkin",
  meds: "log",
  checks: "checks",
  journal: "mind",
};
export default function Quests({ person, go }) {
  const state = useStore(),
    pid = person.id,
    tasks = tasksFor(state, pid),
    done = tasks.filter((t) => t.done).length,
    board = state.crew
      .map((p) => ({ p, pts: points(state, p.id) }))
      .sort((a, b) => b.pts - a.pts);
  return (
    <div>
      <PageTitle
        eyebrow="Today · Progress"
        title="Consistency, one day at a time"
        description="Small routines support your health through a long mission."
      />
      <div className="summary-grid">
        {[
          [done + "/" + tasks.length, "Today's routine", "today"],
          [streak(state, pid) + " days", "Check-in streak", "star"],
          [points(state, pid).toLocaleString(), "Mission points", "shield"],
        ].map(([value, label, icon]) => (
          <Panel className="summary-stat" key={label}>
            <Icon name={icon} size={28} />
            <div>
              <strong>{value}</strong>
              <span className="muted">{label}</span>
            </div>
          </Panel>
        ))}
      </div>
      <div className="main-with-aside">
        <div className="panel-stack">
          <RecoveryNotice person={person} />
          <Panel title="Today's routine">
            <Segments
              value={done}
              max={tasks.length}
              count={tasks.length}
              label="Tasks completed"
              tone="green"
            />
            <div className="progress-tasks">
              {tasks.map((t) => (
                <div className="routine-row" key={t.id}>
                  <span className="task-check">
                    <Icon name={t.done ? "check" : "today"} />
                  </span>
                  <div className="routine-copy">
                    <b>{t.label}</b>
                  </div>
                  <span className="small muted">+{t.points}</span>
                  {t.done ? (
                    <Status status="green">Done</Status>
                  ) : (
                    <button
                      className="btn"
                      onClick={() =>
                        t.id === "exercise" && recoveryStatus(state, pid).active
                          ? completeRecovery(pid)
                          : go(PAGES[t.id])
                      }
                    >
                      {t.id === "exercise" && recoveryStatus(state, pid).active
                        ? "Complete recovery"
                        : "Open"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Panel>
          <CrewBioDome />
          <Panel title="Milestones">
            <div className="progress-badges">
              {badgesFor(state, pid).map((b) => (
                <div
                  key={b.id}
                  className={"progress-badge " + (b.earned ? "earned" : "")}
                >
                  <Icon name={b.earned ? "shield" : "star"} />
                  <span>
                    {b.label}
                    <small className="muted">
                      {" "}
                      · {b.earned ? "Earned" : "In progress"}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Crew progress">
          {board.map(({ p, pts }, i) => (
            <div className="resource-link" key={p.id}>
              <span className="risk-number">0{i + 1}</span>
              <span>
                <b>{p.name}</b>
                <small>{p.role}</small>
              </span>
              <strong>{pts.toLocaleString()}</strong>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
