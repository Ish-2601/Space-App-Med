// Rules engine: pure functions that turn the stored data into statuses, alerts, scores, quests and badges.
import { indicators, statusOf, worstStatus, statusRank } from "../lib.js";
import { ENVIRONMENTS, QUESTS, BADGES, SYMPTOMS } from "./content.js";

export const CAREER_LIMIT_MSV = 600; // NASA-STD-3001 Vol 1 Rev B

export function historyOf(state, pid) {
  return state.history[pid];
}

export function rowFor(state, pid, day = state.mission.day) {
  return state.history[pid].find((r) => r.day === day);
}

export function personOf(state, pid) {
  return state.crew.find((p) => p.id === pid);
}

// Symptoms reported today (check-in + symptom log)
export function symptomsToday(state, pid, day = state.mission.day) {
  const ids = new Set(state.checkins[pid][day]?.symptoms || []);
  state.symptomLog[pid].filter((s) => s.day === day).forEach((s) => ids.add(s.symptom));
  return SYMPTOMS.filter((s) => ids.has(s.id));
}

export function indicatorStatuses(state, pid) {
  const row = rowFor(state, pid);
  return Object.fromEntries(indicators.map((i) => [i.id, statusOf(i, row[i.id])]));
}

export function partStatus(state, pid, part) {
  const statuses = indicatorStatuses(state, pid);
  const list = indicators.filter((i) => i.bodyPart === part).map((i) => statuses[i.id]);
  if (symptomsToday(state, pid).some((s) => s.part === part)) list.push("yellow");
  const ci = state.checkins[pid][state.mission.day];
  if (part === "eyes" && ci?.vision === "changed") list.push("yellow");
  if (part === "eyes" && ci?.vision === "normal") list.push("green");
  if (part === "brain" && ci?.motion >= 6) list.push("yellow");
  return worstStatus(list);
}

export function activeEvent(state) {
  return state.events.find((e) => e.active) || null;
}

export function activeEmergencies(state, pid) {
  return state.emergencies.filter((e) => !e.resolvedAt && (!pid || e.pid === pid));
}

// All alerts for a person, most severe first. level: red | yellow | info
export function alertsFor(state, pid) {
  const alerts = [];
  const hist = historyOf(state, pid);
  const row = rowFor(state, pid);
  const day = state.mission.day;

  const ev = activeEvent(state);
  if (ev && !ev.sheltered[pid]) {
    alerts.push({ id: "spe", level: "red", title: "Solar storm: go to the storm shelter now", action: "Open Radiation and confirm you are sheltered.", page: "radiation" });
  }
  for (const em of activeEmergencies(state, pid)) {
    alerts.push({ id: `em-${em.id}`, level: "red", title: `Emergency in progress: ${em.title}`, action: "Follow the emergency steps.", page: "emergency" });
  }
  for (const ind of indicators) {
    const s = statusOf(ind, row[ind.id]);
    if (s === "yellow" || s === "red") {
      alerts.push({ id: `ind-${ind.id}`, level: s, title: `${ind.label}: ${row[ind.id]} ${ind.unit}`, action: ind.action[s], part: ind.bodyPart, indicator: ind.id, escalate: s === "red" });
    }
  }
  const last3 = hist.slice(-3);
  if (last3.length === 3 && last3.every((r) => r.sleep < 6)) {
    alerts.push({ id: "trend-sleep", level: "yellow", title: "Under 6 hours of sleep 3 nights in a row", action: "Protect your sleep window tonight and tell the commander if you are fatigued.", part: "brain" });
  }
  if (last3.length === 3 && last3.every((r) => r.exercise < 90)) {
    alerts.push({ id: "trend-exercise", level: "yellow", title: "Below the 90-minute exercise target 3 days running", action: "Bone and muscle loss speeds up without exercise. Schedule a session today.", part: "bones" });
  }
  for (const s of symptomsToday(state, pid)) {
    alerts.push({ id: `sym-${s.id}`, level: "yellow", title: `Symptom reported: ${s.label}`, action: "Open the Med guide for what to do and when to escalate.", part: s.part, page: "medguide", guide: s.id });
  }
  const ci = state.checkins[pid][day];
  if (ci?.vision === "changed") {
    alerts.push({ id: "vision", level: "yellow", title: "Vision change reported", action: "Report to the CMO; an eye exam or ultrasound may be needed (SANS).", part: "eyes", escalate: true });
  }
  if (ci?.motion >= 6) {
    alerts.push({ id: "motion", level: "yellow", title: `Motion sickness ${ci.motion}/10`, action: "Slow head movements, fix eyes on a stable reference, use kit medication per label.", part: "brain" });
  }
  if (!ci) {
    alerts.push({ id: "checkin-due", level: "info", title: "Daily check-in due", action: "Takes about 3 minutes.", page: "checkin" });
  }
  const rank = { red: 3, yellow: 2, info: 1 };
  return alerts.sort((a, b) => rank[b.level] - rank[a.level]);
}

export function overallStatus(state, pid) {
  const levels = alertsFor(state, pid).map((a) => (a.level === "info" ? "green" : a.level));
  return worstStatus(["green", ...levels]);
}

export function healthScore(state, pid) {
  const st = Object.values(indicatorStatuses(state, pid));
  const yellow = st.filter((s) => s === "yellow").length;
  const red = st.filter((s) => s === "red").length;
  const sym = symptomsToday(state, pid).length;
  return Math.max(0, Math.min(100, 100 - yellow * 6 - red * 18 - sym * 4));
}

export function streak(state, pid) {
  let n = 0;
  for (let d = state.mission.day; d >= state.mission.startDay; d--) {
    if (state.checkins[pid][d]) n++;
    else if (d !== state.mission.day) break; // today not done yet doesn't break the streak
  }
  return n;
}

function questContext(state, pid, day) {
  const row = rowFor(state, pid, day) || {};
  const visionDays = Object.entries(state.checkins[pid]).filter(([d, c]) => c.vision && d > day - 7 && d <= day);
  return {
    row,
    checkedIn: !!state.checkins[pid][day],
    journaledToday: state.journal[pid].some((j) => j.day === day),
    visionThisWeek: visionDays.length > 0,
    visionToday: !!state.checkins[pid][day]?.vision,
  };
}

export function tasksFor(state, pid, day = state.mission.day) {
  const ctx = questContext(state, pid, day);
  return QUESTS.map((q) => ({ id: q.id, label: q.label, points: q.points, weekly: !!q.weekly, done: q.check(ctx) }));
}

export function points(state, pid) {
  let total = 0;
  for (const row of historyOf(state, pid)) {
    const ctx = questContext(state, pid, row.day);
    for (const q of QUESTS) {
      const done = q.weekly ? ctx.visionToday : q.check(ctx);
      if (done) total += q.points;
    }
  }
  return total;
}

export function badgesFor(state, pid) {
  const last7 = historyOf(state, pid).slice(-7);
  const ctx = {
    streak: streak(state, pid),
    exerciseDays: last7.filter((r) => r.exercise >= 90).length,
    waterDays: last7.filter((r) => r.water >= 2).length,
    journalCount: state.journal[pid].length,
    sheltered: state.shelteredEver[pid],
  };
  return BADGES.map((b) => ({ id: b.id, label: b.label, earned: b.test(ctx) }));
}

export function doseSummary(state, pid) {
  const row = rowFor(state, pid);
  const env = ENVIRONMENTS[state.mission.environment];
  const dose = row.radiation;
  const pct = (dose / CAREER_LIMIT_MSV) * 100;
  const daysTo = (target) => (dose >= target ? 0 : Math.ceil((target - dose) / env.doseRate));
  return {
    dose, pct, limit: CAREER_LIMIT_MSV, rate: env.doseRate,
    daysTo50: daysTo(CAREER_LIMIT_MSV * 0.5),
    daysTo80: daysTo(CAREER_LIMIT_MSV * 0.8),
    daysTo100: daysTo(CAREER_LIMIT_MSV),
  };
}

export function crewOverview(state) {
  return state.crew.map((p) => {
    const alerts = alertsFor(state, p.id).filter((a) => a.level !== "info");
    const ev = activeEvent(state);
    return {
      person: p,
      status: overallStatus(state, p.id),
      score: healthScore(state, p.id),
      alerts,
      checkedIn: !!state.checkins[p.id][state.mission.day],
      sheltered: ev ? !!ev.sheltered[p.id] : null,
    };
  });
}

export function earthDelayMs(state) {
  const min = ENVIRONMENTS[state.mission.environment].delayMin;
  return (min * 60000) / state.demoSpeed;
}

export { statusRank };
