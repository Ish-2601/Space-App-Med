import { describe, it, expect } from "vitest";
import { estimateBpm, regionMean } from "../src/backend/rppg.js";
import { scorePvt, LAPSE_MS } from "../src/backend/pvt.js";
import { optotypeMm, snellen, smallestDrawableLine } from "../src/backend/vision.js";
import { statusOf, personalBaseline, greenBand } from "../src/lib.js";

// Fake camera signal: a pulse at `bpm` plus slow drift and random noise, sampled at ~30 fps with jitter
function fakeSignal(bpm, seconds = 20, noise = 0.3, seed = 1) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [];
  let t = 0;
  while (t < seconds * 1000) {
    const v = 120 + Math.sin((2 * Math.PI * bpm * t) / 60000) + 3 * Math.sin(t / 7000) + noise * (rand() - 0.5) * 2;
    out.push({ t, v });
    t += 33 + (rand() - 0.5) * 6;
  }
  return out;
}

describe("camera heart rate (rPPG)", () => {
  it.each([55, 72, 95, 130])("finds %i bpm in a noisy signal", (bpm) => {
    const r = estimateBpm(fakeSignal(bpm));
    expect(Math.abs(r.bpm - bpm)).toBeLessThanOrEqual(3);
    expect(r.label).not.toBe("poor");
  });

  it.each([3, 7, 11])("reports poor quality for pure random noise (seed %i)", (seed) => {
    let s = seed;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const samples = fakeSignal(72, 20, 0, seed).map((x) => ({ t: x.t, v: 120 + (rand() - 0.5) * 2 }));
    expect(estimateBpm(samples).label).toBe("poor");
  });

  it("refuses to guess when the camera frame rate is too low (aliasing)", () => {
    // same 72 bpm pulse, but the frame only changes twice a second
    const slow = fakeSignal(72).map((x) => ({ t: x.t, v: 120 + Math.sin((2 * Math.PI * 72 * (Math.floor(x.t / 500) * 500)) / 60000) }));
    const r = estimateBpm(slow);
    expect(r.bpm).toBeNull();
    expect(r.reason).toMatch(/frames per second/);
  });

  it("needs at least 5 seconds of data", () => {
    expect(estimateBpm(fakeSignal(72, 3))).toBeNull();
  });

  it("averages a region of an image", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(0);
    for (let i = 0; i < 16; i++) data[i * 4 + 1] = 100; // green = 100 everywhere
    expect(regionMean({ width: 4, height: 4, data }, { x0: 0, y0: 0, x1: 1, y1: 1 }, 1)).toBe(100);
  });
});

describe("reaction self-test scoring", () => {
  it("counts lapses and false starts", () => {
    const r = scorePvt([{ rt: 250 }, { rt: 300 }, { rt: 400 }, { falseStart: true }, { rt: 50 }]);
    expect(r.trials).toBe(3);
    expect(r.lapses).toBe(1); // 400 > 355
    expect(r.falseStarts).toBe(2);
    expect(r.meanRt).toBe(317);
    expect(LAPSE_MS).toBe(355);
  });

  it("handles no valid responses", () => {
    expect(scorePvt([{ falseStart: true }]).trials).toBe(0);
  });
});

describe("near vision chart maths", () => {
  it("draws a 20/20 letter 0.58 mm tall at 40 cm", () => {
    expect(optotypeMm(0)).toBeCloseTo(0.5818, 3);
    expect(optotypeMm(1)).toBeCloseTo(5.818, 2);
  });
  it("converts logMAR to Snellen", () => {
    expect(snellen(0)).toBe("20/20");
    expect(snellen(0.3)).toBe("20/40");
  });
  it("limits the chart to letters at least 5 pixels tall", () => {
    expect(smallestDrawableLine(96 / 25.4)).toBeGreaterThan(0.2);
    expect(smallestDrawableLine(20)).toBeLessThan(smallestDrawableLine(96 / 25.4));
  });
});

describe("indicator status", () => {
  const hr = { id: "heartRate", green: [60, 100], yellow: [50, 110] };
  const mass = { id: "mass", relative: true, green: [-3, 3], yellow: [-6, 6] };
  it("uses absolute ranges", () => {
    expect(statusOf(hr, 72)).toBe("green");
    expect(statusOf(hr, 105)).toBe("yellow");
    expect(statusOf(hr, 130)).toBe("red");
    expect(statusOf(hr, null)).toBe("unknown");
  });
  it("uses % change from the personal baseline for relative indicators", () => {
    expect(statusOf(mass, 70, 70)).toBe("green");
    expect(statusOf(mass, 67, 70)).toBe("yellow"); // -4.3%
    expect(statusOf(mass, 65, 70)).toBe("red"); // -7.1%
    expect(greenBand(mass, 70)).toEqual([67.9, 72.1]);
  });
  it("computes the baseline from the first 7 days", () => {
    const hist = [60, 62, 64, 66, 68, 70, 72, 200].map((v) => ({ mass: v }));
    expect(personalBaseline(mass, hist)).toBe(66);
  });
});
