import { describe, it, expect, beforeEach } from "vitest";
import * as api from "../src/backend/api.js";

const s = () => api.getState();

beforeEach(async () => {
  await api.resetAll();
});

describe("seed data", () => {
  it("creates 4 crew with 30 days of readings", () => {
    expect(s().crew).toHaveLength(4);
    expect(s().history.chen).toHaveLength(30);
    expect(s().mission.day).toBe(120);
  });
  it("tells the intended demo stories", () => {
    expect(api.overallStatus(s(), "rivera")).toBe("green");
    expect(api.alertsFor(s(), "chen").some((a) => a.id === "check-pvt")).toBe(true); // slowing reaction times
    expect(api.alertsFor(s(), "okafor").some((a) => a.id === "check-acuity")).toBe(true); // near vision slipping
    expect(api.alertsFor(s(), "sato").some((a) => a.id === "ind-mass")).toBe(true); // weight loss
  });
});

describe("check-in", () => {
  it("stores values, marks today checked in and notifies the CMO for red readings", () => {
    api.submitCheckIn("okafor", { values: { systolic: 152 }, symptoms: ["headache"], motion: 7 });
    expect(api.rowFor(s(), "okafor").systolic).toBe(152);
    expect(s().checkins.okafor[120]).toBeTruthy();
    const ids = api.alertsFor(s(), "okafor").map((a) => a.id);
    expect(ids).toContain("ind-systolic");
    expect(ids).toContain("sym-headache");
    expect(ids).toContain("motion");
    expect(s().notifications[0].text).toContain("Blood pressure");
    expect(api.partStatus(s(), "okafor", "vestibular")).toBe("yellow");
  });
});

describe("medical checks", () => {
  it("flags Amsler grid distortion and notifies the CMO", () => {
    const r = api.saveTest("rivera", "amsler", { left: [12, 13], right: [] });
    expect(r.status).toBe("yellow");
    expect(api.partStatus(s(), "rivera", "eyes")).toBe("yellow");
    expect(s().notifications[0].text).toContain("Amsler");
  });
  it("compares near vision to the first (baseline) test", () => {
    expect(api.saveTest("rivera", "acuity", { left: 0.1, right: 0.1 }).status).toBe("green");
    expect(api.saveTest("rivera", "acuity", { left: 0.5, right: 0.1 }).status).toBe("red"); // 4 lines worse
  });
  it("doesn't blame the eye when the screen can't draw smaller letters", () => {
    // baseline 0.1, but this screen's smallest line is 0.3 and the user read it with both eyes
    expect(api.saveTest("rivera", "acuity", { left: 0.3, right: 0.3, limit: 0.3 }).status).toBe("green");
  });
  it("detects a slow reaction test against the personal baseline", () => {
    const base = api.testsOf(s(), "rivera", "pvt").slice(-1)[0].result.speed;
    expect(api.saveTest("rivera", "pvt", { trials: 40, meanRt: 400, medianRt: 390, speed: base * 0.7, lapses: 9, falseStarts: 0 }).status).toBe("red");
  });
  it("writes camera heart rate into today's reading", () => {
    api.saveTest("chen", "hr", { bpm: 77, quality: 0.6, label: "good", mode: "face" });
    expect(api.rowFor(s(), "chen").heartRate).toBe(77);
  });
  it("marks the balance test not applicable in microgravity", () => {
    expect(api.dueChecks(s(), "chen").find((d) => d.check.id === "balance").applicable).toBe(false);
    api.setEnvironment("mars");
    expect(api.dueChecks(s(), "chen").find((d) => d.check.id === "balance").applicable).toBe(true);
  });
});

describe("activity and med kit", () => {
  it("logs workouts and water", () => {
    const before = api.rowFor(s(), "rivera").exercise;
    api.logWorkout("rivera", "resistance", 30);
    api.addWater("rivera", 0.5);
    expect(api.rowFor(s(), "rivera").exercise).toBe(before + 30);
    expect(s().exerciseLog.rivera).toHaveLength(1);
  });
  it("takes meds from the shared kit and completes the quest", () => {
    const stock = s().medkit.find((m) => m.id === "vitd").stock;
    api.takeMed("rivera", "vitd");
    expect(s().medkit.find((m) => m.id === "vitd").stock).toBe(stock - 1);
    expect(api.medsDue(s(), "rivera").every((m) => m.done)).toBe(true);
    expect(api.tasksFor(s(), "rivera").find((t) => t.id === "meds").done).toBe(true);
  });
  it("flags low stock to the medical officer", () => {
    const item = s().medkit.find((m) => m.id === "antiviral");
    while (item.stock > item.min) api.takeMed("sato", "antiviral");
    expect(api.lowStock(s()).map((m) => m.id)).toContain("antiviral");
    expect(api.alertsFor(s(), "rivera").some((a) => a.id === "low-stock")).toBe(true);
  });
});

describe("habitat, radiation and Earth link", () => {
  it("raises a CO2 alert for everyone during a scrubber fault", () => {
    api.setCo2Fault(true);
    expect(api.alertsFor(s(), "rivera").find((a) => a.id === "co2").level).toBe("red");
    api.setCo2Fault(false);
    expect(api.alertsFor(s(), "rivera").some((a) => a.id === "co2" && a.level === "red")).toBe(false);
  });
  it("gives sheltered crew a much smaller solar event dose", () => {
    const before = { chen: api.rowFor(s(), "chen").radiation, rivera: api.rowFor(s(), "rivera").radiation };
    api.startSolarEvent(1);
    api.setSheltered("rivera", true);
    api.endSolarEvent();
    const ev = s().events[0];
    expect(api.rowFor(s(), "chen").radiation - before.chen).toBeCloseTo(ev.extraDose, 1);
    expect(api.rowFor(s(), "rivera").radiation - before.rivera).toBeLessThan(ev.extraDose / 5);
  });
  it("delivers reports after the delay and queues them when the link is down", () => {
    api.setLinkOnline(false);
    api.sendReport("chen", "health");
    const t0 = Date.now();
    api.tick(s(), t0);
    expect(s().reports[0].status).toBe("queued");
    api.setLinkOnline(true);
    api.tick(s(), t0);
    expect(s().reports[0].status).toBe("sending");
    const delay = api.earthDelayMs(s());
    api.tick(s(), t0 + delay);
    expect(s().reports[0].status).toBe("delivered");
    api.tick(s(), t0 + delay * 2 + 5000);
    expect(s().reports[0].status).toBe("replied");
    expect(s().reports[0].reply).toContain("simulated");
  });
  it("advances the day for everyone", () => {
    api.advanceDay();
    expect(s().mission.day).toBe(121);
    expect(s().history.sato).toHaveLength(31);
    expect(s().habitat.history.at(-1).day).toBe(121);
  });
  it("exports readings as CSV", () => {
    const csv = api.exportCsv("chen").split("\n");
    expect(csv).toHaveLength(31);
    expect(csv[0]).toContain("Resting heart rate");
  });
});
