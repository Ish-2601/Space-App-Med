import React, { useState } from "react";
import {
  useStore,
  ENVIRONMENTS,
  delayText,
  setEnvironment,
  setDemoSpeed,
  advanceDay,
  startSolarEvent,
  activeEvent,
  setLinkOnline,
  setCo2Fault,
  setCalibration,
  resetAll,
  exportData,
  exportCsv,
  streak,
  points,
} from "../backend/api.js";
import CrewAvatar from "../components/CrewAvatar.jsx";
import { PageTitle, Panel, Icon } from "../components/ConsoleUI.jsx";
function download(text, filename, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export default function MissionControl({ person, go, onSwitch }) {
  const state = useStore(),
    [confirm, setConfirm] = useState(false),
    [msg, setMsg] = useState(""),
    env = ENVIRONMENTS[state.mission.environment],
    ev = activeEvent(state);
  return (
    <div>
      <PageTitle
        eyebrow="More"
        title="Demo controls"
        description="Set the scene for your mission. Changes apply to the whole crew."
      />
      <div className="settings-layout">
        <aside className="panel-stack">
          <Panel>
            <div className="settings-profile">
              <CrewAvatar person={person} compact />
              <div>
                <h2>{person.name}</h2>
                <p className="muted small">{person.role}</p>
                <span className="small muted">
                  {streak(state, person.id)}-day streak ·{" "}
                  {points(state, person.id).toLocaleString()} points
                </span>
              </div>
            </div>
          </Panel>
          <Panel>
            {[
              ["learn", "Learn", "book"],
              ["crew", "Crew medical officer view", "medical"],
              ["more", "All tools", "more"],
            ].map(([page, label, icon]) => (
              <button
                className="resource-link"
                key={page}
                onClick={() => go(page)}
              >
                <Icon name={icon} />
                <b>{label}</b>
                <Icon name="arrow" size={16} />
              </button>
            ))}
            <button className="resource-link" onClick={onSwitch}>
              <Icon name="crew" />
              <b>Switch crew member</b>
              <Icon name="arrow" size={16} />
            </button>
          </Panel>
          <Panel title="Your data">
            <p className="muted">
              Records are stored on this device. Photo files are kept separately
              and aren't included in exports.
            </p>
            <div className="button-stack">
              <button
                className="btn"
                onClick={() =>
                  download(
                    exportCsv(person.id),
                    "space-app-med-" +
                      person.id +
                      "-day" +
                      state.mission.day +
                      ".csv",
                    "text/csv",
                  )
                }
              >
                <Icon name="download" />
                Export my readings (CSV)
              </button>
              <button
                className="btn"
                onClick={() =>
                  download(
                    exportData(),
                    "space-app-med-day" + state.mission.day + ".json",
                    "application/json",
                  )
                }
              >
                <Icon name="download" />
                Export all data (JSON)
              </button>
              <button
                className="btn"
                onClick={() => {
                  setCalibration(null);
                  setMsg(
                    "Screen calibration cleared. The vision chart will ask again.",
                  );
                }}
              >
                <Icon name="refresh" />
                Reset vision calibration
              </button>
              {!confirm ? (
                <button className="btn danger" onClick={() => setConfirm(true)}>
                  <Icon name="refresh" />
                  Reset all data
                </button>
              ) : (
                <div className="alert red">
                  <p>
                    Reset all saved records and photos to the starting demo
                    data?
                  </p>
                  <div className="row">
                    <button
                      className="btn danger"
                      onClick={async () => {
                        try {
                          await resetAll();
                          setConfirm(false);
                          setMsg("Demo data reset.");
                        } catch {
                          setMsg("Unable to reset storage. Please try again.");
                        }
                      }}
                    >
                      Yes, reset
                    </button>
                    <button className="btn" onClick={() => setConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            {msg && <p role="status">{msg}</p>}
          </Panel>
        </aside>
        <div className="panel-stack">
          <Panel title="Environment">
            <div className="environment-grid">
              {Object.entries(ENVIRONMENTS).map(([id, e]) => (
                <button
                  className={
                    "environment-choice " +
                    (state.mission.environment === id ? "selected" : "")
                  }
                  key={id}
                  aria-pressed={state.mission.environment === id}
                  onClick={() => setEnvironment(id)}
                >
                  <h2>
                    <Icon name="orbit" />
                    {e.label}
                  </h2>
                  <p>
                    {e.gravity} · Earth delay {delayText(e)}
                  </p>
                  <span>{e.doseRate} mSv/day radiation</span>
                </button>
              ))}
            </div>
            <p className="small muted">
              {env.note} New daily readings use the chosen environment from the
              next mission day.
            </p>
          </Panel>
          <Panel title="Events">
            {[
              [
                "today",
                "Advance to day " + (state.mission.day + 1),
                "Starts tomorrow's routine and readings for everyone.",
                "Advance a day",
                advanceDay,
              ],
              [
                "sun",
                "Solar storm",
                "Shelter checklist and dose comparison. Demo lasts 40 seconds.",
                ev ? "View storm" : "Trigger storm",
                () => {
                  if (!ev) startSolarEvent(40);
                  go("radiation");
                },
              ],
              [
                "air",
                "CO₂ scrubber fault",
                "Changes cabin CO₂ and alerts the crew.",
                state.habitat.fault ? "Fix scrubber" : "Trigger fault",
                () => setCo2Fault(!state.habitat.fault),
              ],
              [
                "link",
                "Earth link",
                "Reports wait in the queue when the link is down.",
                state.link.online ? "Cut link" : "Restore link",
                () => setLinkOnline(!state.link.online),
              ],
            ].map(([icon, label, desc, button, action]) => (
              <div className="event-row" key={label}>
                <span className="icon-tile">
                  <Icon name={icon} />
                </span>
                <div>
                  <h3>{label}</h3>
                  <p className="muted small">{desc}</p>
                </div>
                <button className="btn" onClick={action}>
                  {button}
                </button>
              </div>
            ))}
            <div className="event-row">
              <span className="icon-tile">
                <Icon name="clock" />
              </span>
              <div>
                <h3>Demo speed</h3>
                <p className="small muted">
                  Earth-link time runs {state.demoSpeed} times faster.
                </p>
              </div>
              <select
                aria-label="Demo speed"
                value={state.demoSpeed}
                onChange={(e) => setDemoSpeed(Number(e.target.value))}
              >
                {[1, 10, 60, 120].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
