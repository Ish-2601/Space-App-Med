import React from "react";
import {
  useStore,
  doseSummary,
  activeEvent,
  startSolarEvent,
  setSheltered,
  endSolarEvent,
  toggleShelterStep,
  ENVIRONMENTS,
  EMERGENCIES,
  historyOf,
} from "../backend/api.js";
import { round1 } from "../lib.js";
import useNow from "../components/useNow.js";
import CrewAvatar from "../components/CrewAvatar.jsx";
import {
  PageTitle,
  Panel,
  Back,
  Icon,
  Status,
  Segments,
  Sparkline,
} from "../components/ConsoleUI.jsx";
export default function Radiation({ person, go }) {
  const state = useStore(),
    now = useNow(),
    pid = person.id,
    d = doseSummary(state, pid),
    active = activeEvent(state),
    ev = active || state.events.find((e) => !e.active);
  const env = ENVIRONMENTS[state.mission.environment],
    steps = EMERGENCIES.find((e) => e.id === "spe").steps,
    sheltered = ev ? state.crew.filter((p) => ev.sheltered[p.id]).length : 0;
  const rows = historyOf(state, pid).slice(-15),
    daily = rows
      .slice(1)
      .map((r, i) => round1(r.radiation - rows[i].radiation));
  return (
    <div>
      <Back onClick={() => go("body", { part: "wholeBody" })}>Body</Back>
      <PageTitle
        eyebrow="Radiation"
        title={active ? "Solar storm" : "Your radiation exposure"}
        description={
          active
            ? "The shelter checklist follows your crew through the event and all-clear."
            : env.note
        }
      >
        {active && (
          <Status status="red">
            In progress · all-clear in{" "}
            {Math.max(0, Math.ceil((active.endsAt - now) / 1000))} s
          </Status>
        )}
      </PageTitle>
      {ev ? (
        <div className="main-with-aside">
          <Panel title="Storm shelter" tone={active ? "red" : "green"}>
            <p className="shelter-intro">
              {active
                ? "A solar particle event is under way. In this simulation, sheltering reduces the event dose by about 90%."
                : "All-clear. The solar event has ended. Your modeled dose has been added to the record."}
            </p>
            <Status
              status={ev.sheltered[pid] ? "green" : active ? "red" : "info"}
            >
              {ev.sheltered[pid]
                ? "You are marked sheltered"
                : active
                  ? "Not yet sheltered"
                  : "Event complete"}
            </Status>
            <div className="protocol-steps">
              {steps.map((s, i) => {
                const checked =
                  i === 0 ? !!ev.sheltered[pid] : !!ev.checklists?.[pid]?.[i];
                const disabled =
                  i === 0
                    ? !active
                    : i === 2
                      ? sheltered !== state.crew.length
                      : i >= 3
                        ? !!active
                        : false;
                return (
                  <div
                    key={s}
                    className={"protocol-step " + (checked ? "done" : "")}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() =>
                          i === 0
                            ? setSheltered(pid, !checked)
                            : toggleShelterStep(ev.id, pid, i)
                        }
                      />
                      <span>
                        <b>{s}</b>
                        <small>
                          {i === 2
                            ? sheltered +
                              " of " +
                              state.crew.length +
                              " confirmed"
                            : i >= 3 && active
                              ? "Available after the all-clear"
                              : i === 4
                                ? "Dose is logged automatically at the end of the simulated event."
                                : ""}
                        </small>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="row">
              {active ? (
                <button className="btn" onClick={endSolarEvent}>
                  End event now (demo)
                </button>
              ) : (
                <button className="btn" onClick={() => startSolarEvent(40)}>
                  <Icon name="sun" />
                  Run another storm demo
                </button>
              )}
            </div>
          </Panel>
          <Panel title="Crew">
            <p className="muted">
              {sheltered} of {state.crew.length} sheltered
            </p>
            <Segments
              value={sheltered}
              max={state.crew.length}
              count={state.crew.length}
              label="Crew sheltered"
              tone="green"
            />
            {state.crew.map((p) => (
              <div className="shelter-crew-row" key={p.id}>
                <CrewAvatar person={p} compact />
                <div>
                  <b>
                    {p.name}
                    {pid === p.id ? " (you)" : ""}
                  </b>
                  <small>{p.role}</small>
                </div>
                <Status status={ev.sheltered[p.id] ? "green" : "red"}>
                  {ev.sheltered[p.id] ? "In" : "Out"}
                </Status>
              </div>
            ))}
            <button className="btn full-width" onClick={() => go("more")}>
              {active
                ? "Switch profile to confirm shelter"
                : "Back to crew tools"}
            </button>
            <p className="small muted">
              {active
                ? "Each crew member confirms their own arrival."
                : "Shelter status recorded at the all-clear."}
            </p>
          </Panel>
        </div>
      ) : (
        <Panel title="Space weather">
          <div className="row spread">
            <div>
              <h2>No active solar event</h2>
              <p className="muted">
                Your routine dose continues to be tracked.
              </p>
            </div>
            <button className="btn" onClick={() => startSolarEvent(40)}>
              <Icon name="sun" />
              Simulate a solar storm
            </button>
          </div>
        </Panel>
      )}
      <Panel title="Your dose" className="dose-window">
        <div className="dose-columns">
          <section>
            <p className="eyebrow">Career exposure</p>
            <p className="dose-stat">
              <strong>{round1(d.dose)}</strong>{" "}
              <span className="muted">of {d.limit} mSv</span>
            </p>
            <Segments
              value={d.dose}
              max={d.limit}
              label="Cumulative radiation dose"
              tone={d.pct > 80 ? "red" : d.pct > 50 ? "yellow" : "info"}
            />
            <p className="muted small">
              {round1(d.pct)}% of the modeled career limit. Your dosimeter
              tracks exposure you cannot see or feel.
            </p>
          </section>
          <section>
            <p className="eyebrow">
              {ev ? "This storm · model" : "Current environment"}
            </p>
            {ev ? (
              <>
                <p className="row spread small">
                  <span>If sheltered</span>
                  <b className="text-green">
                    +{round1(ev.extraDose * 0.1)} mSv
                  </b>
                </p>
                <Segments
                  value={10}
                  max={100}
                  label="Sheltered relative storm dose"
                  tone="green"
                />
                <p className="row spread small">
                  <span>If not sheltered</span>
                  <b className="text-red">+{ev.extraDose} mSv</b>
                </p>
                <Segments
                  value={100}
                  max={100}
                  label="Unsheltered relative storm dose"
                  tone="red"
                />
                <p className="small muted">
                  {active
                    ? "Dose is applied at the all-clear."
                    : "Your dose from this event: " +
                      (ev.doses[pid] ?? "—") +
                      " mSv."}
                </p>
              </>
            ) : (
              <>
                <h2>{d.rate} mSv/day</h2>
                <p className="muted">{env.label}</p>
              </>
            )}
          </section>
          <section>
            <p className="eyebrow">Daily dose · Last 14 days</p>
            <Sparkline
              bars
              values={daily}
              baseline={d.rate}
              label="Daily radiation dose in millisieverts"
            />
            <p className="small muted">Dashed line: {d.rate} mSv/day here</p>
          </section>
        </div>
        <div className="row spread dose-notes">
          <span className="small muted">
            At the current rate: {d.daysTo50} days to 50% · {d.daysTo80} days to
            80% · {d.daysTo100} days to limit.
          </span>
          <button className="text-button" onClick={() => go("learn")}>
            Research and sources <Icon name="arrow" size={15} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
