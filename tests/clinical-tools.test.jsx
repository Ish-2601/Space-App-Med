import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  resetAll,
  getState,
  healthScore,
  setSandboxMode,
} from "../src/backend/api.js";
import {
  saveClinicalRecord,
  clinicalRecords,
  latestClinicalRecord,
} from "../src/backend/clinicalStore.js";
import {
  acousticExposure,
  breathingPhase,
  fatigueMap,
  foodTotals,
  landingPlan,
  numberIn,
  onsdChange,
  organDose,
  renalIndex,
  viralIndex,
  dayScopedClinicalItems,
  emptyAcousticDay,
} from "../src/backend/clinicalModels.js";
import { VestibularTools } from "../src/components/clinical/SystemsA.jsx";
import { FoodAnalyzer } from "../src/components/clinical/SystemsB.jsx";
import SpecializedTools, {
  SPECIALIZED_SYSTEMS,
} from "../src/components/clinical/SpecializedTools.jsx";

beforeEach(async () => resetAll());

describe("Specialized clinical calculations", () => {
  it("rejects missing, nonfinite and out-of-domain readings", () => {
    for (const value of ["", null, undefined, NaN, Infinity, -1, 101])
      expect(() => numberIn(value, 0, 100)).toThrow();
    expect(numberIn("0", 0, 100)).toBe(0);
  });
  it("uses an energy-weighted acoustic average, not arithmetic decibels", () => {
    const result = acousticExposure([
      { hours: 12, dba: 50 },
      { hours: 12, dba: 70 },
    ]);
    expect(result.leq).toBe(67);
    expect(result.hours).toBe(24);
    expect(result.fanFlag).toBe(true);
    expect(acousticExposure([{ hours: 24, dba: 60 }]).fanFlag).toBe(false);
    expect(() =>
      acousticExposure([
        { hours: 24, dba: 50 },
        { hours: 1, dba: 60 },
      ]),
    ).toThrow();
    expect(() => acousticExposure([{ hours: 0, dba: 50 }])).toThrow();
  });
  it("does not silently fill unlogged acoustic hours", () => {
    expect(acousticExposure([{ hours: 4, dba: 65 }])).toEqual({
      hours: 4,
      leq: 65,
      fanFlag: true,
    });
  });
  it("caps illustrative viral inputs and responds to improved recovery", () => {
    const high = viralIndex({
      stress: 10,
      sleep: 0,
      cortisolRatio: 500,
      radiation: 100,
    });
    const low = viralIndex({
      stress: 0,
      sleep: 8,
      cortisolRatio: 100,
      radiation: 0,
    });
    expect(high.score).toBe(100);
    expect(low.score).toBe(0);
    expect(() =>
      viralIndex({ stress: 11, sleep: 8, cortisolRatio: 100, radiation: 0 }),
    ).toThrow();
  });
  it("renal model reflects five inputs while remaining bounded", () => {
    expect(
      renalIndex({
        water: 0,
        specificGravity: 1.05,
        color: 8,
        sodium: 10000,
        boneLoss: 8,
      }).score,
    ).toBe(100);
    expect(
      renalIndex({
        water: 3,
        specificGravity: 1,
        color: 1,
        sodium: 1000,
        boneLoss: 0,
      }).score,
    ).toBe(0);
    expect(() =>
      renalIndex({
        water: 3,
        specificGravity: 0.99,
        color: 1,
        sodium: 1000,
        boneLoss: 0,
      }),
    ).toThrow();
  });
  it("calculates entered landing plans without supplying medication doses", () => {
    expect(
      landingPlan({
        mass: 80,
        prescribedMlKg: 10,
        consumedMl: 250,
        sodiumG: 1,
        lbnpMinutes: 20,
      }),
    ).toEqual({ targetMl: 800, remainingMl: 550, sodiumG: 1, lbnpMinutes: 20 });
    expect(
      landingPlan({
        mass: 80,
        prescribedMlKg: 10,
        consumedMl: 1000,
        sodiumG: 1,
        lbnpMinutes: 20,
      }).remainingMl,
    ).toBe(0);
    expect(() =>
      landingPlan({
        mass: 80,
        prescribedMlKg: "",
        consumedMl: 0,
        sodiumG: "",
        lbnpMinutes: "",
      }),
    ).toThrow();
  });
  it("tracks ONSD change from an entered baseline in mm", () => {
    expect(
      onsdChange({ baseline: 4.5, left: 4.8, right: 4.4, shift: 0.5 }),
    ).toEqual({ left: 0.3, right: -0.1, shift: 0.5 });
  });
  it("keeps organ equivalent dose distinct from effective or whole-body dose", () => {
    const result = organDose({
      lens: 2,
      marrow: 3,
      thyroid: 4,
      cns: 5,
      quality: 2,
      shielding: 25,
    });
    expect(result[0]).toEqual({ organ: "Eye lens", before: 4, after: 3 });
    expect(result[3].after).toBe(7.5);
    expect(() =>
      organDose({
        lens: 2,
        marrow: 3,
        thyroid: 4,
        cns: 5,
        quality: 0,
        shielding: 25,
      }),
    ).toThrow();
  });
  it("paces exactly six four-phase breathing cycles in one minute", () => {
    expect(breathingPhase(0).label).toBe("Breathe in gently");
    expect(breathingPhase(2500).label).toBe("Comfortable pause");
    expect(breathingPhase(5000).label).toBe("Breathe out gently");
    expect(breathingPhase(60000).cycle).toBe(6);
    expect(breathingPhase(7500).scale).toBe(0.65);
  });
  it("distributes equipment workload and caps heatmap values", () => {
    expect(fatigueMap({ ared: 0, t2: 0, cevis: 0, exertion: 10 })).toEqual({
      shoulders: 0,
      lumbar: 0,
      quadriceps: 0,
      calves: 0,
    });
    expect(
      fatigueMap({ ared: 180, t2: 180, cevis: 180, exertion: 10 }).quadriceps,
    ).toBe(100);
    expect(
      fatigueMap({ ared: 0, t2: 0, cevis: 60, exertion: 5 }).shoulders,
    ).toBe(0);
  });
  it("adds micronutrients only from confirmed known food codes", () => {
    const total = foodTotals(
      [
        { code: "NM-103", servings: 2 },
        { code: "NM-102", servings: 1 },
      ],
      20,
    );
    expect(total.iron).toBe(25.3);
    expect(total.ironFlag).toBe(true);
    expect(total.omega3).toBe(1.7);
    expect(() =>
      foodTotals([{ code: "unrecognized", servings: 1 }], 20),
    ).toThrow();
    expect(() => foodTotals([{ code: "NM-103", servings: -1 }], 20)).toThrow();
  });
});

describe("Clinical workflows and isolation", () => {
  it("starts food and acoustic ledgers fresh on a new mission day while retaining saved history", () => {
    const day = getState().mission.day;
    const foodPayload = {
      logDay: day,
      meals: [{ code: "NM-103", servings: 2 }],
      ironCeiling: 20,
      summary: "Previous day food log",
    };
    const soundPayload = {
      logDay: day,
      segments: [{ hours: 24, dba: 72 }],
      summary: "Previous day noise log",
    };
    saveClinicalRecord("okafor", "space-food", foodPayload);
    saveClinicalRecord("okafor", "acoustic", soundPayload);
    expect(dayScopedClinicalItems(foodPayload, day, "meals")).toHaveLength(1);
    expect(
      acousticExposure(dayScopedClinicalItems(soundPayload, day, "segments"))
        .hours,
    ).toBe(24);
    getState().mission.day = day + 1;
    expect(dayScopedClinicalItems(foodPayload, day + 1, "meals")).toEqual([]);
    expect(
      dayScopedClinicalItems(
        soundPayload,
        day + 1,
        "segments",
        emptyAcousticDay(),
      ).every((s) => s.hours === 0),
    ).toBe(true);
    const foodHtml = renderToStaticMarkup(<FoodAnalyzer pid="okafor" />);
    const soundHtml = renderToStaticMarkup(<VestibularTools pid="okafor" />);
    expect(foodHtml).not.toContain("Today&#x27;s food entries (1)");
    expect(foodHtml).not.toContain("24 mg");
    expect(soundHtml).not.toContain("72 dBA energy-weighted average");
    expect(soundHtml).toContain("zero logged hours");
    expect(clinicalRecords(getState(), "okafor", "space-food")).toHaveLength(1);
    expect(clinicalRecords(getState(), "okafor", "acoustic")).toHaveLength(1);
  });
  it("renders specialized modules across all ten body systems", () => {
    const state = getState(),
      person = state.crew.find((p) => p.id === "okafor");
    const expected = [
      "CBT",
      "ONSD",
      "acoustic",
      "Chibis",
      "FeNO",
      "viral",
      "micronutrient",
      "RSRI",
      "ARED",
      "Organ-specific",
    ];
    SPECIALIZED_SYSTEMS.forEach((partKey, i) => {
      const html = renderToStaticMarkup(
        <SpecializedTools person={person} partKey={partKey} go={() => {}} />,
      );
      expect(html).toContain(expected[i]);
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("TODO");
    });
  });
  it("restores persisted wizard and timer state per crew member", () => {
    const value = { step: 3, thought: "A difficult task", startedAt: 1000 };
    saveClinicalRecord("okafor", "cbt", value);
    expect(latestClinicalRecord(getState(), "okafor", "cbt").payload).toEqual(
      value,
    );
    expect(latestClinicalRecord(getState(), "chen", "cbt")).toBeNull();
  });
  it("keeps clinical drafts private without affecting public scores or messages", () => {
    const state = getState(),
      score = healthScore(state, "okafor"),
      notices = state.notifications.length,
      reports = state.reports.length;
    setSandboxMode(true);
    saveClinicalRecord(
      "okafor",
      "renal-risk",
      { water: 0.5, summary: "Private scenario" },
      { draft: true },
    );
    expect(clinicalRecords(state, "okafor", "renal-risk")).toHaveLength(0);
    expect(
      latestClinicalRecord(state, "okafor", "renal-risk").payload.water,
    ).toBe(0.5);
    expect(healthScore(state, "okafor")).toBe(score);
    expect(state.notifications).toHaveLength(notices);
    expect(state.reports).toHaveLength(reports);
    setSandboxMode(false);
    expect(latestClinicalRecord(state, "okafor", "renal-risk")).toBeNull();
  });
  it("routes explicit acute radiation findings through the critical sandbox prompt", () => {
    setSandboxMode(true);
    const record = saveClinicalRecord("okafor", "organ-dose", {
      acuteRadiation: 501,
      lens: 1,
    });
    expect(record.escalationStatus).toBe("pending");
    expect(record.criticalReasons.length).toBe(1);
    const noncritical = saveClinicalRecord("okafor", "organ-dose", {
      acuteRadiation: 500,
      lens: 1000,
    });
    expect(noncritical.escalationStatus).toBeNull();
  });
  it("shows saved SANS changes and keeps treatment decisions clinician-led", () => {
    saveClinicalRecord("okafor", "sans-onsd", {
      baseline: 4.5,
      left: 4.8,
      right: 4.4,
      shift: 0.5,
      operator: "CMO",
    });
    const html = renderToStaticMarkup(
      <SpecializedTools
        person={getState().crew.find((p) => p.id === "okafor")}
        partKey="eyes"
        go={() => {}}
      />,
    );
    expect(html).toContain("+0.3");
    expect(html).toContain("Superfocus");
    expect(html).toContain("does not prescribe");
  });
});
