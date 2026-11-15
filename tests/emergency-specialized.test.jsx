import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/backend/api.js";
import {
  latestClinicalRecord,
  saveClinicalRecord,
} from "../src/backend/clinicalStore.js";
import { loadState } from "../src/backend/storage.js";
import {
  MEDICAL_PACKS,
  SPECIALIZED_EMERGENCIES,
  protocolStepGuide,
  timerRemaining,
  codeElapsed,
  CPR_BPM,
  formatDuration,
} from "../src/backend/emergencySpecialized.js";
import Emergency from "../src/pages/Emergency.jsx";
import CPRMetronome, {
  PackLegend,
  StepTimer,
} from "../src/components/emergency/EmergencyTools.jsx";
import {
  beginPrivateRehearsal,
  savePrivateRehearsal,
  privateRehearsals,
  validateEmergencyVitals,
} from "../src/components/emergency/rehearsal.js";

beforeEach(async () => {
  vi.unstubAllGlobals();
  await api.resetAll();
});
const person = () => api.getState().crew.find((p) => p.id === "okafor");
const snapshot = () => {
  const { privateSandboxRecords, settings, ...publicData } = api.getState();
  return JSON.stringify(publicData);
};

describe("Expanded emergency catalog", () => {
  it("keeps the six original protocols first and adds four complete workflows", () => {
    expect(api.EMERGENCIES.slice(0, 6).map((e) => e.id)).toEqual([
      "dcs",
      "spe",
      "faint",
      "hypoxia",
      "co2",
      "chest",
    ]);
    expect(api.EMERGENCIES).toHaveLength(10);
    for (const protocol of SPECIALIZED_EMERGENCIES) {
      expect(protocol.steps).toHaveLength(6);
      expect(protocol.stepGuides).toHaveLength(protocol.steps.length);
      expect(protocol.stepGuides.some((step) => step.timerSeconds > 0)).toBe(
        true,
      );
      expect(protocol.sources.length).toBeGreaterThan(0);
    }
  });
  it.each(["ocular", "renal", "toxic", "dental"])(
    "%s starts a priority workflow, saves vitals, and resolves",
    (type) => {
      const initialReports = api.getState().reports.length;
      api.startEmergency("okafor", type);
      const emergency = api.activeEmergencies(api.getState(), "okafor")[0];
      expect(emergency.type).toBe(type);
      expect(api.getState().reports.length).toBeGreaterThan(initialReports);
      expect(api.getState().reports[0].priority).toBe(true);
      api.saveEmergencyVitals(emergency.id, {
        heartRate: 80,
        systolic: 120,
        diastolic: 80,
        spo2: 98,
      });
      expect(api.rowFor(api.getState(), "okafor").heartRate).toBe(80);
      api.EMERGENCIES.find((e) => e.id === type).steps.forEach((_, index) =>
        api.toggleEmergencyStep(emergency.id, index),
      );
      expect(Object.values(emergency.stepsDone).every(Boolean)).toBe(true);
      api.resolveEmergency(emergency.id);
      expect(api.activeEmergencies(api.getState(), "okafor")).toHaveLength(0);
    },
  );
  it("assigns a pack and simulated drawer to every step, with honest provenance", () => {
    for (const protocol of api.EMERGENCIES)
      protocol.steps.forEach((_, index) => {
        const guide = protocolStepGuide(protocol, index);
        expect(MEDICAL_PACKS[guide.pack].drawer).toMatch(/drawer/);
        expect(guide.note.length).toBeGreaterThan(20);
      });
    expect(protocolStepGuide(api.EMERGENCIES[0], -1)).toBeNull();
    const html = renderToStaticMarkup(<PackLegend />);
    expect(html).toContain("not an official NASA color assignment");
    expect(html).toContain("Medical Supply Pack");
    expect(html).toContain("simulated location");
  });
  it("renders pack guidance, a working timer and vitals within an active protocol", () => {
    api.startEmergency("okafor", "ocular");
    const html = renderToStaticMarkup(
      <Emergency person={person()} go={() => {}} />,
    );
    expect(html).toContain("Morgan Lens");
    expect(html).toContain("fluorescein");
    expect(html).toContain("Start timer");
    expect(html).toContain("Patient vitals");
    expect(
      html.match(/class="medical-pack-badge /g).length,
    ).toBeGreaterThanOrEqual(6);
  });
});

describe("Private emergency rehearsal", () => {
  it("persists steps and vitals without affecting public health, notifications or reports", () => {
    api.setSandboxMode(true);
    const original = snapshot();
    const em = beginPrivateRehearsal("okafor", "renal");
    expect(beginPrivateRehearsal("okafor", "renal").id).toBe(em.id);
    savePrivateRehearsal("okafor", {
      ...em,
      stepsDone: { 0: true },
      vitals: { heartRate: 88, systolic: 130, diastolic: 80, spo2: 98 },
    });
    expect(snapshot()).toBe(original);
    const restored = privateRehearsals(api.getState(), "okafor")[0];
    expect(restored.stepsDone[0]).toBe(true);
    expect(restored.vitals.heartRate).toBe(88);
    expect(privateRehearsals(api.getState(), "chen")).toHaveLength(0);
    const html = renderToStaticMarkup(
      <Emergency person={person()} go={() => {}} />,
    );
    expect(html).toContain("Private emergency rehearsal");
    expect(html).not.toContain("Medical officer notified.");
    savePrivateRehearsal("okafor", {
      ...restored,
      resolvedAt: Date.now(),
      endedEarly: true,
    });
    expect(
      privateRehearsals(api.getState(), "okafor")[0].resolvedAt,
    ).toBeTruthy();
    api.setSandboxMode(false);
    expect(privateRehearsals(api.getState(), "okafor")).toHaveLength(0);
  });
  it("raises the existing critical threshold prompt without sending anything automatically", () => {
    api.setSandboxMode(true);
    const original = snapshot();
    const em = beginPrivateRehearsal("okafor", "hypoxia");
    savePrivateRehearsal("okafor", {
      ...em,
      vitals: { heartRate: 88, systolic: 130, diastolic: 80, spo2: 84 },
    });
    expect(api.pendingEscalations(api.getState())).toHaveLength(1);
    expect(snapshot()).toBe(original);
  });
  it("rejects invalid steps, profiles, and oxygen values", () => {
    expect(() => beginPrivateRehearsal("okafor", "renal")).toThrow(/Sandbox/);
    api.setSandboxMode(true);
    expect(() => beginPrivateRehearsal("okafor", "invalid")).toThrow();
    const em = beginPrivateRehearsal("okafor", "renal");
    expect(() =>
      savePrivateRehearsal("okafor", { ...em, stepsDone: { 100: true } }),
    ).toThrow(/step/);
    for (const spo2 of ["", -1, 101, NaN])
      expect(() =>
        validateEmergencyVitals({
          heartRate: 70,
          systolic: 120,
          diastolic: 80,
          spo2,
        }),
      ).toThrow();
  });
});

describe("Timers and CPR", () => {
  it("calculates countdown and paused/resumed code elapsed time deterministically", () => {
    expect(CPR_BPM).toBe(110);
    expect(timerRemaining({ running: true, deadline: 61000 }, 1000)).toBe(60);
    expect(timerRemaining({ running: true, deadline: 1000 }, 2000)).toBe(0);
    expect(timerRemaining({ running: false, remainingMs: 12500 }, 100000)).toBe(
      13,
    );
    expect(
      codeElapsed({ running: true, startedAt: 1000, elapsedMs: 60000 }, 32000),
    ).toBe(91);
    expect(codeElapsed({ running: false, elapsedMs: 60000 }, 32000)).toBe(60);
    expect(formatDuration(125)).toBe("02:05");
  });
  it("restores timer state from local persistence, isolated by profile and mode", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    });
    saveClinicalRecord(
      "okafor",
      "step-timer-demo-0",
      { running: false, remainingMs: 60000 },
      { draft: true },
    );
    expect(
      latestClinicalRecord(loadState(), "okafor", "step-timer-demo-0", {
        includeDrafts: true,
      }).payload.remainingMs,
    ).toBe(60000);
    expect(
      latestClinicalRecord(api.getState(), "chen", "step-timer-demo-0", {
        includeDrafts: true,
      }),
    ).toBeNull();
    api.setSandboxMode(true);
    expect(
      latestClinicalRecord(api.getState(), "okafor", "step-timer-demo-0", {
        includeDrafts: true,
      }),
    ).toBeNull();
    saveClinicalRecord(
      "okafor",
      "cpr-code",
      {
        running: false,
        elapsedMs: 120000,
        events: [{ label: "CMO present", seconds: 10 }],
      },
      { draft: true },
    );
    expect(renderToStaticMarkup(<CPRMetronome pid="okafor" />)).toContain(
      "02:00",
    );
    vi.unstubAllGlobals();
  });
  it("renders all three CPR positioning choices and visual fallback without autoplay", () => {
    const html = renderToStaticMarkup(<CPRMetronome pid="okafor" />);
    for (const label of [
      "Zero-G handstand",
      "Reverse bear-hug",
      "CMRS waist-restraint",
      "Enable audible beats",
      "Start 110 BPM",
      "Code elapsed",
      "Sound is off",
    ])
      expect(html).toContain(label);
    expect(
      renderToStaticMarkup(
        <StepTimer
          pid="okafor"
          emergencyId="demo"
          index={0}
          seconds={300}
          label="Reassess"
        />,
      ),
    ).toContain("05:00");
  });
});
