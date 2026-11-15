import { useEffect, useRef } from "react";
import {
  sandboxEnabled,
  privateRecordsFor,
  saveSandboxRecord,
} from "../backend/sandbox.js";

export function privateDraft(state, pid, kind) {
  if (!sandboxEnabled(state)) return null;
  return (
    privateRecordsFor(state, pid).find(
      (r) => r.kind === kind && r.draft && r.day === state.mission.day,
    )?.payload || null
  );
}

// Keep only the latest draft for this profile, form and mission day. Flush on
// navigation, including a mode change, into the original private destination.
export default function usePrivateDraft(pid, kind, payload, enabled) {
  const serialized = JSON.stringify(payload);
  const latest = useRef(serialized);
  latest.current = serialized;
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(
      () =>
        saveSandboxRecord(pid, kind, JSON.parse(serialized), { draft: true }),
      450,
    );
    return () => clearTimeout(timer);
  }, [pid, kind, serialized, enabled]);
  useEffect(() => {
    if (!enabled) return;
    return () => {
      saveSandboxRecord(pid, kind, JSON.parse(latest.current), { draft: true });
    };
  }, [pid, kind, enabled]);
}
