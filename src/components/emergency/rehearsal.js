import { getState } from "../../backend/store.js";
import { EMERGENCIES } from "../../backend/content.js";
import {
  latestClinicalRecord,
  saveClinicalRecord,
} from "../../backend/clinicalStore.js";
import { sandboxEnabled } from "../../backend/sandbox.js";

export function privateRehearsals(state, pid) {
  if (!sandboxEnabled(state)) return [];
  return EMERGENCIES.map(
    (def) =>
      latestClinicalRecord(state, pid, "emergency-rehearsal-" + def.id, {
        includeDrafts: true,
      })?.payload,
  ).filter(Boolean);
}

export function validateEmergencyVitals(input) {
  const keys = ["heartRate", "systolic", "diastolic", "spo2"];
  const values = Object.fromEntries(
    keys.map((key) => [key, Number(input[key])]),
  );
  if (
    keys.some(
      (key) =>
        input[key] === "" ||
        input[key] == null ||
        !Number.isFinite(values[key]) ||
        values[key] <= 0,
    ) ||
    values.spo2 > 100
  )
    throw new Error(
      "Enter positive readings; oxygen must be at or below 100%.",
    );
  return values;
}

export function savePrivateRehearsal(pid, value) {
  if (!sandboxEnabled())
    throw new Error(
      "Turn on Private Sandbox before saving a private rehearsal.",
    );
  const def = EMERGENCIES.find((item) => item.id === value.type);
  if (!def || value.pid !== pid || !Number.isFinite(value.startedAt))
    throw new Error("Choose a valid emergency rehearsal.");
  if (
    Object.entries(value.stepsDone || {}).some(
      ([index, done]) =>
        !Number.isInteger(Number(index)) ||
        !def.steps[Number(index)] ||
        typeof done !== "boolean",
    )
  )
    throw new Error("Choose an existing protocol step.");
  const payload = { ...value, title: def.title, private: true };
  if (value.vitals) {
    payload.vitals = validateEmergencyVitals(value.vitals);
    payload.values = payload.vitals;
  }
  return saveClinicalRecord(pid, "emergency-rehearsal-" + def.id, payload, {
    draft: true,
  }).payload;
}

export function beginPrivateRehearsal(pid, type) {
  if (!sandboxEnabled())
    throw new Error(
      "Turn on Private Sandbox before starting a private rehearsal.",
    );
  const existing = privateRehearsals(getState(), pid).find(
    (item) => item.type === type && !item.resolvedAt,
  );
  if (existing) return existing;
  return savePrivateRehearsal(pid, {
    id:
      "rehearsal-" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6),
    pid,
    type,
    startedAt: Date.now(),
    stepsDone: {},
    resolvedAt: null,
  });
}
