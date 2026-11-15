import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import * as api from "../src/backend/api.js";
import {
  chartReference,
  environmentRows,
  correlationInsight,
  forecastTwin,
  gravityOf,
  saveTwinSettings,
  twinSettings,
  setChartPreferences,
  chartPreferences,
} from "../src/backend/trendModel.js";
import HealthTrend from "../src/components/HealthTrend.jsx";
import BodyMap from "../src/components/BodyMap.jsx";
import Body from "../src/pages/Body.jsx";

beforeEach(async () => {
  await api.resetAll();
});

describe("Trend comparisons and overlays", () => {
  it("uses only the preceding 14 mission days and excludes the newest value", () => {
    const rows = Array.from({ length: 30 }, (_, day) => ({
      day,
      value: day === 29 ? 900 : day,
    }));
    const reference = chartReference("heartRate", rows, "personal");
    expect(reference.line).toBe(21.5);
    expect(
      chartReference("heartRate", [{ day: 120, value: 70 }], "personal").line,
    ).toBeNull();
    expect(
      chartReference(
        "heartRate",
        [
          { day: 1, value: 50 },
          { day: 120, value: 70 },
        ],
        "personal",
      ).line,
    ).toBeNull();
  });
  it("distinguishes sourced Earth measurements from measures with no universal clinical range", () => {
    expect(chartReference("temp", [], "earth").band).toEqual([36.5, 37.3]);
    expect(chartReference("mood", [], "earth").band).toBeNull();
    expect(chartReference("mass", [], "earth").note).toContain(
      "No single validated",
    );
    expect(chartReference("temp", [], "adapted").note).toContain("prototype");
  });
  it("aligns environmental samples by day, leaves missing days empty and uses daily dose increments", () => {
    const state = api.getState();
    state.habitat.history = [
      { day: 119, co2: 2, pressure: 100 },
      { day: 120, co2: 3, pressure: 101 },
    ];
    state.history.okafor = [
      { day: 118, radiation: 100 },
      { day: 119, radiation: 102 },
      { day: 120, radiation: 105 },
    ];
    const rows = [
      { day: 118, value: 60 },
      { day: 120, value: 70 },
      { day: 119, value: 65 },
    ];
    expect(
      environmentRows(state, "okafor", rows, "co2").map((r) => r.overlay),
    ).toEqual([null, 3, 2]);
    expect(
      environmentRows(state, "okafor", rows, "radiationDose").map(
        (r) => r.overlay,
      ),
    ).toEqual([null, 3, 2]);
    expect(environmentRows(state, "okafor", rows, "noise")).toEqual(
      environmentRows(state, "okafor", rows, "noise"),
    );
  });
  it("requires enough paired days and avoids claiming causation", () => {
    const pairs = Array.from({ length: 8 }, (_, i) => ({
      day: i,
      value: i,
      overlay: i * 2,
    }));
    expect(correlationInsight(pairs, "Pulse", "co2")).toContain("r = 1.00");
    expect(correlationInsight(pairs, "Pulse", "co2")).toContain("not proof");
    expect(correlationInsight(pairs.slice(0, 3), "Pulse", "co2")).toContain(
      "At least five",
    );
    expect(
      correlationInsight(
        pairs.map((p) => ({ ...p, value: 2 })),
        "Pulse",
        "co2",
      ),
    ).toContain("cannot be estimated");
    expect(
      correlationInsight(
        pairs.map((p) => ({ ...p, day: 1 })),
        "Pulse",
        "co2",
      ),
    ).toContain("At least five");
  });
  it("persists preferences per profile and never changes the health record", () => {
    const state = api.getState(),
      original = JSON.stringify(state.history);
    setChartPreferences("okafor", "heartRate", {
      mode: "earth",
      overlay: "co2",
    });
    expect(chartPreferences(state, "okafor", "heartRate")).toMatchObject({
      mode: "earth",
      overlay: "co2",
    });
    expect(chartPreferences(state, "chen", "heartRate").mode).toBe("personal");
    expect(JSON.stringify(state.history)).toBe(original);
    expect(() =>
      setChartPreferences("okafor", "heartRate", { overlay: "fake" }),
    ).toThrow();
  });
  it("renders all baseline options, overlay controls, units and an accessible data table", () => {
    setChartPreferences("okafor", "heartRate", { overlay: "pressure" });
    const html = renderToStaticMarkup(
      <HealthTrend pid="okafor" indicatorId="heartRate" />,
    );
    for (const text of [
      "Personal 14-Day Orbit Baseline",
      "Spaceflight Adapted Screening Range",
      "Earth Clinical Range",
      "Cabin Pressure",
      "kPa",
      "Correlation insight",
      "View chart readings",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("NaN");
  });
});

describe("Layered anatomy and digital twin", () => {
  it("preserves every body system and adds all three layers", () => {
    const state = api.getState();
    const html = renderToStaticMarkup(
      <Body person={state.crew[0]} go={() => {}} />,
    );
    expect(html).toContain("Organ Systems (Default)");
    expect(html).toContain("Microgravity Fluid Shift Map");
    expect(html).toContain("EVA Suit &amp; Musculoskeletal Hotspots");
    expect(html).toContain("Digital Twin 30-Day Forecaster");
  });
  it("reflects mission gravity and preserves clickable EVA regions", () => {
    expect(["iss", "transit", "moon", "mars"].map(gravityOf)).toEqual([
      0, 0, 0.16, 0.38,
    ]);
    api.getState().settings.bodyMapLayer = "fluid";
    expect(
      renderToStaticMarkup(
        <BodyMap
          layers
          environment="moon"
          partStatus={() => "green"}
          onSelect={() => {}}
        />,
      ),
    ).toContain("0.16G");
    api.getState().settings.bodyMapLayer = "eva";
    const eva = renderToStaticMarkup(
      <BodyMap layers partStatus={() => "green"} onSelect={() => {}} />,
    );
    for (const text of [
      "Rotator cuff",
      "Lumbar spine",
      "Fingertip delamination",
      "Top-of-foot restraint calluses",
    ])
      expect(eva).toContain(text);
  });
  it("projects 30 days with all four sliders affecting the intended curves", () => {
    const base = forecastTwin({});
    expect(base).toHaveLength(31);
    expect(base[0]).toMatchObject({
      day: 0,
      bmd: 100,
      vo2: 100,
      renal: 35,
      vigilance: 100,
    });
    expect(forecastTwin({ workout: 120 }).at(-1).bmd).toBeGreaterThan(
      forecastTwin({ workout: 0 }).at(-1).bmd,
    );
    expect(forecastTwin({ workout: 120 }).at(-1).vo2).toBeGreaterThan(
      forecastTwin({ workout: 0 }).at(-1).vo2,
    );
    expect(forecastTwin({ water: 3 }).at(-1).renal).toBeLessThan(
      forecastTwin({ water: 1 }).at(-1).renal,
    );
    expect(forecastTwin({ sleep: 8 }).at(-1).vigilance).toBeGreaterThan(
      forecastTwin({ sleep: 4 }).at(-1).vigilance,
    );
    expect(forecastTwin({ shielding: 100 }).at(-1).vigilance).toBeGreaterThan(
      forecastTwin({ shielding: 0 }).at(-1).vigilance,
    );
    expect(forecastTwin({}, "mars").at(-1).bmd).toBeGreaterThan(
      base.at(-1).bmd,
    );
    expect(base).toEqual(forecastTwin({}));
  });
  it("saves scenario settings separately from readings and rejects invalid values", () => {
    const before = JSON.stringify(api.getState().history);
    saveTwinSettings("okafor", { water: 3, shielding: 100 });
    expect(twinSettings(api.getState(), "okafor")).toMatchObject({
      water: 3,
      shielding: 100,
    });
    expect(twinSettings(api.getState(), "chen").water).toBe(2.5);
    expect(JSON.stringify(api.getState().history)).toBe(before);
    expect(() => saveTwinSettings("okafor", { water: 100 })).toThrow();
  });
});
