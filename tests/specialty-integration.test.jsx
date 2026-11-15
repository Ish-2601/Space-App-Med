import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/backend/api.js";
import {
  saveClinicalRecord,
  clinicalRecords,
  latestClinicalRecord,
} from "../src/backend/clinicalStore.js";
import {
  setQueueBandwidth,
  setJudgeDelay,
  queueDemoTransmission,
  sortedQueue,
  vitalsDelta,
} from "../src/backend/earthQueue.js";
import {
  DEFAULT_PHARMACY_SCENARIO,
  pharmacyPotency,
} from "../src/backend/pharmacyModel.js";
import EarthPriorityQueue from "../src/components/EarthPriorityQueue.jsx";
import PharmacyStability from "../src/components/PharmacyStability.jsx";

beforeEach(async () => {
  vi.restoreAllMocks();
  await api.resetAll();
});

describe("Specialized clinical persistence", () => {
  it("isolates people, modules and draft histories while restoring the latest draft", () => {
    saveClinicalRecord("chen", "onsd", { mm: 5 });
    saveClinicalRecord("okafor", "onsd", { mm: 5.3 });
    saveClinicalRecord("chen", "onsd", { mm: 5.1 }, { draft: true });
    saveClinicalRecord("chen", "onsd", { mm: 5.2 }, { draft: true });
    expect(clinicalRecords(api.getState(), "chen", "onsd")).toHaveLength(1);
    expect(
      latestClinicalRecord(api.getState(), "chen", "onsd").payload.mm,
    ).toBe(5.2);
    expect(
      clinicalRecords(api.getState(), "chen", "onsd", { includeDrafts: true }),
    ).toHaveLength(2);
    expect(clinicalRecords(api.getState(), "chen", "dust")).toHaveLength(0);
  });
  it("never merges private clinical logs into public records, scores or reports", () => {
    saveClinicalRecord("chen", "cbt", { thought: "Public entry" });
    const score = api.healthScore(api.getState(), "chen");
    api.setSandboxMode(true);
    saveClinicalRecord("chen", "cbt", { thought: "PRIVATE REFLECTION" });
    expect(
      latestClinicalRecord(api.getState(), "chen", "cbt").payload.thought,
    ).toBe("PRIVATE REFLECTION");
    expect(api.getState().clinicalRecords).toHaveLength(1);
    expect(api.getState().reports).toHaveLength(0);
    expect(api.getState().notifications).toHaveLength(0);
    expect(api.healthScore(api.getState(), "chen")).toBe(score);
    expect(api.exportData()).not.toContain("PRIVATE REFLECTION");
    api.setSandboxMode(false);
    expect(
      latestClinicalRecord(api.getState(), "chen", "cbt").payload.thought,
    ).toBe("Public entry");
  });
  it("routes private critical vital entries to the existing explicit escalation prompt", () => {
    api.setSandboxMode(true);
    saveClinicalRecord("chen", "dust", { values: { spo2: 84 } });
    expect(api.pendingEscalations(api.getState())).toHaveLength(1);
    expect(api.getState().reports).toHaveLength(0);
  });
  it("rejects unknown crew, invalid numbers and oversized payloads", () => {
    expect(() => saveClinicalRecord("unknown", "cbt", {})).toThrow();
    expect(() => saveClinicalRecord("chen", "x", { score: NaN })).toThrow();
    expect(() =>
      saveClinicalRecord("chen", "x", { note: "a".repeat(100001) }),
    ).toThrow();
  });
});

describe("Priority Earth delta queue", () => {
  it("preempts an uploading media packet with emergency vital and clinical packets", () => {
    setQueueBandwidth(1);
    const media = queueDemoTransmission("chen", 3);
    const now = Date.now();
    api.tick(api.getState(), now);
    const photo = media.packets.find((p) => p.tier === 3);
    const sentBefore = photo.sentBytes;
    expect(sentBefore).toBeGreaterThan(0);
    const urgent = queueDemoTransmission("chen", 1);
    api.tick(api.getState(), now + 1000);
    expect(urgent.packets[0]).toMatchObject({
      tier: 1,
      bytes: 512,
      state: "in-flight",
    });
    expect(urgent.packets[0].encodedBytes).toBeLessThanOrEqual(512);
    expect(urgent.packets[0].payload.values.temp).toBe(
      api.rowFor(api.getState(), "chen").temp,
    );
    expect(photo.sentBytes - sentBefore).toBeLessThan(512);
    expect(sortedQueue(api.getState())[0].tier).toBe(1);
  });
  it("sends only fields changed from the acknowledged public vital snapshot", () => {
    const report = queueDemoTransmission("chen", 1);
    const state = api.getState(),
      now = Date.now(),
      delay = api.earthDelayMs(state);
    api.tick(state, now);
    api.tick(state, now + delay);
    expect(state.earthSyncSnapshots).toBeUndefined();
    api.tick(state, now + delay * 2);
    expect(state.earthSyncSnapshots.chen.id).toBe(report.packets[0].id);
    expect(vitalsDelta(state, report).payload.values).toEqual({});
    api.rowFor(state, "chen").heartRate = 79;
    expect(vitalsDelta(state, report).payload.values).toEqual({
      heartRate: 79,
    });
  });
  it("holds uploads offline without banking downtime as free bandwidth", () => {
    setQueueBandwidth(1);
    api.setLinkOnline(false);
    const r = queueDemoTransmission("chen", 3),
      now = Date.now();
    api.tick(api.getState(), now);
    api.tick(api.getState(), now + 60000);
    expect(r.packets.every((p) => p.sentBytes === 0)).toBe(true);
    api.setLinkOnline(true);
    api.tick(api.getState(), now + 60000);
    expect(r.packets.reduce((n, p) => n + p.sentBytes, 0)).toBe(1024);
  });
  it("keeps data in flight moving while offline but waits for the return acknowledgement", () => {
    const r = queueDemoTransmission("chen", 1),
      state = api.getState(),
      now = Date.now(),
      delay = api.earthDelayMs(state);
    api.tick(state, now);
    api.setLinkOnline(false);
    api.tick(state, now + delay * 2);
    expect(r.packets[0].state).toBe("delivered");
    expect(state.earthSyncSnapshots).toBeUndefined();
    api.setLinkOnline(true);
    api.tick(state, now + delay * 2 + 1000);
    expect(r.packets[0].state).toBe("acknowledged");
  });
  it("runs a 40-minute roundtrip in 40 seconds after upload without an extra processing delay", () => {
    setJudgeDelay(true);
    const r = queueDemoTransmission("chen", 2),
      state = api.getState(),
      now = Date.now();
    expect(api.earthDelayMs(state)).toBe(20000);
    api.tick(state, now);
    api.tick(state, now + 19999);
    expect(r.status).toBe("sending");
    api.tick(state, now + 20000);
    expect(r.status).toBe("delivered");
    api.tick(state, now + 40000);
    expect(r.status).toBe("replied");
  });
  it("does not queue sandbox demo data or include private clinical content", () => {
    api.setSandboxMode(true);
    saveClinicalRecord("chen", "cbt", { secret: "ONLY PRIVATE" });
    expect(queueDemoTransmission("chen", 1).private).toBe(true);
    expect(api.getState().reports).toHaveLength(0);
    api.setSandboxMode(false);
    api.sendReport("chen", "health");
    expect(JSON.stringify(api.getState().reports)).not.toContain(
      "ONLY PRIVATE",
    );
  });
  it("validates queue controls and renders all three tiers", () => {
    expect(() => setQueueBandwidth(0)).toThrow();
    expect(() => queueDemoTransmission("chen", 9)).toThrow();
    const html = renderToStaticMarkup(<EarthPriorityQueue pid="chen" />);
    expect(html).toContain("Priority 1: 0.5 KB");
    expect(html).toContain("Priority 2: Clinical JSON");
    expect(html).toContain("Priority 3: High-Res Media");
  });
});

describe("Transparent pharmacy scenario model", () => {
  it("does not invent a radiation effect when the assumed coefficient is zero", () => {
    const out = pharmacyPotency(DEFAULT_PHARMACY_SCENARIO);
    expect(out.potency).toBe(out.baseline);
    expect(out.curve[0].potency).toBe(100);
    expect(out.curve.at(-1).potency).toBe(out.potency);
  });
  it("responds monotonically to the explicitly hypothetical radiation and storage assumptions", () => {
    const base = pharmacyPotency(DEFAULT_PHARMACY_SCENARIO);
    const stress = pharmacyPotency({
      ...DEFAULT_PHARMACY_SCENARIO,
      radiationLoss: 10,
    });
    const warmer = pharmacyPotency({
      ...DEFAULT_PHARMACY_SCENARIO,
      temperature: 32,
    });
    expect(stress.potency).toBeLessThan(base.potency);
    expect(warmer.potency).toBeLessThan(base.potency);
    expect(
      pharmacyPotency({
        ...DEFAULT_PHARMACY_SCENARIO,
        days: 0,
        absorbedDoseGy: 0,
      }).potency,
    ).toBe(100);
  });
  it.each([
    { days: -1 },
    { temperature: 99 },
    { initialPotency: NaN },
    { absorbedDoseGy: "" },
    { drug: "unknown" },
  ])("rejects invalid scenarios %j", (patch) => {
    expect(() =>
      pharmacyPotency({ ...DEFAULT_PHARMACY_SCENARIO, ...patch }),
    ).toThrow();
  });
  it("renders all medicines, dosing notes and the evidence limit", () => {
    const html = renderToStaticMarkup(
      <PharmacyStability person={api.getState().crew[0]} />,
    );
    for (const name of [
      "Epinephrine",
      "Promethazine",
      "Amoxicillin",
      "Zolpidem",
      "Microgravity pharmacokinetic dosing notes",
      "Illustrative stress-test only",
    ])
      expect(html).toContain(name);
  });
});
