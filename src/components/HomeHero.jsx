import React, { useState } from "react";
import {
  useStore,
  envOf,
  delayText,
  habitatToday,
  co2Status,
  ppO2,
  rowFor,
  historyOf,
  indicatorStatuses,
  dueChecks,
  CO2_LIMIT_MMHG,
  CAREER_LIMIT_MSV,
} from "../backend/api.js";
import { syncWearableSnapshot } from "../backend/homeUpgrades.js";
import { indicators, indicatorSummary, round1 } from "../lib.js";
import { Icon, Status, Sparkline } from "./ConsoleUI.jsx";
import CrewAvatar from "./CrewAvatar.jsx";

// ---------- Telemetry ribbon: mission + cabin in one scannable line ----------
export function TelemetryRibbon({ person }) {
  const state = useStore();
  const env = envOf(state);
  const hab = habitatToday(state) || {};
  const row = rowFor(state, person.id) || {};
  const co2 = co2Status(hab.co2);
  const pills = [
    ["orbit", "Day", state.mission.day, null, "green"],
    ["body", "Gravity", env.gravity, null, "green"],
    ["clock", "Earth delay", delayText(env), "one way", state.link.online ? "green" : "yellow"],
    ["air", "CO₂", hab.co2, "mmHg", co2],
    ["air", "O₂", ppO2(hab), "kPa", "green"],
    ["grid", "Cabin", hab.pressure, "kPa", "green"],
    ["radiation", "Dose", Math.round(row.radiation ?? 0), "mSv", row.radiation >= CAREER_LIMIT_MSV * 0.8 ? "red" : row.radiation >= CAREER_LIMIT_MSV * 0.5 ? "yellow" : "green"],
  ];
  return (
    <div className="telemetry-ribbon" aria-label="Current mission and cabin telemetry">
      <span className="ribbon-mission">
        <small className="micro-label">Current mission</small>
        <b>{state.mission.name}</b>
      </span>
      {pills.map(([icon, label, value, unit, tone]) => (
        <span className={`ribbon-pill tone-${tone}`} key={label} title={label === "CO₂" ? `NASA limit ${CO2_LIMIT_MMHG} mmHg (1-hour average)` : undefined}>
          <i className="live-dot" aria-hidden="true" />
          <small className="micro-label">{label}</small>
          <b className="tabular">{value ?? "—"}</b>
          {unit && <small className="unit">{unit}</small>}
        </span>
      ))}
    </div>
  );
}

// ---------- Hero: who, how they are, and the one thing to do ----------
export function HealthHero({ person, score, status, alerts, checkedIn, primary, go, children }) {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const first = person.name.split(" ").at(-1);
  const top = alerts[0];
  const sentence =
    status === "red"
      ? `${first} needs attention now: ${primary.reason || top?.title}. Tell the medical officer.`
      : status === "yellow"
        ? `${first} is mostly in range, with ${alerts.length} follow-up${alerts.length === 1 ? "" : "s"} today.`
        : `${first}'s readings are in range today. Keep the routine going.`;
  return (
    <section className="hero-card glass" aria-label="Your status" id="health-summary">
      <div className="hero-top">
        <CrewAvatar person={person} compact />
        <div>
          <p className="micro-label">Crew readiness</p>
          <h2>Welcome back, {first}</h2>
        </div>
        <Status status={status} />
      </div>
      <div className="hero-body">
        <div className={`hero-ring tone-${status}`} style={{ "--score": score }}>
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <circle className="ring-track" cx="80" cy="80" r="66" />
            <circle className="ring-value" cx="80" cy="80" r="66" pathLength="100" strokeDasharray={`${score} 100`} />
          </svg>
          <div>
            <strong className="tabular">
              {score}
              <span className="score-denominator"> / 100</span>
            </strong>
            <small className="micro-label">Health score</small>
          </div>
        </div>
        <div className="hero-copy">
          <p className="hero-sentence">{sentence}</p>
          <p className="small muted">{checkedIn ? "Daily check-in done." : "Daily check-in not done yet."} The score starts at 100 and drops for each reading, symptom or check outside its range.</p>
          <div className="hero-actions">
            <button className="btn primary hero-cta" onClick={primary.onClick}>
              {primary.label} <Icon name="arrow" size={18} />
            </button>
            <button
              className={"btn" + (syncing ? " shimmer" : "")}
              onClick={() => {
                setSyncing(true);
                try {
                  const saved = syncWearableSnapshot(person.id);
                  setMsg(saved?.private ? "Saved to Private Sandbox only." : "Wearables synced to today's readings.");
                } catch (e) {
                  setMsg(e.message);
                }
                setTimeout(() => setSyncing(false), 900);
              }}
            >
              <Icon name="refresh" size={18} /> Sync wearables
            </button>
          </div>
          {msg && <p className="small" role="status">{msg}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------- Top 3 next steps ----------
const CHECK_TIME = { pvt: "~3 min", hr: "~20 sec", amsler: "~2 min", acuity: "~3 min", hearing: "~3 min", tlx: "~1 min", urine: "~10 sec", stand: "~6 min", balance: "~30 sec", face: "~1 min" };

export function nextSteps(state, pid, alerts, stepTitle, openAlert, go) {
  const items = alerts.slice(0, 2).map((a, i) => ({
    key: a.id,
    title: stepTitle(a) || a.title,
    reason: a.title,
    level: a.level,
    pill: a.level === "red" ? "Priority 1" : i === 0 ? "Priority 1" : "Priority 2",
    time: a.id.startsWith("check-") ? CHECK_TIME[a.id.slice(6)] || "~2 min" : "~2 min",
    go: () => openAlert(a),
  }));
  if (!state.checkins[pid]?.[state.mission.day])
    items.push({ key: "checkin", title: "Daily check-in", reason: "Eight short steps", level: "info", pill: "Daily", time: "~3 min", go: () => go("checkin") });
  for (const { check } of dueChecks(state, pid).filter((d) => d.due)) {
    items.push({
      key: "due-" + check.id,
      title: check.title,
      reason: "Scheduled self-check",
      level: "info",
      pill: "Scheduled",
      time: CHECK_TIME[check.id] || "~2 min",
      go: () => (check.photo ? go("photos", { category: "face" }) : go("checks", { check: check.id })),
    });
  }
  const row = rowFor(state, pid) || {};
  if (row.water < 2) items.push({ key: "water", title: "Drink 250 mL of water", reason: `${row.water} L of 2 L today`, level: "info", pill: "Preventive", time: "~5 sec", go: () => go("log") });
  return items.slice(0, 3);
}

// ---------- Live vitals grid: value + baseline delta + status + 7-day sparkline ----------
const VITALS = ["heartRate", "systolic", "spo2", "glucose", "temp", "sleep", "mood", "radiation"];
const SHORT = { heartRate: "Resting HR", systolic: "Blood pressure", spo2: "SpO₂", glucose: "Glucose", temp: "Temperature", sleep: "Sleep", mood: "Mood", radiation: "Radiation" };

export function VitalsGrid({ person, go }) {
  const state = useStore();
  const hist = historyOf(state, person.id);
  const st = indicatorStatuses(state, person.id);
  return (
    <div className="vitals-grid">
      {VITALS.map((id) => {
        const ind = indicators.find((i) => i.id === id);
        if (!ind) return null;
        const sum = indicatorSummary(ind, hist);
        const row = hist[hist.length - 1];
        const value = id === "systolic" ? `${row.systolic}/${row.diastolic}` : sum.latest;
        const unit = id === "systolic" ? "mmHg" : id === "mood" ? "/10" : ind.unit;
        const delta = id === "radiation" ? null : round1(sum.latest - sum.baseline);
        return (
          <button key={id} className={`vital-card tone-${st[id]}`} onClick={() => go("trends", { indicator: id })}>
            <span className="vital-head">
              <small className="micro-label">{SHORT[id]}</small>
              <i className={`status-dot dot-${st[id]}`} aria-label={st[id]} />
            </span>
            <span className="vital-value">
              <b className="tabular">{value}</b>
              <small className="unit">{unit}</small>
            </span>
            <span className="vital-delta">
              {id === "radiation"
                ? `${Math.round((sum.latest / CAREER_LIMIT_MSV) * 100)}% of career limit`
                : `${delta > 0 ? "+" : ""}${delta} vs your baseline`}
            </span>
            <Sparkline values={hist.slice(-7).map((r) => r[id])} label={`${ind.label}, last 7 days`} baseline={id === "radiation" ? undefined : sum.baseline} />
          </button>
        );
      })}
    </div>
  );
}

// ---------- Section tabs (progressive disclosure). Hidden panels stay in the page. ----------
export const HOME_TABS = [
  ["plan", "today", "Today's plan"],
  ["vitals", "heart", "Live vitals & wearables"],
  ["crew", "star", "Crew bio-dome & streaks"],
  ["all", "grid", "All sections"],
];

export function HomeTabs({ tab, setTab }) {
  return (
    <div className="segmented" role="tablist" aria-label="Home sections">
      {HOME_TABS.map(([id, icon, label]) => (
        <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
          <Icon name={icon} size={18} /> {label}
        </button>
      ))}
    </div>
  );
}
