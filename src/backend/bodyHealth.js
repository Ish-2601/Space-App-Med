import { indicators } from "../lib.js";
import { HEALTH_AREAS } from "../data/healthAreas.js";
import {
  indicatorStatuses,
  recentCheckResults,
  symptomsToday,
} from "./rules.js";

export function latestBodyDiagnostic(
  state,
  pid,
  part,
  day = state.mission.day,
) {
  return (
    state.bodyDiagnostics?.[pid]?.find(
      (r) => r.part === part && r.day === day,
    ) || null
  );
}

// Uses the same prototype penalties as the overall score, scoped to this area.
// Subjective stress and sleep quality are displayed, not treated as diagnoses.
export function bodyHealthScore(state, pid, part) {
  const area = HEALTH_AREAS[part];
  if (!area) return null;
  const statuses = indicatorStatuses(state, pid);
  const readings = indicators
    .filter((i) => i.bodyPart === part)
    .map((i) => statuses[i.id])
    .filter((s) => s !== "unknown");
  const checks = recentCheckResults(state, pid).filter(
    (c) => c.check.part === part,
  );
  const symptoms = symptomsToday(state, pid).filter((s) =>
    area.symptoms.includes(s.id),
  );
  if (!readings.length && !checks.length && !symptoms.length) return null;
  return Math.max(
    0,
    100 -
      readings.filter((s) => s === "yellow").length * 6 -
      readings.filter((s) => s === "red").length * 18 -
      checks.filter((c) => c.status === "yellow").length * 4 -
      checks.filter((c) => c.status === "red").length * 10 -
      symptoms.length * 4,
  );
}
