import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/backend/api.js";
import { loadState } from "../src/backend/storage.js";
import { HEALTH_AREAS } from "../src/data/healthAreas.js";
import { indicators } from "../src/lib.js";

beforeEach(async () => {
  await api.resetAll();
});
afterEach(() => vi.unstubAllGlobals());
const publicState = () => {
  const { privateSandboxRecords, settings, ...rest } = api.getState();
  return JSON.stringify(rest);
};
const review = (part, values = {}) => ({
  values: {
    ...Object.fromEntries(
      indicators
        .filter((i) => i.bodyPart === part)
        .map((i) => [i.id, api.rowFor(api.getState(), "okafor")[i.id]]),
    ),
    ...values,
  },
  answers: Object.fromEntries(
    HEALTH_AREAS[part].symptoms.map((id) => [id, false]),
  ),
  sleepQuality: "Poor",
  stress: 9,
});

describe("Private Sandbox isolation", () => {
  it("isolates check-ins, focused reviews, symptoms, every test result and mood journals", () => {
    const original = publicState();
    const score = api.healthScore(api.getState(), "okafor");
    api.setSandboxMode(true);
    api.submitCheckIn("okafor", {
      values: { sleep: 2, mood: 1, spo2: 89 },
      symptoms: ["headache"],
    });
    api.saveBodyDiagnostic(
      "okafor",
      "brain",
      review("brain", { sleep: 1, mood: 1 }),
    );
    api.logSymptom("okafor", "rash", "Private trial");
    api.addJournal("okafor", "Private mood entry", 1);
    const amsler = api.saveTest("okafor", "amsler", {
      left: [1, 2],
      right: [],
    });
    expect(amsler).toMatchObject({ status: "yellow", private: true });
    api.saveTest("okafor", "hr", { bpm: 130, mode: "face", label: "good" });
    api.saveTriageQuery("okafor", {
      symptoms: ["headache"],
      vitals: { spo2: 90 },
    });
    expect(publicState()).toBe(original);
    expect(api.healthScore(api.getState(), "okafor")).toBe(score);
    expect(api.privateRecordsFor(api.getState(), "okafor")).toHaveLength(7);
    expect(api.privateRecordsFor(api.getState(), "chen")).toHaveLength(0);
  });
  it("blocks notification, report, activity and protocol side effects while ON", () => {
    const original = publicState();
    api.setSandboxMode(true);
    api.notifyCMO("okafor", "Private message", "red");
    api.sendReport("okafor", "health", "Private report");
    api.startEmergency("okafor", "faint");
    api.logWorkout("okafor", "ARED", 30);
    api.addWater("okafor", 0.25);
    api.logMeal("okafor", { rating: 2 });
    api.takeMed("okafor", "vitd");
    expect(publicState()).toBe(original);
    expect(api.getState().notifications).toHaveLength(0);
    expect(api.getState().reports).toHaveLength(0);
  });
  it("restores ordinary writes after switching OFF without publishing private records", () => {
    api.setSandboxMode(true);
    api.submitCheckIn("okafor", { values: { mood: 1 } });
    api.setSandboxMode(false);
    api.submitCheckIn("okafor", { values: { mood: 8 } });
    expect(api.rowFor(api.getState(), "okafor").mood).toBe(8);
    expect(
      api.privateRecordsFor(api.getState(), "okafor")[0].payload.values.mood,
    ).toBe(1);
  });
  it("persists records and mode across local reload and excludes private records from public exports", () => {
    const memory = new Map();
    vi.stubGlobal("localStorage", {
      setItem: (k, v) => memory.set(k, v),
      getItem: (k) => memory.get(k) || null,
    });
    api.setSandboxMode(true);
    api.addJournal("okafor", "isolated-journal-content", 2);
    expect(loadState().settings.privateSandbox).toBe(true);
    expect(loadState().privateSandboxRecords[0].payload.text).toBe(
      "isolated-journal-content",
    );
    expect(api.exportData()).not.toContain("isolated-journal-content");
    expect(api.buildHealthSummary(api.getState(), "okafor")).not.toContain(
      "isolated-journal-content",
    );
    expect(api.exportCsv("okafor")).not.toContain("isolated-journal-content");
  });
  it("upserts local drafts and safely flushes a private draft after mode changes", () => {
    api.setSandboxMode(true);
    api.saveSandboxRecord(
      "okafor",
      "diagnostic-draft-brain",
      { stress: 4 },
      { draft: true },
    );
    api.setSandboxMode(false);
    api.saveSandboxRecord(
      "okafor",
      "diagnostic-draft-brain",
      { stress: 5 },
      { draft: true },
    );
    expect(api.privateRecordsFor(api.getState(), "okafor")).toHaveLength(1);
    expect(
      api.privateRecordsFor(api.getState(), "okafor")[0].payload.stress,
    ).toBe(5);
    expect(api.pendingEscalations(api.getState())).toHaveLength(0);
  });
});

describe("Critical private findings", () => {
  it("prompts for critical form drafts without repeatedly prompting on unchanged findings", () => {
    api.setSandboxMode(true);
    const draft = api.saveSandboxRecord(
      "okafor",
      "diagnostic-draft-lungs",
      { values: { spo2: 80 } },
      { draft: true },
    );
    expect(api.pendingEscalations(api.getState())).toHaveLength(1);
    api.resolveSandboxEscalation(draft.id, false);
    api.saveSandboxRecord(
      "okafor",
      "diagnostic-draft-lungs",
      { values: { spo2: 80 }, answers: { breath: false } },
      { draft: true },
    );
    expect(api.pendingEscalations(api.getState())).toHaveLength(0);
    expect(api.getState().reports).toHaveLength(0);
  });
  it.each([
    [{ values: { spo2: 84.9 } }, true],
    [{ values: { spo2: 85 } }, false],
    [{ values: { spo2: "" } }, false],
    [{ values: { spo2: null } }, false],
    [{ answers: { chest: true } }, true],
    [{ symptoms: ["chest"] }, true],
    [{ symptom: "headache" }, false],
    [{ acuteRadiation: 500 }, false],
    [{ acuteRadiation: 500.1 }, true],
    [{ values: { radiation: 601 } }, false],
  ])("uses explicit threshold boundaries for %j", (payload, pending) => {
    api.setSandboxMode(true);
    api.saveSandboxRecord("okafor", "diagnostic", payload);
    expect(api.pendingEscalations(api.getState()).length > 0).toBe(pending);
    expect(api.getState().notifications).toHaveLength(0);
    expect(api.getState().reports).toHaveLength(0);
  });
  it("shares only confirmed critical findings once and never changes the public score", () => {
    const score = api.healthScore(api.getState(), "okafor");
    api.setSandboxMode(true);
    const r = api.saveSandboxRecord("okafor", "diagnostic", {
      values: { spo2: 80 },
      unrelatedJournal: "SECRET",
    });
    api.resolveSandboxEscalation(r.id, true);
    api.resolveSandboxEscalation(r.id, true);
    expect(api.getState().notifications).toHaveLength(1);
    expect(api.getState().reports).toHaveLength(1);
    expect(api.getState().reports[0]).toMatchObject({
      priority: true,
      status: "queued",
      kind: "emergency",
    });
    expect(JSON.stringify(api.getState().reports)).not.toContain("SECRET");
    expect(api.healthScore(api.getState(), "okafor")).toBe(score);
    expect(api.pendingEscalations(api.getState())).toHaveLength(0);
  });
  it("keeps a declined escalation private and supports old states without a sandbox store", () => {
    expect(api.privateRecordsFor(api.getState(), "okafor")).toEqual([]);
    api.setSandboxMode(true);
    const r = api.saveSandboxRecord("okafor", "triage", {
      symptoms: ["chest"],
    });
    api.resolveSandboxEscalation(r.id, false);
    expect(api.getState().reports).toHaveLength(0);
    expect(api.getState().notifications).toHaveLength(0);
    expect(r.escalationStatus).toBe("kept-private");
  });
});
