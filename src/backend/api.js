// AstroHealth backend API. The UI only talks to the app through these functions.
// Everything runs on the "onboard computer" (the browser), so it keeps working with no Earth link.
import { getState, update, replaceState, startClock, useStore } from "./store.js";
import { createInitialState, simulateRow } from "./seed.js";
import { ENVIRONMENTS, EMERGENCIES } from "./content.js";
import {
  rowFor, personOf, alertsFor, healthScore, indicatorStatuses, activeEvent, earthDelayMs,
} from "./rules.js";
import { indicators } from "../lib.js";

export * from "./rules.js";
export * from "./content.js";
export { useStore, getState };

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = (s) => s.mission.day;

// ---------- Check-in ----------

// values: { indicatorId: number }, vision: "normal" | "changed" | null, motion: 0-10, symptoms: [symptomId]
export function submitCheckIn(pid, { values = {}, vision = null, motion = 0, symptoms = [] }) {
  return update((s) => {
    const row = rowFor(s, pid);
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v != null && !Number.isNaN(Number(v))) row[k] = Number(v);
    }
    s.checkins[pid][today(s)] = { ts: Date.now(), values, vision, motion: Number(motion) || 0, symptoms };
    // Automatic escalation: red readings notify the crew medical officer
    const reds = alertsFor(s, pid).filter((a) => a.level === "red" && a.indicator);
    if (reds.length) {
      pushNotification(s, pid, "red", `${personOf(s, pid).name}: ${reds.map((a) => a.title).join("; ")}`);
    }
    return alertsFor(s, pid);
  });
}

// ---------- Symptoms and journal ----------

export function logSymptom(pid, symptom, note = "") {
  update((s) => {
    s.symptomLog[pid].unshift({ id: newId(), day: today(s), ts: Date.now(), symptom, note });
  });
}

export function addJournal(pid, text, mood = null) {
  if (!text.trim()) return;
  update((s) => {
    s.journal[pid].unshift({ id: newId(), day: today(s), ts: Date.now(), text: text.trim(), mood });
  });
}

export function deleteJournal(pid, id) {
  update((s) => {
    s.journal[pid] = s.journal[pid].filter((j) => j.id !== id);
  });
}

// ---------- Notifications to the crew medical officer ----------

function pushNotification(s, pid, level, text) {
  s.notifications.unshift({ id: newId(), ts: Date.now(), pid, level, text, read: false });
}

export function notifyCMO(pid, text, level = "yellow") {
  update((s) => pushNotification(s, pid, level, text));
}

export function markNotificationsRead() {
  update((s) => s.notifications.forEach((n) => (n.read = true)));
}

// ---------- Earth link (reports to the flight surgeon) ----------

export function buildHealthSummary(s, pid) {
  const p = personOf(s, pid);
  const row = rowFor(s, pid);
  const st = indicatorStatuses(s, pid);
  const lines = [
    `AstroHealth report: ${p.name} (${p.role})`,
    `${s.mission.name}, day ${s.mission.day}, ${ENVIRONMENTS[s.mission.environment].label}`,
    `Health score ${healthScore(s, pid)}/100`,
    "",
    ...indicators.map((i) => `${st[i.id] === "green" ? "  " : "! "}${i.label}: ${row[i.id]} ${i.unit} (${st[i.id]})`),
  ];
  const alerts = alertsFor(s, pid).filter((a) => a.level !== "info");
  if (alerts.length) lines.push("", "Alerts:", ...alerts.map((a) => `- [${a.level}] ${a.title}`));
  return lines.join("\n");
}

// kind: "health" | "message" | "emergency" | "psych"
export function sendReport(pid, kind, text = "") {
  update((s) => queueReport(s, pid, kind, text));
}

function queueReport(s, pid, kind, text) {
  const summary = kind === "health" ? buildHealthSummary(s, pid) : null;
  const hasRed = kind === "health" && alertsFor(s, pid).some((a) => a.level === "red");
  s.reports.unshift({
    id: newId(), pid, kind, text, summary, hasRed,
    priority: kind === "emergency" || hasRed,
    createdAt: Date.now(), status: "queued", sentAt: null, deliverAt: null, replyAt: null, reply: null,
  });
}

function replyFor(r) {
  const tag = "(simulated reply)";
  if (r.kind === "emergency") return `Flight surgeon ${tag}: Emergency report received. Continue the protocol; the CMO leads on site. Send vitals every 15 minutes.`;
  if (r.kind === "psych") return `Ground support ${tag}: A private conference is booked for the next comm window. You're not alone in this.`;
  if (r.kind === "health") {
    return r.hasRed
      ? `Flight surgeon ${tag}: Reviewed your report. Follow the red-alert actions now, recheck in 2 hours, and keep the CMO updated.`
      : `Flight surgeon ${tag}: Reviewed your report. Numbers look manageable. Keep up exercise, hydration and sleep.`;
  }
  return `Flight surgeon ${tag}: Message received. We'll follow up in the next comm window.`;
}

export function setLinkOnline(online) {
  update((s) => (s.link.online = online));
}

// ---------- Radiation / solar particle events ----------

export function startSolarEvent(durationSec = 40) {
  update((s) => {
    if (activeEvent(s)) return;
    const now = Date.now();
    s.events.unshift({ id: newId(), active: true, startedAt: now, endsAt: now + durationSec * 1000, sheltered: {}, extraDose: 30 + Math.round(Math.random() * 20), doses: {} });
    s.crew.forEach((p) => pushNotification(s, p.id, "red", `Solar particle event: ${p.name} must go to the storm shelter`));
  });
}

export function setSheltered(pid, sheltered) {
  update((s) => {
    const ev = activeEvent(s);
    if (!ev) return;
    ev.sheltered[pid] = sheltered;
    if (sheltered) s.shelteredEver[pid] = true;
  });
}

function finishSolarEvent(s) {
  const ev = activeEvent(s);
  if (!ev) return;
  ev.active = false;
  ev.endedAt = Date.now();
  for (const p of s.crew) {
    const added = ev.sheltered[p.id] ? Math.round(ev.extraDose * 0.1 * 10) / 10 : ev.extraDose;
    ev.doses[p.id] = added;
    const row = rowFor(s, p.id);
    row.radiation = Math.round((row.radiation + added) * 10) / 10;
  }
}

export function endSolarEvent() {
  update(finishSolarEvent);
}

// ---------- Emergencies ----------

export function startEmergency(pid, type) {
  update((s) => {
    const def = EMERGENCIES.find((e) => e.id === type);
    s.emergencies.unshift({ id: newId(), pid, type, title: def.title, startedAt: Date.now(), stepsDone: {}, resolvedAt: null });
    pushNotification(s, pid, "red", `EMERGENCY: ${def.title} (${personOf(s, pid).name})`);
    queueReport(s, pid, "emergency", `Emergency started: ${def.title}`);
  });
}

export function toggleEmergencyStep(id, idx) {
  update((s) => {
    const em = s.emergencies.find((e) => e.id === id);
    em.stepsDone[idx] = !em.stepsDone[idx];
  });
}

export function resolveEmergency(id) {
  update((s) => {
    const em = s.emergencies.find((e) => e.id === id);
    em.resolvedAt = Date.now();
  });
}

// ---------- Checklists ----------

export function toggleChecklistItem(pid, listId, idx) {
  update((s) => {
    const list = (s.checklists[pid][listId] ||= {});
    list[idx] = !list[idx];
  });
}

export function resetChecklist(pid, listId) {
  update((s) => (s.checklists[pid][listId] = {}));
}

// ---------- Mission controls ----------

export function setEnvironment(env) {
  update((s) => {
    s.mission.environment = env;
    s.mission.name = ENVIRONMENTS[env].label;
  });
}

export function setDemoSpeed(speed) {
  update((s) => (s.demoSpeed = speed));
}

// Move the mission to the next day: every crew member gets a new simulated row
export function advanceDay() {
  update((s) => {
    const next = s.mission.day + 1;
    for (const p of s.crew) {
      const hist = s.history[p.id];
      hist.push(simulateRow(p, next, s.mission.startDay, hist[hist.length - 1].radiation, s.mission.environment));
    }
    s.mission.day = next;
  });
}

export function resetAll() {
  replaceState(createInitialState());
}

export function exportData() {
  return JSON.stringify(getState(), null, 2);
}

// ---------- Clock: Earth-link delivery and event timers ----------

export function tick(s, now) {
  let changed = false;
  const delay = earthDelayMs(s);
  for (const r of s.reports) {
    if (r.status === "queued" && s.link.online) {
      Object.assign(r, { status: "sending", sentAt: now, deliverAt: now + delay });
      changed = true;
    } else if (r.status === "sending" && now >= r.deliverAt) {
      Object.assign(r, { status: "delivered", replyAt: r.deliverAt + 5000 + delay });
      changed = true;
    } else if (r.status === "delivered" && now >= r.replyAt && s.link.online) {
      Object.assign(r, { status: "replied", reply: replyFor(r) });
      changed = true;
    }
  }
  const ev = activeEvent(s);
  if (ev && now >= ev.endsAt) {
    finishSolarEvent(s);
    changed = true;
  }
  return changed;
}

startClock(tick);
