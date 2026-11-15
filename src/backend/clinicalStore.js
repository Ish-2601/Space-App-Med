import { getState, update } from "./store.js";
import { sandboxEnabled, saveSandboxRecord } from "./sandbox.js";

const copy = (value) => JSON.parse(JSON.stringify(value));
const recordId = () =>
  "clinical-" +
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 9);

// Public and sandbox histories share a shape, but never share a destination.
export function clinicalRecords(
  state,
  pid,
  moduleId,
  { includeDrafts = false } = {},
) {
  const records = sandboxEnabled(state)
    ? (state.privateSandboxRecords || []).filter(
        (r) => r.kind === "clinical:" + moduleId,
      )
    : (state.clinicalRecords || []).filter((r) => r.module === moduleId);
  return records
    .filter((r) => r.pid === pid && (includeDrafts || !r.draft))
    .slice()
    .sort((a, b) => b.ts - a.ts);
}

export function latestClinicalRecord(
  state,
  pid,
  moduleId,
  options = { includeDrafts: true },
) {
  return clinicalRecords(state, pid, moduleId, options)[0] || null;
}

export function saveClinicalRecord(
  pid,
  moduleId,
  values,
  { draft = false } = {},
) {
  const state = getState();
  if (!state.crew.some((p) => p.id === pid))
    throw new Error("Choose a crew member.");
  if (typeof moduleId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(moduleId))
    throw new Error("Choose a valid clinical tool.");
  if (!values || typeof values !== "object" || Array.isArray(values))
    throw new Error("Enter the tool readings first.");
  const serialized = JSON.stringify(values, (key, value) => {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Readings must be finite numbers.");
    return value;
  });
  if (serialized.length > 100000)
    throw new Error("This record is too large. Save photos in Photo tracking.");
  const payload = JSON.parse(serialized);
  if (sandboxEnabled(state))
    return saveSandboxRecord(pid, "clinical:" + moduleId, payload, { draft });
  return update((s) => {
    s.clinicalRecords ||= [];
    const existing =
      draft &&
      s.clinicalRecords.find(
        (r) =>
          r.pid === pid &&
          r.module === moduleId &&
          r.day === s.mission.day &&
          r.draft,
      );
    const newest = Math.max(
      0,
      ...s.clinicalRecords.filter((r) => r.pid === pid).map((r) => r.ts),
    );
    const record = {
      id: existing?.id || recordId(),
      pid,
      module: moduleId,
      day: s.mission.day,
      ts: Math.max(Date.now(), newest + 1),
      payload,
      draft,
      private: false,
    };
    if (existing) Object.assign(existing, record);
    else s.clinicalRecords.unshift(record);
    return copy(record);
  });
}
