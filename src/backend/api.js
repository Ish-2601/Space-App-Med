// AstroHealth backend API. The UI only talks to the app through these functions.
// Everything runs on the "onboard computer" (the browser), so it keeps working with no Earth link.
import { getState, update, replaceState, startClock, useStore } from "./store.js";
import { createInitialState, simulateRow, simulateHabitat } from "./seed.js";
import { ENVIRONMENTS, EMERGENCIES, CHECKS } from "./content.js";
import { putPhoto, removePhoto, clearPhotos } from "./photoStore.js";
import { validateProfilePhoto } from "./profilePhoto.js";
import {
  rowFor, personOf, alertsFor, healthScore, indicatorStatuses, activeEvent, earthDelayMs, evaluateTest, habitatToday, envOf,
} from "./rules.js";
import { indicators } from "../lib.js";

export * from "./rules.js";
export * from "./content.js";
export { useStore, getState };

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = (s) => s.mission.day;
const round1 = (n) => Math.round(n * 10) / 10;

// ---------- Check-in ----------

// values: { indicatorId: number }, motion: 0-10, symptoms: [symptomId]
export function submitCheckIn(pid, { values = {}, motion = 0, symptoms = [] }) {
  return update((s) => {
    const row = rowFor(s, pid);
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v != null && !Number.isNaN(Number(v))) row[k] = Number(v);
    }
    s.checkins[pid][today(s)] = { ts: Date.now(), values, motion: Number(motion) || 0, symptoms };
    // Automatic escalation: red readings notify the crew medical officer
    const reds = alertsFor(s, pid).filter((a) => a.level === "red" && a.indicator);
    if (reds.length) pushNotification(s, pid, "red", `${personOf(s, pid).name}: ${reds.map((a) => a.title).join("; ")}`);
    return alertsFor(s, pid);
  });
}

// ---------- Medical checks ----------

// type: "pvt" | "amsler" | "acuity" | "hr" | "balance"
export function saveTest(pid, type, result) {
  return update((s) => {
    const test = { id: newId(), type, day: today(s), ts: Date.now(), result };
    s.tests[pid].unshift(test);
    if (type === "hr" && result.bpm) rowFor(s, pid).heartRate = result.bpm;
    const ev = evaluateTest(s, pid, test);
    const check = CHECKS.find((c) => c.id === type);
    if (ev.status === "red" || (ev.status === "yellow" && (type === "amsler" || type === "acuity"))) {
      pushNotification(s, pid, ev.status, `${personOf(s, pid).name}: ${check.title}: ${ev.summary}`);
    }
    return { test, ...ev };
  });
}

export function setCalibration(pxPerMm) {
  update((s) => (s.settings.pxPerMm = pxPerMm));
}

// ---------- Photos ----------

// Profile portraits are separate from the medical photo log.
export async function saveProfilePhoto(pid, blob) {
  if (!personOf(getState(), pid)) throw new Error("Crew member not found.");
  validateProfilePhoto(blob);
  const id = `profile-${pid}-${newId()}`;
  await putPhoto(id, blob);
  const previous = getState().profilePhotos?.[pid];
  update((s) => {
    s.profilePhotos ||= {};
    s.profilePhotos[pid] = id;
  });
  if (previous) await removePhoto(previous);
  return id;
}

export async function deleteProfilePhoto(pid) {
  const id = getState().profilePhotos?.[pid];
  if (!id) return;
  update((s) => { delete s.profilePhotos[pid]; });
  await removePhoto(id);
}

// meta: { category: "face" | "skin" | "eyes" | "other", part, note, rating }
export async function savePhoto(pid, blob, meta) {
  const id = newId();
  await putPhoto(id, blob);
  update((s) => {
    s.photos[pid].unshift({ id, day: today(s), ts: Date.now(), category: meta.category, part: meta.part || null, note: meta.note || "", rating: meta.rating ?? null });
    if (meta.category === "face" && meta.rating >= 3) pushNotification(s, pid, "yellow", `${personOf(s, pid).name}: face swelling rated severe`);
  });
  return id;
}

export async function deletePhoto(pid, id) {
  await removePhoto(id);
  update((s) => (s.photos[pid] = s.photos[pid].filter((p) => p.id !== id)));
}

// ---------- Activity: workouts, water, supplements ----------

export function logWorkout(pid, type, minutes) {
  const m = Number(minutes);
  if (!m || m <= 0) return;
  update((s) => {
    s.exerciseLog[pid].unshift({ id: newId(), day: today(s), ts: Date.now(), type, minutes: m });
    const row = rowFor(s, pid);
    row.exercise = Math.round(row.exercise + m);
  });
}

export function addWater(pid, liters) {
  update((s) => {
    const row = rowFor(s, pid);
    row.water = round1(row.water + liters);
  });
}

export function takeMed(pid, medId) {
  update((s) => {
    const item = s.medkit.find((m) => m.id === medId);
    if (!item || item.stock <= 0) return;
    item.stock -= 1;
    s.medLog[pid].unshift({ id: newId(), med: medId, day: today(s), ts: Date.now() });
    if (item.stock === item.min) pushNotification(s, pid, "yellow", `Med kit: ${item.name} is down to ${item.stock}`);
  });
}

export function restockMed(medId, qty) {
  update((s) => {
    const item = s.medkit.find((m) => m.id === medId);
    item.stock += Number(qty) || 0;
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
    `${s.mission.name}, day ${s.mission.day}, ${envOf(s).label}`,
    `Health score ${healthScore(s, pid)}/100`,
    "",
    ...indicators.map((i) => `${st[i.id] === "green" ? "  " : "! "}${i.label}: ${row[i.id]} ${i.unit} (${st[i.id]})`),
  ];
  const alerts = alertsFor(s, pid).filter((a) => a.level !== "info");
  if (alerts.length) lines.push("", "Alerts:", ...alerts.map((a) => `- [${a.level}] ${a.title}`));
  return lines.join("\n");
}

// kind: "health" | "message" | "emergency" | "psych"; photoIds: photos to attach
export function sendReport(pid, kind, text = "", photoIds = []) {
  update((s) => queueReport(s, pid, kind, text, photoIds));
}

function queueReport(s, pid, kind, text, photoIds = []) {
  const summary = kind === "health" ? buildHealthSummary(s, pid) : null;
  const hasRed = kind === "health" && alertsFor(s, pid).some((a) => a.level === "red");
  s.reports.unshift({
    id: newId(), pid, kind, text, summary, hasRed, photoIds,
    priority: kind === "emergency" || hasRed,
    createdAt: Date.now(), status: "queued", sentAt: null, deliverAt: null, replyAt: null, reply: null,
  });
}

function replyFor(r) {
  const tag = "(simulated reply)";
  const photos = r.photoIds?.length ? ` We reviewed the ${r.photoIds.length} photo(s) you attached.` : "";
  if (r.kind === "emergency") return `Flight surgeon ${tag}: Emergency report received. Continue the protocol; the CMO leads on site. Send vitals every 15 minutes.`;
  if (r.kind === "psych") return `Ground support ${tag}: A private conference is booked for the next comm window. You're not alone in this.`;
  if (r.kind === "health") {
    return r.hasRed
      ? `Flight surgeon ${tag}: Reviewed your report.${photos} Follow the red-alert actions now, recheck in 2 hours, and keep the CMO updated.`
      : `Flight surgeon ${tag}: Reviewed your report.${photos} Numbers look manageable. Keep up exercise, hydration and sleep.`;
  }
  return `Flight surgeon ${tag}: Message received.${photos} We'll follow up in the next comm window.`;
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

// Event-scoped checklist: retained after the all-clear for the final dose log.
export function toggleShelterStep(eventId, pid, idx) {
  if (!Number.isInteger(idx) || idx < 1 || idx > 4) return;
  update((s) => {
    const ev = s.events.find((e) => e.id === eventId);
    if (!ev || !personOf(s, pid)) return;
    if ((idx === 3 || idx === 4) && ev.active) return;
    if (idx === 2 && !s.crew.every((p) => ev.sheltered[p.id])) return;
    ev.checklists ||= {};
    ev.checklists[pid] ||= {};
    ev.checklists[pid][idx] = !ev.checklists[pid][idx];
  });
}

function finishSolarEvent(s) {
  const ev = activeEvent(s);
  if (!ev) return;
  ev.active = false;
  ev.endedAt = Date.now();
  for (const p of s.crew) {
    const added = ev.sheltered[p.id] ? round1(ev.extraDose * 0.1) : ev.extraDose;
    ev.doses[p.id] = added;
    const row = rowFor(s, p.id);
    row.radiation = round1(row.radiation + added);
  }
}

export function endSolarEvent() {
  update(finishSolarEvent);
}

// ---------- Habitat ----------

// Simulate a CO2 scrubber fault (true) or fix it (false)
export function setCo2Fault(on) {
  update((s) => {
    const h = habitatToday(s);
    if (on) {
      s.habitat.fault = { type: "co2", startedAt: Date.now(), previous: h.co2 };
      h.co2 = 4.4;
      pushNotification(s, null, "red", `Cabin CO₂ ${h.co2} mmHg: above NASA's 3 mmHg limit (whole crew)`);
    } else if (s.habitat.fault) {
      h.co2 = s.habitat.fault.previous;
      s.habitat.fault = null;
    }
  });
}

// ---------- Emergencies ----------

export function startEmergency(pid, type) {
  update((s) => {
    const def = EMERGENCIES.find((e) => e.id === type);
    if (!def || !personOf(s, pid) || s.emergencies.some((e) => e.pid === pid && e.type === type && !e.resolvedAt)) return;
    s.emergencies.unshift({ id: newId(), pid, type, title: def.title, startedAt: Date.now(), stepsDone: {}, resolvedAt: null });
    pushNotification(s, pid, "red", `EMERGENCY: ${def.title} (${personOf(s, pid).name})`);
    queueReport(s, pid, "emergency", `Emergency started: ${def.title}`);
  });
}

// Emergency readings update the patient record without completing a daily check-in.
export function saveEmergencyVitals(id, values) {
  const keys = ["heartRate", "systolic", "diastolic", "spo2"];
  const vitals = Object.fromEntries(keys.map((key) => [key, Number(values[key])]));
  if (keys.some((key) => !Number.isFinite(vitals[key]) || vitals[key] <= 0) || vitals.spo2 > 100) {
    throw new Error("Enter positive numeric readings, with oxygen at or below 100%.");
  }
  update((s) => {
    const em = s.emergencies.find((e) => e.id === id && !e.resolvedAt);
    if (!em) throw new Error("This protocol is no longer active.");
    em.vitals = { ...vitals, ts: Date.now() };
    Object.assign(rowFor(s, em.pid), vitals);
    queueReport(s, em.pid, "emergency", em.title + ": HR " + vitals.heartRate + " bpm, BP " + vitals.systolic + "/" + vitals.diastolic + " mmHg, SpO₂ " + vitals.spo2 + "%.");
    pushNotification(s, em.pid, "info", personOf(s, em.pid).name + ": emergency vitals updated.");
  });
}

export function toggleEmergencyStep(id, idx) {
  update((s) => {
    const em = s.emergencies.find((e) => e.id === id);
    if (!em || em.resolvedAt || !Number.isInteger(idx) || !EMERGENCIES.find((e) => e.id === em.type)?.steps[idx]) return;
    em.stepsDone[idx] = !em.stepsDone[idx];
  });
}

export function resolveEmergency(id, { endedEarly = false } = {}) {
  update((s) => {
    const em = s.emergencies.find((e) => e.id === id);
    if (!em || em.resolvedAt) return;
    em.endedEarly = endedEarly;
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
    s.habitat.history.push(simulateHabitat(next, s.mission.environment));
    s.habitat.fault = null;
    s.mission.day = next;
  });
}

export async function resetAll() {
  await clearPhotos();
  replaceState(createInitialState());
}

export function exportData() {
  return JSON.stringify(getState(), null, 2);
}

// Daily readings for one astronaut as CSV (for the flight surgeon / spreadsheets)
export function exportCsv(pid) {
  const s = getState();
  const cols = ["day", ...indicators.map((i) => i.id)];
  const header = ["day", ...indicators.map((i) => `${i.label} (${i.unit})`)];
  const lines = s.history[pid].map((r) => cols.map((c) => r[c] ?? "").join(","));
  return [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
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
