// Rules engine: pure functions that turn stored data into statuses, alerts, scores, quests and badges.
import { indicators, statusOf, worstStatus, statusRank, personalBaseline } from "../lib.js";
import { ENVIRONMENTS, QUESTS, BADGES, SYMPTOMS, CHECKS, MEDKIT } from "./content.js";
import { snellen } from "./vision.js";

export const CAREER_LIMIT_MSV = 600; // NASA-STD-3001 Vol 1 Rev B
export const CO2_LIMIT_MMHG = 3.0; // NASA-STD-3001 Vol 2 Rev D, 1-hour average
export const CO2_TARGET_MMHG = 2.5; // NASA OCHMO: keeps headache risk around 1%
const RECENT_DAYS = 7;

// ---------- Basic lookups ----------

export function historyOf(state, pid) {
  return state.history[pid];
}

export function rowFor(state, pid, day = state.mission.day) {
  return state.history[pid].find((r) => r.day === day);
}

export function personOf(state, pid) {
  return state.crew.find((p) => p.id === pid);
}

export function envOf(state) {
  return ENVIRONMENTS[state.mission.environment];
}

export function baselineOf(state, pid, ind) {
  return personalBaseline(ind, historyOf(state, pid));
}

export function indicatorStatus(state, pid, ind, value = rowFor(state, pid)[ind.id]) {
  return statusOf(ind, value, baselineOf(state, pid, ind));
}

export function indicatorStatuses(state, pid) {
  return Object.fromEntries(indicators.map((i) => [i.id, indicatorStatus(state, pid, i)]));
}

// Symptoms reported today (check-in + symptom log)
export function symptomsToday(state, pid, day = state.mission.day) {
  const ids = new Set(state.checkins[pid][day]?.symptoms || []);
  state.symptomLog[pid].filter((s) => s.day === day).forEach((s) => ids.add(s.symptom));
  return SYMPTOMS.filter((s) => ids.has(s.id));
}

export function activeEvent(state) {
  return state.events.find((e) => e.active) || null;
}

export function activeEmergencies(state, pid) {
  return state.emergencies.filter((e) => !e.resolvedAt && (!pid || e.pid === pid));
}

// ---------- Medical checks (tests) ----------

export function testsOf(state, pid, type) {
  return state.tests[pid].filter((t) => t.type === type); // newest first
}

export function latestTest(state, pid, type) {
  return testsOf(state, pid, type)[0] || null;
}

function avg(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Turns one test result into { status, summary }
export function evaluateTest(state, pid, test) {
  const r = test.result;
  const all = testsOf(state, pid, test.type);
  if (test.type === "hr") {
    const ind = indicators.find((i) => i.id === "heartRate");
    return { status: indicatorStatus(state, pid, ind, r.bpm), summary: `${r.bpm} bpm (${r.mode}, signal ${r.label})` };
  }
  if (test.type === "amsler") {
    const marks = r.left.length + r.right.length;
    const eyes = [r.left.length && "left", r.right.length && "right"].filter(Boolean).join(" and ");
    return marks ? { status: "yellow", summary: `distortion marked in ${eyes} eye (${marks} areas)` } : { status: "green", summary: "no distortion" };
  }
  if (test.type === "acuity") {
    const base = all[all.length - 1];
    const summary = `left ${snellen(r.left)}, right ${snellen(r.right)}`;
    if (!base || base.id === test.id) return { status: Math.max(r.left, r.right) > 0.3 ? "yellow" : "green", summary: `${summary} (first test = your baseline)` };
    // If this screen couldn't draw lines as small as the baseline, compare against the screen's limit instead
    const lim = r.limit ?? -Infinity;
    const worse = Math.max(r.left - Math.max(base.result.left, lim), r.right - Math.max(base.result.right, lim));
    const lines = Math.round(worse * 10);
    const status = worse >= 0.39 ? "red" : worse >= 0.19 ? "yellow" : "green";
    return { status, summary: `${summary}; ${lines > 0 ? `${lines} line(s) worse than` : "same as or better than"} your baseline` };
  }
  if (test.type === "pvt") {
    const oldest = all.slice(-3).map((t) => t.result.speed).filter(Boolean);
    const baseSpeed = oldest.length ? avg(oldest) : r.speed;
    const ratio = r.speed / baseSpeed;
    let status = "green";
    if (r.lapses >= 8 || ratio <= 0.8) status = "red";
    else if (r.lapses >= 3 || ratio <= 0.9) status = "yellow";
    const pct = Math.round((1 - ratio) * 100);
    return { status, summary: `mean ${r.meanRt} ms, ${r.lapses} lapses${pct > 0 ? `, ${pct}% slower than your baseline` : ""}` };
  }
  if (test.type === "balance") {
    const status = r.seconds >= 20 ? "green" : r.seconds >= 10 ? "yellow" : "red";
    return { status, summary: `${r.seconds} s on one leg${r.sway != null ? `, sway ${r.sway}` : ""}` };
  }
  return { status: "unknown", summary: "" };
}

// Latest result of each check type from the last 7 days, with its evaluation
export function recentCheckResults(state, pid) {
  const day = state.mission.day;
  return CHECKS.filter((c) => !c.photo)
    .map((c) => {
      const t = latestTest(state, pid, c.id);
      if (!t || day - t.day >= RECENT_DAYS) return null;
      return { check: c, test: t, ...evaluateTest(state, pid, t) };
    })
    .filter(Boolean);
}

// Which checks are due (or not applicable in microgravity)
export function dueChecks(state, pid) {
  const day = state.mission.day;
  const env = envOf(state);
  return CHECKS.map((c) => {
    const last = c.photo ? state.photos[pid].find((p) => p.category === "face") : latestTest(state, pid, c.id);
    const applicable = !(c.gravityOnly && env.microgravity);
    const daysSince = last ? day - last.day : null;
    const due = applicable && (daysSince == null || daysSince >= c.every);
    return { check: c, last, daysSince, applicable, due };
  });
}

// ---------- Habitat ----------

export function habitatToday(state) {
  const h = state.habitat.history;
  return h[h.length - 1];
}

export function co2Status(mmHg) {
  if (mmHg <= CO2_TARGET_MMHG) return "green";
  if (mmHg <= CO2_LIMIT_MMHG) return "yellow";
  return "red";
}

export function ppO2(h) {
  return Math.round(h.pressure * (h.o2 / 100) * 10) / 10;
}

// ---------- Medications ----------

export function medName(id) {
  return MEDKIT.find((m) => m.id === id)?.name || id;
}

export function medsDue(state, pid, day = state.mission.day) {
  const person = personOf(state, pid);
  return (person.medSchedule || []).map((m) => {
    const taken = state.medLog[pid].filter((l) => l.med === m.med);
    const done = m.freq === "daily" ? taken.some((l) => l.day === day) : taken.some((l) => l.day > day - 7 && l.day <= day);
    return { ...m, name: medName(m.med), done };
  });
}

export function lowStock(state) {
  return state.medkit.filter((m) => m.stock <= m.min);
}

// Estimated days of supply left, from the last 14 days of use
export function daysOfSupply(state, medId) {
  const day = state.mission.day;
  const used = Object.values(state.medLog).flat().filter((l) => l.med === medId && l.day > day - 14).length;
  const stock = state.medkit.find((m) => m.id === medId).stock;
  return used ? Math.floor(stock / (used / 14)) : null;
}

// ---------- Body parts and alerts ----------

export function partStatus(state, pid, part) {
  const statuses = indicatorStatuses(state, pid);
  const list = indicators.filter((i) => i.bodyPart === part).map((i) => statuses[i.id]);
  if (symptomsToday(state, pid).some((s) => s.part === part)) list.push("yellow");
  for (const res of recentCheckResults(state, pid)) {
    if (res.check.part === part && res.check.id !== "hr") list.push(res.status);
  }
  const ci = state.checkins[pid][state.mission.day];
  if (part === "vestibular" && ci?.motion >= 6) list.push("yellow");
  return worstStatus(list);
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
  const hab = habitatToday(state);
  const co2 = co2Status(hab.co2);
  if (co2 !== "green") {
    alerts.push({
      id: "co2", level: co2, title: `Cabin CO₂ ${hab.co2} mmHg`,
      action: co2 === "red" ? "Above NASA's 3 mmHg limit. Expect headaches; follow the High CO₂ protocol." : "Above the 2.5 mmHg target. Headache risk is rising; check ventilation.",
      page: "habitat",
    });
  }
  for (const ind of indicators) {
    const s = indicatorStatus(state, pid, ind);
    if (s === "yellow" || s === "red") {
      alerts.push({ id: `ind-${ind.id}`, level: s, title: `${ind.label}: ${row[ind.id]} ${ind.unit}`, action: ind.action[s], part: ind.bodyPart, indicator: ind.id, escalate: s === "red" });
    }
  }
  const last3 = hist.slice(-3);
  if (last3.length === 3 && last3.every((r) => r.sleep < 6)) {
    alerts.push({ id: "trend-sleep", level: "yellow", title: "Under 6 hours of sleep 3 nights in a row", action: "Protect your sleep window tonight and tell the commander if you are fatigued.", part: "brain" });
  }
  if (last3.length === 3 && last3.every((r) => r.exercise < 90)) {
    alerts.push({ id: "trend-exercise", level: "yellow", title: "Below the 90-minute exercise target 3 days running", action: "Bone and muscle loss speeds up without exercise. Log a workout today.", part: "bones", page: "log" });
  }
  for (const res of recentCheckResults(state, pid)) {
    if (res.status === "yellow" || res.status === "red") {
      alerts.push({
        id: `check-${res.check.id}`, level: res.status, title: `${res.check.title}: ${res.summary}`,
        action: res.check.action[res.status], part: res.check.part, page: "checks",
        escalate: res.check.id === "amsler" || res.check.id === "acuity" || res.status === "red",
      });
    }
  }
  for (const s of symptomsToday(state, pid)) {
    alerts.push({ id: `sym-${s.id}`, level: "yellow", title: `Symptom reported: ${s.label}`, action: "Open the Med guide for what to do and when to escalate.", part: s.part, page: "medguide", guide: s.id });
  }
  const ci = state.checkins[pid][day];
  if (ci?.motion >= 6) {
    alerts.push({ id: "motion", level: "yellow", title: `Motion sickness ${ci.motion}/10`, action: "Slow head movements, fix eyes on a stable reference, anti-nausea medication from the med kit.", part: "vestibular" });
  }
  if (!ci) alerts.push({ id: "checkin-due", level: "info", title: "Daily check-in due", action: "Takes about 3 minutes.", page: "checkin" });
  const due = dueChecks(state, pid).filter((d) => d.due);
  if (due.length) alerts.push({ id: "checks-due", level: "info", title: `Checks due: ${due.map((d) => d.check.title).join(", ")}`, action: "Open Checks to do them.", page: "checks" });
  const meds = medsDue(state, pid).filter((m) => !m.done);
  if (meds.length) alerts.push({ id: "meds-due", level: "info", title: `Supplements due: ${meds.map((m) => m.name).join(", ")}`, action: "Mark them taken in Log activity.", page: "log" });
  if (personOf(state, pid).role === "Medical officer" && lowStock(state).length) {
    alerts.push({ id: "low-stock", level: "info", title: `Med kit low: ${lowStock(state).map((m) => m.name).join(", ")}`, action: "No resupply in deep space: plan usage with the flight surgeon.", page: "medkit" });
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
  const checks = recentCheckResults(state, pid);
  const checkPenalty = checks.filter((c) => c.status === "yellow").length * 4 + checks.filter((c) => c.status === "red").length * 10;
  return Math.max(0, Math.min(100, 100 - yellow * 6 - red * 18 - sym * 4 - checkPenalty));
}

// ---------- Gamification ----------

export function streak(state, pid) {
  let n = 0;
  for (let d = state.mission.day; d >= state.mission.startDay; d--) {
    if (state.checkins[pid][d]) n++;
    else if (d !== state.mission.day) break; // today not done yet doesn't break the streak
  }
  return n;
}

function questContext(state, pid, day) {
  const person = personOf(state, pid);
  const dailyMeds = (person.medSchedule || []).filter((m) => m.freq === "daily");
  return {
    row: rowFor(state, pid, day) || {},
    checkedIn: !!state.checkins[pid][day],
    journaledToday: state.journal[pid].some((j) => j.day === day),
    medsDone: dailyMeds.length > 0 && dailyMeds.every((m) => state.medLog[pid].some((l) => l.med === m.med && l.day === day)),
    checkDone: state.tests[pid].some((t) => t.day === day) || state.photos[pid].some((p) => p.day === day && p.category === "face"),
  };
}

export function tasksFor(state, pid, day = state.mission.day) {
  const ctx = questContext(state, pid, day);
  return QUESTS.map((q) => ({ id: q.id, label: q.label, points: q.points, done: q.check(ctx) }));
}

export function points(state, pid) {
  let total = 0;
  for (const row of historyOf(state, pid)) {
    const ctx = questContext(state, pid, row.day);
    for (const q of QUESTS) if (q.check(ctx)) total += q.points;
  }
  return total;
}

export function badgesFor(state, pid) {
  const last7 = historyOf(state, pid).slice(-7);
  const ctx = {
    streak: streak(state, pid),
    exerciseDays: last7.filter((r) => r.exercise >= 90).length,
    waterDays: last7.filter((r) => r.water >= 2).length,
    pvtCount: testsOf(state, pid, "pvt").length,
    visionChecks: testsOf(state, pid, "amsler").length + testsOf(state, pid, "acuity").length,
    journalCount: state.journal[pid].length,
    sheltered: state.shelteredEver[pid],
  };
  return BADGES.map((b) => ({ id: b.id, label: b.label, earned: b.test(ctx) }));
}

// ---------- Radiation ----------

export function doseSummary(state, pid) {
  const row = rowFor(state, pid);
  const env = envOf(state);
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

// ---------- Crew ----------

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
  return (envOf(state).delayMin * 60000) / state.demoSpeed;
}

export { statusRank };
