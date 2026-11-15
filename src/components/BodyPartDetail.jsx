import React, { useState } from "react";
import {
  useStore,
  historyOf,
  partStatus,
  symptomsToday,
  recentCheckResults,
  dueChecks,
  MED_GUIDE,
  notifyCMO,
  sendReport,
  testsOf,
} from "../backend/api.js";
import { bodyParts, indicators, indicatorSummary, round1 } from "../lib.js";
import { Icon, Status } from "./ConsoleUI.jsx";
import HealthTrend from "./HealthTrend.jsx";
import { sandboxEnabled } from "../backend/sandbox.js";
import { HEALTH_AREAS } from "../data/healthAreas.js";
export default function BodyPartDetail({ partKey, person, go }) {
  const state = useStore(),
    pid = person.id,
    part = bodyParts[partKey],
    history = historyOf(state, pid),
    status = partStatus(state, pid, partKey);
  const sums = indicators
    .filter((i) => i.bodyPart === partKey)
    .map((i) => ({ ind: i, ...indicatorSummary(i, history) }));
  const syms = symptomsToday(state, pid).filter((s) =>
      HEALTH_AREAS[partKey].symptoms.includes(s.id),
    ),
    checks = recentCheckResults(state, pid).filter(
      (r) => r.check.part === partKey,
    ),
    due = dueChecks(state, pid).filter(
      (d) => d.check.part === partKey && d.due,
    ),
    guides = MED_GUIDE.filter(
      (g) =>
        g.part === partKey || HEALTH_AREAS[partKey].symptoms.includes(g.id),
    ),
    ci = state.checkins[pid][state.mission.day];
  const [msg, setMsg] = useState("");
  const primary = sums[0],
    vision =
      partKey === "eyes"
        ? testsOf(state, pid, "acuity").slice(0, 8).reverse()
        : [];
  return (
    <div className="detail">
      <div className="detail-head">
        <h2>{part.name}</h2>
        <Status status={status} />
      </div>
      {person.notes?.[partKey] && (
        <p className="note">{person.notes[partKey]}</p>
      )}
      {syms.map((s) => (
        <p key={s.id} className="alert yellow">
          You reported today: {s.label}
        </p>
      ))}
      {partKey === "vestibular" && ci?.motion > 0 && (
        <p className="alert yellow">Motion sickness today: {ci.motion}/10</p>
      )}
      {sums.length > 0 && (
        <>
          <h3>Your numbers vs your usual</h3>
          <div className="body-readings">
            {sums.map(({ ind, latest, baseline, status: s }) => (
              <div className="body-reading" key={ind.id}>
                <div>
                  <b>{ind.label}</b>
                  <span className="small muted">
                    Usual {round1(baseline)} {ind.unit}
                  </span>
                </div>
                <strong>
                  {latest}
                  <small> {ind.unit}</small>
                </strong>
                <Status status={s} />
                <button
                  className="text-button"
                  onClick={() => go("trends", { indicator: ind.id })}
                >
                  Trend <Icon name="arrow" size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {primary && (
        <div className="detail-chart">
          <p className="small muted">{primary.ind.label} · Last 14 days</p>
          <HealthTrend compact pid={pid} indicatorId={primary.ind.id} />
        </div>
      )}
      {!primary && vision.length > 0 && (
        <div className="detail-chart">
          <p className="small muted">
            Left-eye acuity · logMAR (lower is better)
          </p>
          <HealthTrend
            compact
            pid={pid}
            indicatorId="acuity"
            rows={vision.map((t) => ({ day: t.day, value: t.result.left }))}
            label="Left eye near-vision results"
            unit="logMAR"
          />
          <p className="small muted">Your recent near-vision checks</p>
        </div>
      )}
      <h3>Recent checks</h3>
      {checks.map((c) => (
        <div className="reading" key={c.check.id}>
          <div className="row spread">
            <b>{c.check.title}</b>
            <Status status={c.status} />
          </div>
          <p className="muted small">
            Day {c.test.day} · {c.summary}
          </p>
          <button
            className="text-button"
            onClick={() => go("checks", { check: c.check.id })}
          >
            Check again <Icon name="arrow" size={14} />
          </button>
        </div>
      ))}
      {due.map((d) => (
        <div key={d.check.id} className="reading row spread">
          <div>
            <b>{d.check.title}</b>
            <p className="muted small">Due now</p>
          </div>
          <button
            className="btn primary"
            onClick={() =>
              d.check.photo
                ? go("photos", { category: "face" })
                : go("checks", { check: d.check.id })
            }
          >
            Do it now <Icon name="arrow" size={16} />
          </button>
        </div>
      ))}
      {!checks.length && !due.length && (
        <p className="muted small">
          No scheduled checks for this area. Your daily readings appear above.
        </p>
      )}
      <div className="body-guidance">
        <section>
          <h3>What to do</h3>
          <ul className="quiet-list">
            {sums
              .filter((s) => s.status === "yellow" || s.status === "red")
              .map((s) => (
                <li key={s.ind.id}>
                  <Icon name="info" size={16} />
                  <span>{s.ind.action[s.status]}</span>
                </li>
              ))}
            {checks
              .filter((c) => c.status === "yellow" || c.status === "red")
              .map((c) => (
                <li key={c.check.id}>
                  <Icon name="info" size={16} />
                  <span>{c.check.action[c.status]}</span>
                </li>
              ))}
            {part.prevention.slice(0, 3).map((p) => (
              <li key={p}>
                <Icon name="check" size={16} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
        {guides.length > 0 && (
          <section className="escalation-box">
            <h3>Escalate if</h3>
            <ul className="quiet-list">
              {guides[0].escalate.map((s) => (
                <li key={s}>
                  <Icon name="alert" size={16} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            notifyCMO(
              pid,
              person.name + ": please review " + part.name,
              status === "green" ? "info" : status,
            );
            setMsg(
              sandboxEnabled()
                ? "Saved in Private Sandbox. No medical officer notification sent."
                : "Medical officer notified.",
            );
          }}
        >
          <Icon name="medical" />
          Notify CMO
        </button>
        <button
          className="btn"
          onClick={() => {
            sendReport(pid, "health");
            setMsg(
              sandboxEnabled()
                ? "Saved in Private Sandbox. No report queued."
                : "Health report queued in the simulated Earth link.",
            );
          }}
        >
          <Icon name="send" />
          Send health report
        </button>
      </div>
      {msg && (
        <p role="status" className="small">
          {msg}
        </p>
      )}
      <details className="body-explainer">
        <summary>
          <Icon name="book" size={18} />
          Why this happens in space
        </summary>
        <p>{part.info}</p>
        <ul>
          {part.prevention.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="row">
          {guides.map((g) => (
            <button
              key={g.id}
              className="btn small"
              onClick={() => go("medguide", { guide: g.id })}
            >
              {g.title}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
