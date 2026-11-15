// Locks the app's NASA figures to the values verified against the sources on 2026-11-14
// (see docs/NASA-VALIDATION.md). If one of these fails, re-check the source before changing it.
import { describe, expect, it } from "vitest";
import { HAZARDS, RISKS } from "../src/backend/nasa.js";
import { ENVIRONMENTS, CHECKS } from "../src/backend/content.js";
import { CAREER_LIMIT_MSV, CO2_LIMIT_MMHG } from "../src/backend/rules.js";
import indicators from "../src/data/indicators.json";

const NASA_RISK_URLS = [
  "risk-of-altered-immune-system-responses", "risk-of-altered-sensorimotor-and-vestibular-function",
  "risk-of-cardiovascular-adaptations", "risk-of-decompression-sickness", "risk-of-host-microorganism-interactions",
  "risk-of-hypoxia", "risk-of-inadequate-food-and-nutrition",
  "risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva",
  "risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness", "risk-of-spaceflight-associated-neuro-ocular-syndrome-sans",
  "risk-of-spaceflight-induced-bone-changes", "risk-of-behavioral-conditions-and-psychiatric-disorders",
  "risk-of-inadequate-teamwork", "risk-from-inadequate-sleep-and-irregular-schedules",
  "risk-of-inadequate-systems-operations-support", "risk-of-injury-from-dynamic-loads", "risk-of-radiation-induced-cancers",
].map((s) => `https://www.nasa.gov/reference/${s}/`);

describe("NASA HRP hazards and risks", () => {
  it("has exactly NASA's 5 hazards", () => {
    expect(HAZARDS.map((h) => h.id).sort()).toEqual(["distance", "gravity", "hostile", "isolation", "radiation"]);
  });
  it("has exactly the 17 risks listed on nasa.gov/hrp/risks, with NASA's URLs", () => {
    expect(RISKS).toHaveLength(17);
    expect(RISKS.map((r) => r.url).sort()).toEqual([...NASA_RISK_URLS].sort());
  });
  it("quotes NASA's figures from the risk pages", () => {
    const by = (id) => RISKS.find((r) => r.id === id).summary + " " + RISKS.find((r) => r.id === id).countermeasures.join(" ");
    expect(by("fitness")).toMatch(/10–12%/);
    expect(by("fitness")).toMatch(/12–38%.*over 20%/);
    expect(by("fitness")).toMatch(/1\.5 h of exercise a day, 6–7 days a week/);
    expect(by("bone")).toMatch(/1–1\.5% density per month/);
    expect(by("sans")).toMatch(/About 70%/);
    expect(by("sleep")).toMatch(/16 sunrises/);
  });
  it("uses NASA's distance facts", () => {
    const d = HAZARDS.find((h) => h.id === "distance");
    expect(d.summary).toMatch(/140 million miles/);
    expect(d.facts.join(" ")).toMatch(/Up to 20 minutes/);
    expect(d.facts.join(" ")).toMatch(/3-year/);
  });
});

describe("NASA limits and dose rates", () => {
  it("uses NASA-STD-3001 limits", () => {
    expect(CAREER_LIMIT_MSV).toBe(600);
    expect(CO2_LIMIT_MMHG).toBe(3);
  });
  it("uses the published dose rates (mSv/day)", () => {
    expect(ENVIRONMENTS.transit.doseRate).toBe(1.84); // Curiosity RAD cruise
    expect(ENVIRONMENTS.mars.doseRate).toBe(0.64); // Curiosity RAD surface
    expect(ENVIRONMENTS.moon.doseRate).toBe(1.37); // Chang'e-4 LND
  });
  it("never shows an Earth delay longer than NASA's 'up to 20 minutes'", () => {
    for (const env of Object.values(ENVIRONMENTS)) expect(env.delayMin).toBeLessThanOrEqual(20);
  });
  it("radiation indicator bands are 50% and 80% of the 600 mSv limit", () => {
    const rad = indicators.indicators.find((i) => i.id === "radiation");
    expect(rad.green[1]).toBe(CAREER_LIMIT_MSV * 0.5);
    expect(rad.yellow[1]).toBe(CAREER_LIMIT_MSV * 0.8);
  });
  it("exercise goal matches NASA's 1.5 hours a day", () => {
    expect(indicators.indicators.find((i) => i.id === "exercise").green[0]).toBe(90);
  });
  it("Reaction Self-Test is NASA's 3-minute version, without claiming a NASA schedule", () => {
    const pvt = CHECKS.find((c) => c.id === "pvt");
    expect(pvt.why).toMatch(/3-minute/);
    expect(pvt.why).toMatch(/since 2009/);
    expect(pvt.why).not.toMatch(/ISS crews took it every/);
  });
});
