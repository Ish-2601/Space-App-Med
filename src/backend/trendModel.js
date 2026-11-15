import { indicators, greenBand } from "../lib.js";
import { ENVIRONMENTS } from "./content.js";
import { getState, update } from "./store.js";

export const BASELINE_MODES = [
  ["personal", "Personal 14-Day Orbit Baseline"],
  ["adapted", "Spaceflight Adapted Screening Range"],
  ["earth", "Earth Clinical Range"],
];
export const OVERLAYS = {
  none: { label: "No environmental overlay", unit: "" },
  co2: { label: "Cabin CO₂", unit: "mmHg" },
  radiationDose: { label: "Radiation Dose", unit: "mSv/day" },
  pressure: { label: "Cabin Pressure", unit: "kPa" },
  noise: { label: "Acoustic Noise", unit: "dBA" },
};
const VITAL_SOURCE = "https://medlineplus.gov/ency/article/002341.htm";
const EARTH = {
  heartRate: { band: [60, 100], source: VITAL_SOURCE },
  systolic: { band: [90, 120], source: VITAL_SOURCE },
  diastolic: { band: [60, 80], source: VITAL_SOURCE },
  temp: { band: [36.5, 37.3], source: VITAL_SOURCE },
  spo2: {
    band: [95, 100],
    source: "https://medlineplus.gov/lab-tests/pulse-oximetry/",
  },
  glucose: {
    band: [70, 99],
    source: "https://diabetes.org/about-diabetes/diagnosis",
    note: "Fasting glucose comparison only; a CGM snapshot after food is not a fasting exam.",
  },
};
const numeric = (value) => typeof value === "number" && Number.isFinite(value);
export const mean = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function dailyTrendRows(rows) {
  const days = new Map();
  rows
    .filter((r) => numeric(r.day))
    .forEach((row) => {
      if (!days.has(row.day)) days.set(row.day, []);
      days.get(row.day).push(row);
    });
  return [...days.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, readings]) => ({
      day,
      value: mean(readings.map((r) => r.value).filter(numeric)),
      overlay: mean(readings.map((r) => r.overlay).filter(numeric)),
      count: readings.length,
    }));
}
export const gravityOf = (environment) =>
  environment === "moon"
    ? 0.16
    : environment === "mars" || environment === "rover"
      ? 0.38
      : 0;
export function chartPreferences(state, pid, key) {
  return {
    mode: "personal",
    overlay: "none",
    ...state.settings?.chartPreferences?.[pid]?.[key],
  };
}
export function setChartPreferences(pid, key, changes) {
  if (!getState().crew.some((p) => p.id === pid))
    throw new Error("Choose a crew profile.");
  if (changes.mode && !BASELINE_MODES.some(([m]) => m === changes.mode))
    throw new Error("Unknown baseline mode.");
  if (changes.overlay && !OVERLAYS[changes.overlay])
    throw new Error("Unknown environmental overlay.");
  update((s) => {
    s.settings.chartPreferences ||= {};
    s.settings.chartPreferences[pid] ||= {};
    s.settings.chartPreferences[pid][key] = {
      ...chartPreferences(s, pid, key),
      ...changes,
    };
  });
}
export function chartReference(id, rows, mode, environment = "transit") {
  const valid = dailyTrendRows(rows).filter((r) => numeric(r.value));
  const lastDay = valid.at(-1)?.day;
  const prior = valid.filter((r) => r.day < lastDay && r.day >= lastDay - 14);
  const personal = mean(prior.map((r) => r.value));
  if (mode === "personal")
    return {
      line: personal,
      band: null,
      note:
        personal == null
          ? "No prior-day readings yet. A personal baseline needs readings before the latest day."
          : `Average of ${prior.length} recorded days in the 14 days before the latest reading. Today's value is excluded.`,
    };
  if (mode === "earth") {
    const earth = EARTH[id];
    return earth
      ? {
          ...earth,
          line: null,
          note:
            earth.note ||
            "General resting-adult comparison; interpretation depends on the person and measurement conditions.",
        }
      : {
          band: null,
          line: null,
          note: "No single validated Earth clinical range is defined for this measure. Use your personal baseline and care team's interpretation.",
        };
  }
  const ind = indicators.find((i) => i.id === id);
  if (id === "dailyDose")
    return {
      line: ENVIRONMENTS[environment].doseRate,
      band: null,
      note: "Simulated mission dose rate, not a safe-exposure threshold.",
    };
  if (!ind)
    return {
      line: personal,
      band: null,
      note: "No universal adapted range for this check. Your recent personal result is the comparison.",
    };
  return {
    line: personal,
    band: ind.relative && personal == null ? null : greenBand(ind, personal),
    note: "App's prototype screening band for mission review, not a NASA-approved flight clearance range. Changing the chart does not change clinical alerts.",
    source: ind.sources[0],
  };
}

export function environmentRows(state, pid, rows, overlay) {
  const history = [...(state.history[pid] || [])].sort((a, b) => a.day - b.day);
  const habitat = new Map(state.habitat.history.map((r) => [r.day, r]));
  const dose = new Map(
    history.map((r, i) => [
      r.day,
      i &&
      history[i - 1].day === r.day - 1 &&
      numeric(r.radiation) &&
      numeric(history[i - 1].radiation)
        ? Math.max(
            0,
            Math.round((r.radiation - history[i - 1].radiation) * 100) / 100,
          )
        : null,
    ]),
  );
  return rows.map((r) => {
    const cabin = habitat.get(r.day);
    // Existing seeded habitat rows have no microphone channel. The stable demo
    // signal is marked as simulated instead of implying a recorded measurement.
    const noise = cabin
      ? numeric(cabin.noise)
        ? cabin.noise
        : Math.round(
            (67 + Math.sin(r.day * 1.7) * 3 + Math.cos(r.day * 0.4) * 2) * 10,
          ) / 10
      : null;
    const value =
      overlay === "radiationDose"
        ? dose.get(r.day)
        : overlay === "noise"
          ? noise
          : cabin?.[overlay];
    return { ...r, overlay: numeric(value) ? value : null };
  });
}
export function correlationInsight(rows, label, overlay) {
  const pairs = dailyTrendRows(rows).filter(
    (r) => numeric(r.value) && numeric(r.overlay),
  );
  if (pairs.length < 5)
    return `Not enough paired days to compare ${label} with ${OVERLAYS[overlay]?.label || "the environment"}. At least five aligned days are needed.`;
  const a = mean(pairs.map((r) => r.value)),
    b = mean(pairs.map((r) => r.overlay));
  let numerator = 0,
    x = 0,
    y = 0;
  pairs.forEach((r) => {
    const dx = r.value - a,
      dy = r.overlay - b;
    numerator += dx * dy;
    x += dx * dx;
    y += dy * dy;
  });
  if (x < 1e-10 || y < 1e-10)
    return `One series barely changed across ${pairs.length} paired days, so a correlation cannot be estimated.`;
  const r = Math.max(-1, Math.min(1, numerator / Math.sqrt(x * y)));
  const relation =
    Math.abs(r) < 0.3
      ? "show little linear association"
      : r > 0
        ? "tend to rise and fall together"
        : "tend to move in opposite directions";
  return `${label} and ${OVERLAYS[overlay].label} ${relation} across ${pairs.length} aligned days (r = ${r.toFixed(2)}). This is a same-day association in prototype data, not proof of a cause or a diagnosis.`;
}

export const TWIN_DEFAULTS = {
  workout: 60,
  water: 2.5,
  sleep: 8,
  shielding: 80,
};
export function twinSettings(state, pid) {
  return { ...TWIN_DEFAULTS, ...state.settings?.twinScenarios?.[pid] };
}
export function saveTwinSettings(pid, changes) {
  if (!getState().crew.some((p) => p.id === pid))
    throw new Error("Choose a crew profile.");
  const limits = {
    workout: [0, 150],
    water: [0.5, 4],
    sleep: [3, 10],
    shielding: [0, 100],
  };
  Object.entries(changes).forEach(([key, value]) => {
    if (
      !limits[key] ||
      !numeric(value) ||
      value < limits[key][0] ||
      value > limits[key][1]
    )
      throw new Error("Scenario value is outside its range.");
  });
  update((s) => {
    s.settings.twinScenarios ||= {};
    s.settings.twinScenarios[pid] = { ...twinSettings(s, pid), ...changes };
  });
}
export function forecastTwin(settings, environment = "transit") {
  const p = { ...TWIN_DEFAULTS, ...settings },
    g = gravityOf(environment);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const exercise = clamp(p.workout / 90, 0, 1.7),
    hydration = clamp(p.water / 2.5, 0.2, 1.6),
    rest = clamp((p.sleep - 6) / 2, -1.5, 2);
  const exposure =
    ((ENVIRONMENTS[environment]?.doseRate || 1.84) / 1.84) *
    (1 - (p.shielding / 100) * 0.9);
  // Transparent illustrative coefficients, not a fitted physiological model.
  // Every output is a relative index, never a personal diagnosis/probability.
  const endpoint = {
    bmd:
      100 - Math.max(0.05, (1.35 - exercise * 0.8) * (1 - g) + exposure * 0.1),
    vo2: 100 + exercise * 2 - 2.4 * (1 - g) + rest * 0.4,
    renal: clamp(
      35 + (1 - hydration) * 24 + (1 - exercise) * 5 + exposure * 2,
      5,
      80,
    ),
    vigilance: clamp(
      100 +
        rest * 4 -
        Math.max(0, 7 - p.sleep) * 4 -
        exposure * 2 +
        (hydration - 1) * 2,
      60,
      110,
    ),
  };
  return Array.from({ length: 31 }, (_, day) => {
    const t = day / 30,
      curve = (1 - Math.exp(-t * 1.4)) / (1 - Math.exp(-1.4));
    return {
      day,
      ...Object.fromEntries(
        Object.entries(endpoint).map(([key, end]) => {
          const start = key === "renal" ? 35 : 100;
          return [key, Math.round((start + (end - start) * curve) * 100) / 100];
        }),
      ),
    };
  });
}
