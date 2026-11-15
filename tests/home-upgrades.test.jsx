import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import * as api from "../src/backend/api.js";
import { setSandboxMode } from "../src/backend/sandbox.js";
import {
  WEARABLES,
  wearableSnapshot,
  syncWearableSnapshot,
  saveQuickPulse,
  saveVoiceBiomarkers,
  latestHomeRecord,
  recordMotorSample,
  motorReadiness,
  recoveryStatus,
  completeRecovery,
} from "../src/backend/homeUpgrades.js";
import {
  WearablesBar,
  QuickPulse,
  ReadinessBadge,
  CrewBioDome,
} from "../src/components/HomeUpgrades.jsx";

beforeEach(async () => api.resetAll());
const person = () => api.getState().crew.find((p) => p.id === "okafor");
const publicState = () => {
  const state = api.getState();
  return JSON.stringify({
    history: state.history,
    notifications: state.notifications,
    reports: state.reports,
    checkins: state.checkins,
    recovery: state.recovery,
  });
};

describe("Simulated connected wearables", () => {
  it("has six devices and populates supported readings without inventing cuff or oximeter measurements", () => {
    const state = api.getState();
    const unchanged = JSON.stringify(state.history.chen);
    const snapshot = wearableSnapshot(state, "okafor", 150000);
    expect(WEARABLES).toHaveLength(6);
    expect(snapshot.values).not.toHaveProperty("spo2");
    expect(snapshot.values).not.toHaveProperty("systolic");
    syncWearableSnapshot("okafor", snapshot);
    expect(api.rowFor(state, "okafor")).toMatchObject(snapshot.values);
    expect(JSON.stringify(state.history.chen)).toBe(unchanged);
    expect(state.wearables.okafor[0]).toMatchObject({
      simulated: true,
      values: snapshot.values,
    });
  });
  it("does not add cumulative radiation again on repeated syncs", () => {
    const state = api.getState();
    const snapshot = wearableSnapshot(state, "okafor", 150000);
    const radiation = api.rowFor(state, "okafor").radiation;
    syncWearableSnapshot("okafor", snapshot);
    const refreshed = wearableSnapshot(state, "okafor", 150000);
    expect(refreshed.values).toEqual(snapshot.values);
    syncWearableSnapshot("okafor", refreshed);
    expect(api.rowFor(state, "okafor").radiation).toBe(radiation);
  });
  it("keeps sandbox snapshots away from the public readings", () => {
    setSandboxMode(true);
    const before = publicState();
    const result = syncWearableSnapshot("okafor");
    expect(result.private).toBe(true);
    expect(publicState()).toBe(before);
    expect(api.getState().privateSandboxRecords[0].kind).toBe(
      "wearableSnapshot",
    );
    expect(
      latestHomeRecord(
        api.getState(),
        "okafor",
        "wearables",
        "wearableSnapshot",
      ).private,
    ).toBe(true);
  });
  it("renders all device names with a working sync action and clear simulation label", () => {
    const html = renderToStaticMarkup(<WearablesBar person={person()} />);
    expect(html).toContain("Simulated BLE / ANT+");
    expect(html).toContain("Sync Wearable Snapshot to Today");
    for (const device of WEARABLES)
      expect(html).toContain(device.name.replaceAll("&", "&amp;"));
  });
});

describe("Quick Pulse and simulated voice biomarkers", () => {
  it("saves one-tap answers separately from the full eight-step check-in", () => {
    const checkin = JSON.stringify(api.getState().checkins.okafor);
    saveQuickPulse("okafor", { mood: 4 });
    saveQuickPulse("okafor", { energy: 2 });
    saveQuickPulse("okafor", { restfulness: 3 });
    expect(
      latestHomeRecord(api.getState(), "okafor", "quickPulse"),
    ).toMatchObject({ mood: 4, energy: 2, restfulness: 3 });
    expect(api.rowFor(api.getState(), "okafor").mood).toBe(8);
    expect(JSON.stringify(api.getState().checkins.okafor)).toBe(checkin);
  });
  it("rejects invalid ratings and incomplete voice samples", () => {
    expect(() => saveQuickPulse("okafor", { energy: 0 })).toThrow(/1 to 5/);
    expect(() => saveQuickPulse("okafor", { mood: 6 })).toThrow(/1 to 5/);
    expect(() => saveVoiceBiomarkers("okafor", { durationSec: 4.9 })).toThrow(
      /five-second/,
    );
  });
  it("stores simulated cadence, pitch and drift that respond to recovery ratings", async () => {
    saveQuickPulse("okafor", { energy: 1, restfulness: 1 });
    const tired = saveVoiceBiomarkers("okafor", { durationSec: 5 });
    await api.resetAll();
    saveQuickPulse("okafor", { energy: 5, restfulness: 5 });
    const rested = saveVoiceBiomarkers("okafor", { durationSec: 5 });
    expect(tired.simulated).toBe(true);
    expect(tired.vocalFatigueDrift).toBeGreaterThan(rested.vocalFatigueDrift);
    expect(rested.speechCadence).toBeGreaterThan(tired.speechCadence);
    expect(rested.baseline.label).toContain("Simulated");
  });
  it("isolates private pulse and voice results, including after switching back to public mode", () => {
    saveQuickPulse("okafor", { mood: 5 });
    setSandboxMode(true);
    const before = publicState();
    saveQuickPulse("okafor", { mood: 1, energy: 1, restfulness: 1 });
    saveVoiceBiomarkers("okafor");
    expect(publicState()).toBe(before);
    expect(latestHomeRecord(api.getState(), "okafor", "quickPulse").mood).toBe(
      1,
    );
    expect(latestHomeRecord(api.getState(), "chen", "quickPulse")).toBeNull();
    setSandboxMode(false);
    expect(latestHomeRecord(api.getState(), "okafor", "quickPulse").mood).toBe(
      5,
    );
    expect(
      latestHomeRecord(api.getState(), "okafor", "voiceBiomarkers"),
    ).toBeNull();
  });
  it("renders fifteen accessible quick choices", () => {
    const html = renderToStaticMarkup(<QuickPulse person={person()} />);
    expect(html.match(/role="radio"/g)).toHaveLength(15);
    expect(html).toContain("5-Sec Voice Log");
    expect(html).toContain("microphone off");
  });
});

describe("Passive readiness and cooperative recovery", () => {
  it("requires five genuine metadata samples and does not store text or change the health score", () => {
    const state = api.getState();
    const score = api.healthScore(state, "okafor");
    for (let i = 0; i < 4; i++)
      recordMotorSample("okafor", {
        latencyMs: 300,
        correction: false,
        kind: "typing",
        text: "do not store",
      });
    expect(motorReadiness(state, "okafor").score).toBeNull();
    recordMotorSample("okafor", {
      latencyMs: 300,
      correction: true,
      kind: "typing",
    });
    expect(motorReadiness(state, "okafor").score).toBe(91);
    expect(motorReadiness(state, "okafor").correctionRate).toBe(20);
    expect(state.motorReadiness.okafor[0]).not.toHaveProperty("text");
    expect(api.healthScore(state, "okafor")).toBe(score);
    expect(recordMotorSample("okafor", { latencyMs: 30000 })).toBeNull();
  });
  it("keeps private interaction data in its separate store", () => {
    setSandboxMode(true);
    for (let i = 0; i < 5; i++)
      recordMotorSample("okafor", { latencyMs: 350, kind: "tap" });
    expect(motorReadiness(api.getState(), "okafor").score).toBe(100);
    expect(api.getState().motorReadiness?.okafor).toBeUndefined();
    setSandboxMode(false);
    expect(motorReadiness(api.getState(), "okafor").score).toBeNull();
  });
  it("activates recovery for short sleep or low HRV and records completion without fabricated exercise", () => {
    const state = api.getState();
    const row = api.rowFor(state, "okafor");
    row.sleep = 5.5;
    row.exercise = 10;
    expect(recoveryStatus(state, "okafor").active).toBe(true);
    completeRecovery("okafor");
    expect(recoveryStatus(state, "okafor").completed).toBe(true);
    expect(row.exercise).toBe(10);
    row.sleep = 8;
    row.hrv = 22;
    expect(recoveryStatus(state, "okafor").reason).toContain("HRV");
  });
  it("private recovery cannot modify shared task progress", () => {
    const state = api.getState();
    api.rowFor(state, "okafor").sleep = 5;
    setSandboxMode(true);
    const before = publicState();
    completeRecovery("okafor");
    expect(publicState()).toBe(before);
    expect(recoveryStatus(state, "okafor").completed).toBe(false);
  });
  it("counts recovery in shared tasks, points and streaks without completing the daily check-in", () => {
    const state = api.getState();
    const row = api.rowFor(state, "okafor");
    row.sleep = 5;
    row.exercise = 0;
    const originalPoints = api.points(state, "okafor");
    const originalStreak = api.streak(state, "okafor");
    expect(
      api.tasksFor(state, "okafor").find((task) => task.id === "exercise")
        .label,
    ).toBe("Active Recovery (Streak Preserved)");
    completeRecovery("okafor");
    expect(
      api.tasksFor(state, "okafor").find((task) => task.id === "exercise").done,
    ).toBe(true);
    expect(api.points(state, "okafor")).toBe(originalPoints + 30);
    expect(api.streak(state, "okafor")).toBe(originalStreak + 1);
    expect(state.checkins.okafor[state.mission.day]).toBeUndefined();
  });
  it("renders the readiness badge and two accessible shared crops", () => {
    expect(
      renderToStaticMarkup(<ReadinessBadge person={person()} />),
    ).toContain("Cognitive Motor Readiness");
    const html = renderToStaticMarkup(<CrewBioDome />);
    expect(html).toContain("Inspect dwarf tomatoes");
    expect(html).toContain("Inspect mizuna lettuce");
    expect(html).toContain("Private sandbox tasks stay private");
    for (const crew of api.getState().crew) expect(html).toContain(crew.name);
  });
});
