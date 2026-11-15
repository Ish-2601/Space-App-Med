// Fast diagnosis (Emergency): symptoms + situation + live data -> ranked possible causes.
import { describe, it, expect, beforeEach } from "vitest";
import * as api from "../src/backend/api.js";

const s = () => api.getState();
beforeEach(async () => {
  await api.resetAll();
});
const run = (pid, symptoms, context = {}, vitals = {}) => api.triage(s(), pid, { symptoms, context, vitals });
const ids = (r) => r.results.map((x) => x.id);

describe("the acted-out scenario: headache + blurry vision", () => {
  it("without a CO₂ fault, points to SANS using the slipping near-vision chart, and says CO₂ is normal", () => {
    const r = run("okafor", ["headache", "vision"]);
    expect(r.results[0].id).toBe("sans");
    expect(r.results[0].strength).toBe("strong");
    expect(r.results[0].why.map((w) => w[1]).join(" ")).toMatch(/Near vision chart/);
    expect(ids(r)).not.toContain("co2"); // normal cabin CO₂ argues against it
  });
  it("during a scrubber fault, finds BOTH the CO₂ emergency and the eye changes", () => {
    api.setCo2Fault(true);
    const r = run("okafor", ["headache", "vision"]);
    expect(ids(r).slice(0, 2).sort()).toEqual(["co2", "sans"]);
    const co2 = r.results.find((x) => x.id === "co2");
    expect(co2.urgencyNow).toBe("emergency");
    expect(co2.protocol).toBe("co2");
    expect(co2.why.map((w) => w[1]).join(" ")).toMatch(/above NASA's 3 mmHg limit/);
    expect(r.emergency).toBe(true);
  });
});

describe("emergencies are found fast and flagged", () => {
  it("chest pain: heart problem first, red flag, chest protocol", () => {
    const r = run("rivera", ["chest", "breath"]);
    expect(r.results[0].id).toBe("cardiac");
    expect(r.results[0].protocol).toBe("chest");
    expect(r.flags).toContain("Chest pain");
  });
  it("joint pain after a spacewalk: decompression sickness, but not without the spacewalk", () => {
    expect(run("rivera", ["jointpain"], { afterEva: true }).results[0]).toMatchObject({ id: "dcs", strength: "strong", urgencyNow: "emergency" });
    const noEva = run("rivera", ["jointpain"]).results.find((x) => x.id === "dcs");
    expect(noEva?.strength ?? "weak").not.toBe("strong");
  });
  it("short of breath with a low SpO₂ typed in now: hypoxia first", () => {
    const r = run("rivera", ["breath"], {}, { spo2: 88 });
    expect(r.results[0].id).toBe("hypoxia");
    expect(r.flags.join(" ")).toMatch(/SpO₂ 88%/);
  });
  it("fainted just after landing: low blood pressure on standing", () => {
    api.setEnvironment("mars");
    expect(run("rivera", ["fainted", "dizzy"], { gravityChange: true }).results[0].id).toBe("orthostatic");
  });
  it("one-sided weakness: possible stroke, treated as an emergency", () => {
    const r = run("rivera", ["weakness"]);
    expect(r.results[0].id).toBe("neuro");
    expect(r.emergency).toBe(true);
  });
  it("head injury with vomiting is a red flag", () => {
    const r = run("rivera", ["nausea", "headache"], { headInjury: true });
    expect(r.results[0].id).toBe("headinjury");
    expect(r.flags.join(" ")).toMatch(/Head injury/);
  });
  it("radiation sickness only ranks during a solar storm", () => {
    expect(ids(run("rivera", ["nausea"]))).not.toContain("radiation");
    api.startSolarEvent(1);
    expect(run("rivera", ["nausea"]).results[0].id).toBe("radiation");
  });
});

describe("everyday problems", () => {
  it("side pain points to a kidney stone", () => expect(run("rivera", ["flankpain"]).results[0].id).toBe("kidneystone"));
  it("fever with 38.4 °C measured now points to infection", () => {
    const r = run("rivera", ["fever"], {}, { temp: 38.4 });
    expect(r.results[0].id).toBe("infection");
    expect(r.results[0].why.map((w) => w[1]).join(" ")).toMatch(/38.4 °C \(measured now\)/);
  });
  it("nothing tapped gives no results", () => expect(run("rivera", []).results).toHaveLength(0));
  it("never asks about mood or stress", () => {
    expect(api.TRIAGE_SYMPTOMS.map((x) => x.id)).not.toContain("lowmood");
    expect(api.TRIAGE_SYMPTOMS.map((x) => x.label).join(" ")).not.toMatch(/mood|stress/i);
  });
  it("every cause gives 'do now' steps, and protocols exist", () => {
    for (const c of api.CONDITIONS) {
      expect(c.doNow.length).toBeGreaterThanOrEqual(3);
      if (c.protocol) expect(api.EMERGENCIES.some((e) => e.id === c.protocol)).toBe(true);
    }
  });
});
