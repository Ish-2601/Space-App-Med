import React, { useState } from "react";
import {
  useStore,
  alertsFor,
  healthScore,
  overallStatus,
  tasksFor,
  streak,
  points,
  dueChecks,
  rowFor,
  addWater,
  notifyCMO,
  sendReport,
} from "../backend/api.js";
import { Panel, Icon, Status, Segments } from "../components/ConsoleUI.jsx";
import { Patterns } from "./Trends.jsx";

const TASKS = {
  checkin: [
    "Daily check-in",
    "Eight short steps · about 3 minutes",
    "today",
    "checkin",
    "Start",
  ],
  exercise: [
    "Workout",
    "Daily movement and resistance training",
    "exercise",
    "log",
    "Log",
  ],
  water: [
    "Water",
    "Keep your daily hydration on track",
    "water",
    "log",
    "+ 250 mL",
  ],
  sleep: [
    "Sleep",
    "Protect your regular sleep window",
    "moon",
    "checkin",
    "Review",
  ],
  meds: [
    "Supplements",
    "Your scheduled supplements for today",
    "kit",
    "log",
    "Log",
  ],
  checks: [
    "Medical check",
    "Camera, vision or reaction self-check",
    "medical",
    "checks",
    "Open",
  ],
  journal: [
    "Journal",
    "A moment to reflect on your day",
    "journal",
    "mind",
    "Write",
  ],
};

// Turn an alert into a plain instruction ("Recheck your blood pressure"),
// keeping the raw reading as the reason underneath.
const IND_STEP = {
  heartRate: "Recheck your resting heart rate",
  systolic: "Recheck your blood pressure",
  diastolic: "Recheck your blood pressure",
  spo2: "Recheck your blood oxygen",
  glucose: "Recheck your blood glucose",
  temp: "Recheck your temperature",
  sleep: "Protect your sleep tonight",
  mood: "Take a break and talk to someone",
  exercise: "Fit in your workout today",
  water: "Drink some water now",
  radiation: "Review your radiation dose",
  mass: "Review your meals and body mass",
};
const CHECK_STEP = {
  amsler: "Report your vision change to the CMO",
  acuity: "Report your vision change to the CMO",
  pvt: "Rest, then repeat the reaction test",
  hr: "Repeat your heart-rate check",
  balance: "Take it slow and repeat the balance test",
};
export function nextStepTitle(a) {
  if (!a) return null;
  if (a.indicator && IND_STEP[a.indicator]) return IND_STEP[a.indicator];
  if (a.id.startsWith("check-")) return CHECK_STEP[a.id.slice(6)] || "Repeat this check";
  if (a.id.startsWith("sym-")) return `See what to do: ${a.title.replace("Symptom reported: ", "").toLowerCase()}`;
  if (a.id === "co2") return a.level === "red" ? "Move to fresh air and follow the CO₂ steps" : "Check cabin ventilation";
  return a.title;
}

export default function Today({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const row = rowFor(state, pid);
  const status = overallStatus(state, pid);
  const score = healthScore(state, pid);
  const alerts = alertsFor(state, pid).filter((a) => a.level !== "info");
  const due = dueChecks(state, pid).filter((d) => d.due);
  const tasks = tasksFor(state, pid);
  const done = tasks.filter((t) => t.done).length;
  const priority = alerts[0];
  const [notice, setNotice] = useState("");
  const openAlert = (a) =>
    go(
      a.page || (a.part ? "body" : "checkin"),
      a.guide ? { guide: a.guide } : a.part ? { part: a.part } : {},
    );
  return (
    <div className="today-screen">
      <button className="fast-help" onClick={() => go("emergency")}>
        <span>
          Feeling unwell or something's wrong?
          <small>Tap the symptoms to get the most likely cause and what to do</small>
        </span>
        <Icon name="arrow" size={28} />
      </button>
      <div className="today-hero">
        <Panel className="status-window" aria-label="Your status">
          <h2>Welcome back, {person.name.split(" ").at(-1)}</h2>
          <div className="health-overview">
            <div className={`health-ring tone-${status}`}>
              <svg viewBox="0 0 160 160" aria-hidden="true">
                <circle className="ring-track" cx="80" cy="80" r="66" />
                <circle
                  className="ring-value"
                  cx="80"
                  cy="80"
                  r="66"
                  pathLength="100"
                  strokeDasharray={`${score} 100`}
                />
              </svg>
              <div>
                <strong>{score}</strong>
                <small>Health score</small>
              </div>
            </div>
            <div>
              <Status status={status} />
              <p className="muted">
                {alerts.length
                  ? `${alerts.length} health signal${alerts.length === 1 ? "" : "s"} need${alerts.length === 1 ? "s" : ""} attention. Take it one step at a time.`
                  : "Your readings are in range. Keep your daily routine on track."}
              </p>
              <p className="small muted score-note">
                The score starts at 100 and drops for each reading, symptom or check outside its range.
              </p>
            </div>
          </div>
          <div className="mini-stats">
            {[
              [`${row.sleep} h`, "Sleep"],
              [`${row.heartRate} bpm`, "Resting HR"],
              [`${row.water} L`, "Water"],
            ].map(([value, label]) => (
              <div key={label}>
                <b>{value}</b>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Do this next"
          tone={priority?.level || "neutral"}
          className="priority-window"
        >
          <div className="priority-copy">
            <span className="icon-tile">
              <Icon
                name={
                  priority?.part === "eyes"
                    ? "eyes"
                    : priority?.part === "heart"
                      ? "heart"
                      : "medical"
                }
                size={30}
              />
            </span>
            <div>
              <h2>
                {nextStepTitle(priority) ||
                  (state.checkins[pid][state.mission.day]
                    ? "Keep your routine going"
                    : "Take a moment to check in")}
              </h2>
              {priority && priority.title !== nextStepTitle(priority) && (
                <p className="priority-reason">
                  <Status status={priority.level}>Why</Status> {priority.title}
                </p>
              )}
              <p>
                {priority?.action ||
                  "Review today's readings and complete any scheduled checks. Your record stays with you, even offline."}
              </p>
            </div>
          </div>
          <div className="row priority-actions">
            <button
              className="btn primary"
              onClick={() => (priority ? openAlert(priority) : go("checkin"))}
            >
              {priority ? "Review this signal" : "Start daily check-in"}
              <Icon name="arrow" size={18} />
            </button>
            {priority && (
              <button
                className="text-button"
                onClick={() => {
                  notifyCMO(
                    pid,
                    `${person.name}: ${priority.title}`,
                    priority.level,
                  );
                  setNotice("The medical officer has been notified.");
                }}
              >
                <Icon name="medical" size={18} />
                Notify CMO
              </button>
            )}
          </div>
          <p className="small muted">
            <Icon name="info" size={14} /> Compared with your own readings and
            the app's screening ranges.
          </p>
          {notice && (
            <p role="status" className="small">
              {notice}
            </p>
          )}
        </Panel>
      </div>
      <div className="main-with-aside">
        <Panel title="Today's routine">
          <div className="row spread">
            <div>
              <h2>
                {done} of {tasks.length} done
              </h2>
              <p className="muted small">A little care, every mission day.</p>
            </div>
            <span className="muted small">
              <Icon name="star" size={16} />{" "}
              {tasks.filter((t) => t.done).reduce((n, t) => n + t.points, 0)}{" "}
              points today
            </span>
          </div>
          <Segments
            value={done}
            max={tasks.length}
            count={tasks.length}
            label="Daily routine completed"
            tone="green"
          />
          <div className="routine-list">
            {tasks.map((t) => {
              const [label, sub, icon, page, action] = TASKS[t.id] || [
                t.label,
                "Daily health task",
                "check",
                "checks",
                "Open",
              ];
              return (
                <div
                  key={t.id}
                  className={`routine-row ${t.done ? "done" : ""}`}
                >
                  <span className="task-check">
                    <Icon name={t.done ? "check" : icon} size={19} />
                  </span>
                  <div className="routine-copy">
                    <b>{label}</b>
                    <small>{sub}</small>
                    {t.id === "exercise" && (
                      <Segments
                        value={Math.min(row.exercise, 90)}
                        max={90}
                        label="Exercise minutes"
                      />
                    )}
                    {t.id === "water" && (
                      <Segments
                        value={Math.min(row.water, 2)}
                        max={2}
                        label="Water in liters"
                      />
                    )}
                  </div>
                  <span className="routine-points">+{t.points}</span>
                  {t.done ? (
                    <Status status="green">Done</Status>
                  ) : (
                    <button
                      className="btn"
                      onClick={() =>
                        t.id === "water" ? addWater(pid, 0.25) : go(page)
                      }
                    >
                      {action}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {due.length > 0 && (
            <div className="due-checks">
              <h3>Scheduled checks</h3>
              {due.map(({ check }) => (
                <button
                  className="text-button"
                  key={check.id}
                  onClick={() =>
                    check.photo
                      ? go("photos", { category: "face" })
                      : go("checks", { check: check.id })
                  }
                >
                  <Icon name="medical" size={17} />
                  <span className="due-check-title">{check.title}</span>
                  <Icon name="arrow" size={15} />
                </button>
              ))}
            </div>
          )}
        </Panel>
        <div className="panel-stack">
          <Panel title="Other signals">
            {alerts.slice(1).map((a) => (
              <div className="signal-row" key={a.id}>
                <Icon name={a.level === "red" ? "alert" : "info"} />
                <div>
                  <b>{a.title}</b>
                  <p className="muted small">{a.action}</p>
                  <button className="text-button" onClick={() => openAlert(a)}>
                    View details <Icon name="arrow" size={15} />
                  </button>
                  {a.level === "red" && (
                    <button
                      className="text-button"
                      onClick={() => {
                        sendReport(pid, "health");
                        go("earth");
                      }}
                    >
                      Send health report <Icon name="send" size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length < 2 && (
              <p className="muted">No other health alerts right now.</p>
            )}
          </Panel>
          <Patterns person={person} limit={1} />
          <Panel title="Consistency">
            <div className="row spread">
              <b>
                <Icon name="star" size={17} /> {streak(state, pid)}-day streak
              </b>
              <span className="muted">
                {points(state, pid).toLocaleString()} points
              </span>
            </div>
            <div className="streak-days">
              {Array.from(
                { length: 7 },
                (_, i) => state.mission.day - 6 + i,
              ).map((day) => (
                <div
                  key={day}
                  className={state.checkins[pid][day] ? "complete" : ""}
                >
                  <small>{day}</small>
                  <Icon
                    name={state.checkins[pid][day] ? "check" : "clock"}
                    size={16}
                  />
                </div>
              ))}
            </div>
            <button className="text-button" onClick={() => go("quests")}>
              Your progress <Icon name="arrow" size={15} />
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
