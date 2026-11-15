import React, { useState } from "react";
import {
  useStore,
  rowFor,
  historyOf,
  indicatorStatuses,
  alertsFor,
  healthScore,
  overallStatus,
  dueChecks,
  evaluateTest,
  latestTest,
  medsDue,
  symptomsToday,
  insightsFor,
  envOf,
  sendReport,
  CHECKS,
} from "../backend/api.js";
import { indicators, personalBaseline, rangeText, round1 } from "../lib.js";
import { PageTitle, Panel, Status, Icon, Back } from "../components/ConsoleUI.jsx";

// One-page health summary a flight surgeon can read quickly. Prints cleanly or saves as PDF.
export default function Summary({ person, go }) {
  const state = useStore();
  const pid = person.id;
  const row = rowFor(state, pid);
  const hist = historyOf(state, pid);
  const st = indicatorStatuses(state, pid);
  const alerts = alertsFor(state, pid).filter((a) => a.level !== "info");
  const env = envOf(state);
  const [sent, setSent] = useState(false);
  const checks = CHECKS.filter((c) => !c.photo)
    .map((c) => ({ c, t: latestTest(state, pid, c.id) }))
    .filter((x) => x.t);
  const syms = symptomsToday(state, pid);

  return (
    <div className="summary-page">
      <div className="no-print">
        <Back onClick={() => go("more")}>More</Back>
      </div>
      <PageTitle
        eyebrow={[state.mission.name, `Day ${state.mission.day}`, env.label !== state.mission.name && env.label].filter(Boolean).join(" · ")}
        title={`Health summary: ${person.name}`}
        description={`${person.role}. Generated ${new Date().toLocaleString()} from this device. Simulated data, not medical advice.`}
      >
        <div className="row no-print">
          <button className="btn primary" onClick={() => window.print()}>
            <Icon name="download" size={18} /> Print or save as PDF
          </button>
          <button className="btn" disabled={sent} onClick={() => { sendReport(pid, "health"); setSent(true); }}>
            <Icon name="send" size={18} /> {sent ? "Queued for the flight surgeon" : "Send to flight surgeon"}
          </button>
        </div>
      </PageTitle>

      <div className="summary-grid">
        <Panel title="Overall">
          <p className="summary-score">
            <b>{healthScore(state, pid)}</b> / 100 <Status status={overallStatus(state, pid)} />
          </p>
          <p className="muted small">Score starts at 100 and drops for each reading, symptom or check outside its range.</p>
          {alerts.length ? (
            <ul className="summary-list">
              {alerts.map((a) => (
                <li key={a.id}><Status status={a.level} /> {a.title}</li>
              ))}
            </ul>
          ) : (
            <p>No health alerts.</p>
          )}
          {syms.length > 0 && <p><b>Symptoms today:</b> {syms.map((s) => s.label).join(", ")}</p>}
        </Panel>

        <Panel title="Readings today">
          <table className="compact-table summary-table">
            <thead>
              <tr><th>Indicator</th><th>Today</th><th>Your baseline</th><th>Healthy range</th><th>Status</th></tr>
            </thead>
            <tbody>
              {indicators.map((i) => {
                const base = personalBaseline(i, hist);
                return (
                  <tr key={i.id}>
                    <td>{i.label}</td>
                    <td><b>{row[i.id]}</b> {i.unit}</td>
                    <td>{base == null ? "–" : round1(base)}</td>
                    <td>{rangeText(i, base)}</td>
                    <td><Status status={st[i.id]} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Latest checks">
          <ul className="summary-list">
            {checks.map(({ c, t }) => {
              const ev = evaluateTest(state, pid, t);
              return (
                <li key={c.id}>
                  <Status status={ev.status} /> <b>{c.title}</b>, day {t.day}: {ev.summary}
                </li>
              );
            })}
          </ul>
          <p className="muted small">
            Due now: {dueChecks(state, pid).filter((d) => d.due).map((d) => d.check.title).join(", ") || "nothing"}
          </p>
        </Panel>

        <Panel title="Supplements and patterns">
          <ul className="summary-list">
            {medsDue(state, pid).map((m) => (
              <li key={m.med}>{m.name} ({m.freq}): {m.done ? "taken" : "not yet taken"}</li>
            ))}
          </ul>
          <ul className="summary-list">
            {insightsFor(state, pid).map((i) => (
              <li key={i.id}>{i.title}. <span className="muted">{i.detail}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
