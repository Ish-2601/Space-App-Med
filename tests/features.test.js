// Tests for the hearing, stand, workload, hydration, meal and pattern features.
// Thresholds are checked against the published definitions named in src/backend/assess.js.
import { describe, it, expect, beforeEach } from "vitest";
import * as api from "../src/backend/api.js";
import {
  evaluateHearing, hearingShift, HEARING_FREQS,
  evaluateStand, rawTlx, evaluateTlx, evaluateUrine, mealSummary, compareGroups,
} from "../src/backend/assess.js";

const s = () => api.getState();
beforeEach(async () => {
  await api.resetAll();
});

const ears = (fn) => ({
  left: Object.fromEntries(HEARING_FREQS.map((f) => [f, fn("left", f)])),
  right: Object.fromEntries(HEARING_FREQS.map((f) => [f, fn("right", f)])),
});

describe("hearing check", () => {
  const base = ears(() => -70);
  it("saves the first test as the baseline", () => {
    expect(evaluateHearing(null, base).status).toBe("green");
  });
  it("computes the shift as dB louder needed now (positive = worse)", () => {
    expect(hearingShift(base, ears(() => -60)).left[1000]).toBe(10);
  });
  it("flags a standard threshold shift: average 10 dB+ at 2, 3 and 4 kHz in one ear (OSHA)", () => {
    const now = ears((e, f) => (e === "right" && [2000, 3000, 4000].includes(f) ? -60 : -70));
    expect(evaluateHearing(base, now).status).toBe("yellow");
    const small = ears((e, f) => (e === "right" && f === 4000 ? -60 : -70)); // only one tone, average 3.3 dB
    expect(evaluateHearing(base, small).status).toBe("green");
  });
  it("treats 30 dB+ at 3 consecutive tones as possible sudden hearing loss (AAO-HNS)", () => {
    const now = ears((e, f) => (e === "left" && f >= 2000 && f <= 4000 ? -40 : -70));
    expect(evaluateHearing(base, now).status).toBe("red");
  });
  it("uses the first saved hearing test as the baseline in the app", () => {
    const first = api.testsOf(s(), "rivera", "hearing").at(-1).result;
    const worse = { ...first, right: Object.fromEntries(Object.entries(first.right).map(([f, v]) => [f, v + 15])) };
    expect(api.saveTest("rivera", "hearing", worse).status).toBe("yellow");
  });
});

describe("stand test (orthostatic tolerance)", () => {
  const ok = { restHr: 62, standHr: 75, restSys: 118, standSys: 114, restDia: 76, standDia: 78, symptoms: false, completed: true };
  it("is green when stable", () => expect(evaluateStand(ok).status).toBe("green"));
  it("flags a systolic drop of 20+ mmHg (orthostatic hypotension)", () => {
    expect(evaluateStand({ ...ok, standSys: 98 }).status).toBe("yellow");
    expect(evaluateStand({ ...ok, standSys: 99 }).status).toBe("green"); // 19 mmHg is below the cut-off
  });
  it("flags a diastolic drop of 10+ mmHg", () => expect(evaluateStand({ ...ok, standDia: 66 }).status).toBe("yellow"));
  it("flags a heart-rate rise of 30+ bpm", () => expect(evaluateStand({ ...ok, standHr: 92 }).status).toBe("yellow"));
  it("is red if the person could not finish standing, or had hypotension with symptoms", () => {
    expect(evaluateStand({ ...ok, completed: false }).status).toBe("red");
    expect(evaluateStand({ ...ok, standSys: 95, symptoms: true }).status).toBe("red");
  });
  it("only applies in gravity", () => {
    expect(api.dueChecks(s(), "chen").find((d) => d.check.id === "stand").applicable).toBe(false);
    api.setEnvironment("moon");
    expect(api.dueChecks(s(), "chen").find((d) => d.check.id === "stand").applicable).toBe(true);
  });
});

describe("workload (raw NASA-TLX)", () => {
  const r = { mental: 80, physical: 20, temporal: 60, performance: 30, effort: 70, frustration: 40 };
  it("is the plain average of the six scales", () => expect(rawTlx(r)).toBe(50));
  it("flags 70+ or a 15-point jump above the usual score", () => {
    expect(evaluateTlx({ ...r, mental: 100, physical: 100, temporal: 100 }).status).toBe("yellow"); // 75
    expect(evaluateTlx(r, 30).status).toBe("yellow");
    expect(evaluateTlx(r, 45).status).toBe("green");
  });
  it("shows the commander's rising workload in the demo data", () => {
    expect(api.alertsFor(s(), "chen").some((a) => a.id === "check-tlx")).toBe(true);
  });
});

describe("hydration colour (Armstrong 8-shade chart)", () => {
  it("maps shades 1-3 / 4-6 / 7-8 to green / yellow / red", () => {
    expect([1, 3, 4, 6, 7, 8].map((n) => evaluateUrine(n).status)).toEqual(["green", "green", "yellow", "yellow", "red", "red"]);
  });
});

describe("meal ratings (NASA 9-point hedonic scale)", () => {
  it("averages ratings and counts low-intake meals over 7 days", () => {
    const meals = [
      { day: 120, rating: 5, portion: "half" },
      { day: 119, rating: 6, portion: "little" },
      { day: 118, rating: 7, portion: "half" },
      { day: 110, rating: 9, portion: "all" }, // older than 7 days: ignored
    ];
    const m = mealSummary(meals, 120);
    expect(m).toMatchObject({ count: 3, avgRating: 6, lowIntake: 3, menuFatigue: true, eatingLess: true });
  });
  it("validates the 1-9 scale", () => {
    expect(() => api.logMeal("rivera", { rating: 0 })).toThrow();
    expect(() => api.logMeal("rivera", { rating: 10 })).toThrow();
    api.logMeal("rivera", { meal: "Lunch", rating: 8, portion: "all" });
    expect(s().mealLog.rivera[0]).toMatchObject({ meal: "Lunch", rating: 8, day: 120 });
  });
  it("flags the mission specialist eating less (her demo story is weight loss)", () => {
    expect(api.alertsFor(s(), "sato").some((a) => a.id === "trend-meals")).toBe(true);
    expect(api.alertsFor(s(), "rivera").some((a) => a.id === "trend-meals")).toBe(false);
  });
});

describe("patterns in your own data", () => {
  it("needs at least 3 days in each group", () => {
    const rows = [{ x: true, v: 1 }, { x: true, v: 1 }, { x: false, v: 2 }, { x: false, v: 2 }, { x: false, v: 2 }];
    expect(compareGroups(rows, (r) => r.x, (r) => r.v)).toBeNull();
    expect(compareGroups([...rows, { x: true, v: 1 }], (r) => r.x, (r) => r.v)).toEqual({ a: 1, b: 2, na: 3, nb: 3 });
  });
  it("finds the CO2-headache pattern when headaches cluster on high-CO2 days", () => {
    const st = s();
    for (const h of st.habitat.history) {
      if (h.co2 > api.CO2_TARGET_MMHG) st.checkins.rivera[h.day] = { ts: 1, motion: 0, symptoms: ["headache"] };
    }
    const found = api.insightsFor(st, "rivera").find((i) => i.id === "co2-headache");
    expect(found).toBeTruthy();
    expect(found.title).toMatch(/100% of high-CO₂ days vs 0%/);
  });
  it("every insight states its sample sizes", () => {
    for (const p of s().crew) for (const i of api.insightsFor(s(), p.id)) expect(i.detail).toMatch(/\d/);
  });
});

describe("demo stories still hold", () => {
  it("keeps the medical officer as the healthy control", () => {
    expect(api.overallStatus(s(), "rivera")).toBe("green");
  });
});
