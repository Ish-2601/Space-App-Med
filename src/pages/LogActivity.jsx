import React, { useState } from "react";
import {
  useStore,
  rowFor,
  logWorkout,
  addWater,
  takeMed,
  medsDue,
  WORKOUTS,
} from "../backend/api.js";
import {
  PageTitle,
  Panel,
  Segments,
  Icon,
  Status,
} from "../components/ConsoleUI.jsx";
export default function LogActivity({ person }) {
  const state = useStore(),
    pid = person.id,
    row = rowFor(state, pid),
    meds = medsDue(state, pid),
    today = state.exerciseLog[pid].filter((w) => w.day === state.mission.day);
  const [type, setType] = useState(WORKOUTS[0].id),
    [minutes, setMinutes] = useState(30),
    [error, setError] = useState("");
  function add() {
    const m = Number(minutes);
    if (!Number.isFinite(m) || m < 1 || m > 300) {
      setError("Enter minutes between 1 and 300.");
      return;
    }
    logWorkout(pid, type, m);
    setError("");
  }
  return (
    <div>
      <PageTitle
        eyebrow={"Today · Day " + state.mission.day}
        title="A little care, every day"
        description="Log your movement, water and scheduled supplements."
      />
      <div className="activity-layout">
        <Panel title="Workout">
          <div className="row spread">
            <Icon name="exercise" size={30} />
            <Status status={row.exercise >= 90 ? "green" : "info"}>
              {row.exercise} / 90 min
            </Status>
          </div>
          <h2>Keep moving</h2>
          <p className="muted">
            Resistance and aerobic training help protect bones, muscles and the
            heart. Simulated sensor minutes are included.
          </p>
          <Segments
            value={Math.min(row.exercise, 90)}
            max={90}
            label="Exercise minutes"
            tone="green"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <div className="activity-form">
              <label>
                Activity
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {WORKOUTS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Minutes
                <input
                  type="number"
                  min="1"
                  max="300"
                  required
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </label>
            </div>
            <button className="btn primary" type="submit">
              Log workout <Icon name="check" />
            </button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <h3 className="eyebrow section-label">Logged today</h3>
          {today.length ? (
            <ul className="quiet-list activity-log">
              {today.map((w) => (
                <li key={w.id}>
                  <Icon name="exercise" />
                  <span>
                    {WORKOUTS.find((x) => x.id === w.type)?.label || w.type} ·{" "}
                    {w.minutes} min
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No additional workouts logged yet.</p>
          )}
        </Panel>
        <Panel title="Water">
          <div className="row spread">
            <h2>
              {row.water} <small className="muted">/ 2 L today</small>
            </h2>
            <Icon name="water" size={30} />
          </div>
          <Segments
            value={Math.min(row.water, 2)}
            max={2}
            label="Water in liters"
            tone={row.water >= 2 ? "green" : "yellow"}
          />
          <p className="muted small">
            Staying hydrated is part of your daily routine.
          </p>
          <div className="row">
            <button className="btn" onClick={() => addWater(pid, 0.25)}>
              + 250 mL
            </button>
            <button className="btn" onClick={() => addWater(pid, 0.5)}>
              + 500 mL
            </button>
          </div>
        </Panel>
        <Panel title="Scheduled supplements">
          {meds.map((m) => (
            <div className="supplement-row" key={m.med}>
              <span>
                {m.name}
                <small>{m.freq}</small>
              </span>
              {m.done ? (
                <Status status="green">Logged</Status>
              ) : (
                <button className="btn" onClick={() => takeMed(pid, m.med)}>
                  Mark taken
                </button>
              )}
            </div>
          ))}
          {!meds.length && <p className="muted">No supplements scheduled.</p>}
          <p className="muted small">
            Logging a dose uses one item from the shared medical kit.
          </p>
        </Panel>
      </div>
    </div>
  );
}
