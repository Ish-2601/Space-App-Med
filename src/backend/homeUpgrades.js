import { getState, update } from "./store.js";
import { seededRandom } from "./seed.js";
import { ENVIRONMENTS } from "./content.js";
import { sandboxEnabled, saveSandboxRecord } from "./sandbox.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));
const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const rowOf = (state, pid, day = state.mission.day) =>
  state.history[pid]?.find((row) => row.day === day);

export const WEARABLES = [
  {
    id: "astroskin",
    name: "Astroskin Smart Shirt",
    protocol: "BLE",
    channels: "3-lead ECG · respiratory rate",
    fields: ["heartRate", "respiratoryRate"],
  },
  {
    id: "garmin",
    name: "Garmin fēnix / Oura Ring",
    protocol: "BLE / ANT+",
    channels: "HRV · sleep · skin temperature",
    fields: ["hrv", "sleep", "skinTemp"],
  },
  {
    id: "dexcom",
    name: "Dexcom G7 CGM",
    protocol: "BLE",
    channels: "Glucose trend",
    fields: ["glucose"],
  },
  {
    id: "biobutton",
    name: "BioIntelliSense BioButton",
    protocol: "BLE",
    channels: "Resting heart rate",
    fields: ["heartRate"],
  },
  {
    id: "cosinuss",
    name: "Cosinuss One In-Ear Sensor",
    protocol: "BLE",
    channels: "Core temperature",
    fields: ["temp"],
  },
  {
    id: "dosimeter",
    name: "Personal Active Dosimeter + Wearable CO₂ Sensor",
    protocol: "BLE",
    channels: "Radiation rate · local CO₂",
    fields: ["radiation", "doseRate", "localCo2Ppm"],
  },
];

function requirePerson(state, pid) {
  const person = state.crew.find((p) => p.id === pid);
  if (!person) throw new Error("Choose a valid crew member.");
  return person;
}

function saveLocalRecord(pid, key, kind, payload, apply) {
  const state = getState();
  requirePerson(state, pid);
  if (sandboxEnabled(state)) {
    const privateRecord = saveSandboxRecord(pid, kind, payload);
    return {
      ...payload,
      id: privateRecord.id,
      day: state.mission.day,
      ts: privateRecord.ts,
      private: true,
    };
  }
  return update((next) => {
    const record = {
      ...payload,
      id: id(),
      day: next.mission.day,
      ts: Date.now(),
    };
    next[key] ||= {};
    next[key][pid] ||= [];
    next[key][pid].unshift(record);
    next[key][pid] = next[key][pid].slice(0, 180);
    apply?.(next, record);
    return record;
  });
}

export function latestHomeRecord(state, pid, key, kind = key) {
  if (sandboxEnabled(state)) {
    const records = Array.isArray(state.privateSandboxRecords)
      ? state.privateSandboxRecords
      : Object.values(state.privateSandboxRecords || {}).flat();
    const record = records.find(
      (r) => r.pid === pid && r.kind === kind && r.day === state.mission.day,
    );
    return record
      ? { ...record.payload, day: record.day, ts: record.ts, private: true }
      : null;
  }
  return state[key]?.[pid]?.find((r) => r.day === state.mission.day) || null;
}

export function wearableSnapshot(state, pid, at = Date.now()) {
  const person = requirePerson(state, pid);
  const row = rowOf(state, pid) || {};
  const base = person.baseline;
  const env = ENVIRONMENTS[state.mission.environment];
  const cabin =
    state.habitat.history.find((h) => h.day === state.mission.day) || {};
  const random = seededRandom(
    `${pid}:wearable:${state.mission.day}:${Math.floor(at / 15000)}`,
  );
  const noise = Array.from({ length: 5 }, () => random());
  const last = latestHomeRecord(state, pid, "wearables", "wearableSnapshot");
  const sourceValues = last?.sourceValues || {
    heartRate: row.heartRate ?? base.heartRate,
    glucose: row.glucose ?? base.glucose,
  };
  const heartRate = Math.round(sourceValues.heartRate + (noise[0] - 0.5) * 3);
  const values = {
    heartRate,
    respiratoryRate: row.respiratoryRate ?? Math.round(13 + noise[1] * 3),
    hrv: row.hrv ?? Math.round(42 + noise[2] * 12),
    sleep: row.sleep ?? base.sleep,
    skinTemp: row.skinTemp ?? round(33 + noise[3]),
    glucose: Math.round(sourceValues.glucose + (noise[4] - 0.5) * 3),
    temp: round(row.temp ?? base.temp),
    radiation: row.radiation ?? person.priorDose,
    doseRate: round(env.doseRate / 24, 3),
    localCo2Ppm: Math.round(
      ((cabin.co2 || 2.3) /
        ((cabin.pressure || env.atmosphere.pressureKpa) * 7.50062)) *
        1000000,
    ),
  };
  const previous = state.history[pid]?.find(
    (r) => r.day === state.mission.day - 1,
  );
  return {
    values,
    sourceValues,
    sampledAt: at,
    simulated: true,
    glucoseTrend: values.glucose - (previous?.glucose ?? values.glucose),
  };
}

export function syncWearableSnapshot(
  pid,
  snapshot = wearableSnapshot(getState(), pid),
) {
  const allowed = new Set(WEARABLES.flatMap((w) => w.fields));
  const values = Object.fromEntries(
    Object.entries(snapshot.values || {}).filter(
      ([key, value]) =>
        allowed.has(key) &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0,
    ),
  );
  if (!Object.keys(values).length)
    throw new Error("No connected wearable readings are available.");
  return saveLocalRecord(
    pid,
    "wearables",
    "wearableSnapshot",
    {
      values,
      sourceValues: snapshot.sourceValues || {
        heartRate: values.heartRate,
        glucose: values.glucose,
      },
      sampledAt: snapshot.sampledAt || Date.now(),
      simulated: true,
    },
    (state) => {
      Object.assign(rowOf(state, pid), values);
    },
  );
}

export function saveQuickPulse(pid, answers) {
  const state = getState();
  const cleaned = {};
  for (const key of ["mood", "energy", "restfulness"]) {
    if (!(key in answers)) continue;
    const value = answers[key];
    if (!Number.isInteger(value) || value < 1 || value > 5)
      throw new Error("Choose a rating from 1 to 5.");
    cleaned[key] = value;
  }
  if (!Object.keys(cleaned).length)
    throw new Error("Choose at least one quick-pulse rating.");
  const previous = latestHomeRecord(state, pid, "quickPulse");
  const payload = Object.fromEntries(
    ["mood", "energy", "restfulness"]
      .filter((key) => previous?.[key] != null || cleaned[key] != null)
      .map((key) => [key, cleaned[key] ?? previous[key]]),
  );
  return saveLocalRecord(pid, "quickPulse", "quickPulse", payload, (next) => {
    if (cleaned.mood != null) rowOf(next, pid).mood = cleaned.mood * 2;
  });
}

export function saveVoiceBiomarkers(pid, { durationSec = 5 } = {}) {
  if (!Number.isFinite(durationSec) || durationSec < 5)
    throw new Error("Finish the five-second sample first.");
  const state = getState();
  requirePerson(state, pid);
  const pulse = latestHomeRecord(state, pid, "quickPulse");
  const fatigue =
    (5 - (pulse?.energy ?? 3) + (5 - (pulse?.restfulness ?? 3))) / 8;
  const random = seededRandom(
    `${pid}:voice:${state.mission.day}:${state.voiceBiomarkers?.[pid]?.length || 0}`,
  );
  const baseline = {
    cadence: 150,
    pitchVariability: 18,
    label: "Simulated rested baseline",
  };
  const speechCadence = Math.round(
    baseline.cadence * (1 - 0.16 * fatigue) + (random() - 0.5) * 6,
  );
  const pitchVariability = round(
    baseline.pitchVariability * (1 - 0.22 * fatigue) + (random() - 0.5),
  );
  const vocalFatigueDrift = round(
    clamp(
      (1 -
        speechCadence / baseline.cadence +
        (1 - pitchVariability / baseline.pitchVariability)) *
        50,
      0,
      100,
    ),
  );
  return saveLocalRecord(pid, "voiceBiomarkers", "voiceBiomarkers", {
    speechCadence,
    pitchVariability,
    vocalFatigueDrift,
    baseline,
    durationSec: 5,
    simulated: true,
  });
}

export function recordMotorSample(
  pid,
  { latencyMs, correction = false, kind = "typing" },
) {
  if (
    !Number.isFinite(latencyMs) ||
    latencyMs < 40 ||
    latencyMs > 10000 ||
    !["typing", "tap"].includes(kind)
  )
    return null;
  return saveLocalRecord(pid, "motorReadiness", "motorReadiness", {
    latencyMs: Math.round(latencyMs),
    correction: Boolean(correction),
    kind,
  });
}

export function motorReadiness(state, pid) {
  const privateRecords = Array.isArray(state.privateSandboxRecords)
    ? state.privateSandboxRecords
    : Object.values(state.privateSandboxRecords || {}).flat();
  const records = sandboxEnabled(state)
    ? privateRecords
        .filter(
          (r) =>
            r.pid === pid &&
            r.kind === "motorReadiness" &&
            r.day === state.mission.day,
        )
        .map((r) => r.payload)
    : (state.motorReadiness?.[pid] || []).filter(
        (r) => r.day === state.mission.day,
      );
  const samples = records.slice(0, 100);
  if (samples.length < 5)
    return {
      score: null,
      samples: samples.length,
      label: "Learning your pace",
      latencyMs: null,
      correctionRate: null,
    };
  const latencyMs = Math.round(
    samples.reduce((sum, s) => sum + s.latencyMs, 0) / samples.length,
  );
  const correctionRate =
    samples.filter((s) => s.correction).length / samples.length;
  const baselineSamples = samples.slice(-Math.min(10, samples.length));
  const baselineLatency =
    baselineSamples.reduce((sum, s) => sum + s.latencyMs, 0) /
    baselineSamples.length;
  const drift = Math.max(0, latencyMs / baselineLatency - 1);
  const score = Math.round(
    clamp(100 - drift * 40 - correctionRate * 45, 0, 100),
  );
  return {
    score,
    samples: samples.length,
    latencyMs,
    correctionRate: round(correctionRate * 100),
    label:
      score >= 75 ? "Steady interaction pace" : "A slower interaction pace",
  };
}

export function recoveryStatus(state, pid, day = state.mission.day) {
  const row = rowOf(state, pid, day) || {};
  const lowSleep = Number.isFinite(row.sleep) && row.sleep < 6;
  const lowHrv = Number.isFinite(row.hrv) && row.hrv < 30;
  const saved = state.recovery?.[pid]?.[day];
  return {
    active: lowSleep || lowHrv || Boolean(saved),
    completed: Boolean(saved?.completedAt),
    reason:
      [
        lowSleep && "less than 6 hours of sleep",
        lowHrv && "HRV below the 30 ms demo recovery trigger",
      ]
        .filter(Boolean)
        .join(" and ") ||
      saved?.reason ||
      "",
  };
}

export function completeRecovery(pid) {
  const state = getState();
  const recovery = recoveryStatus(state, pid);
  if (!recovery.active)
    throw new Error("No active recovery adjustment is needed today.");
  if (sandboxEnabled(state))
    return saveSandboxRecord(pid, "recovery", {
      reason: recovery.reason,
      completedAt: Date.now(),
    });
  return update((next) => {
    next.recovery ||= {};
    next.recovery[pid] ||= {};
    const record = { completedAt: Date.now(), reason: recovery.reason };
    next.recovery[pid][next.mission.day] = record;
    return record;
  });
}
