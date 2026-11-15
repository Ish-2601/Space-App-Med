import { getState, update } from "./store.js";

const identifier = () =>
  `private-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export const sandboxEnabled = (state = getState()) =>
  !!state.settings?.privateSandbox;
export const privateRecordsFor = (state, pid) =>
  (state.privateSandboxRecords || [])
    .filter((r) => r.pid === pid)
    .sort((a, b) => b.ts - a.ts);
export const pendingEscalations = (state) =>
  (state.privateSandboxRecords || []).filter(
    (r) => r.escalationStatus === "pending",
  );

export function setSandboxMode(on) {
  update((s) => {
    s.settings ||= {};
    s.settings.privateSandbox = !!on;
  });
}

// Only current, explicitly supplied measurements qualify. A lifetime cumulative
// radiation reading is never mistaken for an acute event dose.
export function criticalSandboxReasons(payload = {}) {
  const values = payload.values || payload.vitals || payload.result || payload;
  const oxygen = values.spo2;
  const acuteDose = payload.acuteRadiation ?? values.acuteRadiation;
  const reasons = [];
  if (
    oxygen !== "" &&
    oxygen != null &&
    Number.isFinite(Number(oxygen)) &&
    Number(oxygen) >= 0 &&
    Number(oxygen) < 85
  )
    reasons.push(`SpO₂ ${Number(oxygen)}% is below 85%`);
  if (
    payload.symptom === "chest" ||
    payload.symptoms?.includes("chest") ||
    payload.answers?.chest === true ||
    payload.chestPain === true ||
    payload.type === "chest"
  )
    reasons.push("Chest pain reported");
  if (
    acuteDose !== "" &&
    acuteDose != null &&
    Number.isFinite(Number(acuteDose)) &&
    Number(acuteDose) > 500
  )
    reasons.push(
      `Acute radiation dose ${Number(acuteDose)} mSv exceeds 500 mSv`,
    );
  return reasons;
}

export function saveSandboxRecord(pid, kind, payload, { draft = false } = {}) {
  if (!getState().crew.some((p) => p.id === pid))
    throw new Error("Select a crew profile before saving a private record.");
  return update((s) => {
    s.privateSandboxRecords ||= [];
    const copy = JSON.parse(JSON.stringify(payload));
    const criticalReasons = criticalSandboxReasons(copy);
    const existing =
      draft &&
      s.privateSandboxRecords.find(
        (r) =>
          r.pid === pid &&
          r.kind === kind &&
          r.day === s.mission.day &&
          r.draft,
      );
    const sameFinding =
      existing &&
      JSON.stringify(existing.criticalReasons) ===
        JSON.stringify(criticalReasons);
    const record = {
      id: existing?.id || identifier(),
      pid,
      kind,
      day: s.mission.day,
      ts: Date.now(),
      payload: copy,
      private: true,
      draft,
      criticalReasons,
      escalationStatus: criticalReasons.length
        ? sameFinding
          ? existing.escalationStatus
          : "pending"
        : null,
    };
    if (existing) Object.assign(existing, record);
    else s.privateSandboxRecords.unshift(record);
    if (kind === "motorReadiness") {
      let count = 0;
      s.privateSandboxRecords = s.privateSandboxRecords.filter(
        (r) => r.pid !== pid || r.kind !== kind || ++count <= 180,
      );
    }
    return record;
  });
}

export function resolveSandboxEscalation(id, share) {
  return update((s) => {
    const record = s.privateSandboxRecords?.find((r) => r.id === id);
    if (!record || record.escalationStatus !== "pending") return false;
    record.escalationStatus = share ? "shared" : "kept-private";
    record.resolvedAt = Date.now();
    if (share) {
      const person = s.crew.find((p) => p.id === record.pid);
      const text = `${person.name}: critical sandbox escalation confirmed — ${record.criticalReasons.join("; ")}. Verify readings and review the emergency protocol.`;
      s.notifications.unshift({
        id: identifier(),
        ts: Date.now(),
        pid: record.pid,
        level: "red",
        text,
        read: false,
      });
      s.reports.unshift({
        id: identifier(),
        pid: record.pid,
        kind: "emergency",
        text,
        summary: null,
        hasRed: true,
        photoIds: [],
        priority: true,
        createdAt: Date.now(),
        status: "queued",
        sentAt: null,
        deliverAt: null,
        replyAt: null,
        reply: null,
      });
    }
    return true;
  });
}

export function deletePrivateRecord(pid, id) {
  update((s) => {
    s.privateSandboxRecords = (s.privateSandboxRecords || []).filter(
      (r) => !(r.pid === pid && r.id === id),
    );
  });
}

export function saveTriageQuery(pid, query) {
  if (sandboxEnabled()) return saveSandboxRecord(pid, "triage", query);
  return update((s) => {
    const record = {
      id: identifier(),
      pid,
      day: s.mission.day,
      ts: Date.now(),
      payload: JSON.parse(JSON.stringify(query)),
    };
    s.triageQueries ||= [];
    s.triageQueries.unshift(record);
    return record;
  });
}
