// Shared constants and pure helpers (no state).
import data from "./data/indicators.json";

export const indicators = data.indicators;

export const COLORS = { green: "#2ecc71", yellow: "#f1c40f", red: "#e74c3c", unknown: "#7f8c8d" };
export const STATUS_LABEL = { green: "OK", yellow: "Needs attention", red: "Alert crew / flight surgeon", unknown: "No data" };
const RANK = { unknown: 0, green: 1, yellow: 2, red: 3 };

// green if inside green range, yellow if inside yellow range, otherwise red
export function statusOf(ind, value) {
  if (value == null || Number.isNaN(value)) return "unknown";
  if (value >= ind.green[0] && value <= ind.green[1]) return "green";
  if (value >= ind.yellow[0] && value <= ind.yellow[1]) return "yellow";
  return "red";
}

export function worstStatus(statuses) {
  return statuses.reduce((w, s) => (RANK[s] > RANK[w] ? s : w), "unknown");
}

export function statusRank(s) {
  return RANK[s];
}

export function round1(n) {
  return Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
}

// Personal summary of one indicator: latest value, baseline (first 7 days), 7-day change
export function indicatorSummary(ind, history) {
  const latest = history[history.length - 1][ind.id];
  const avg = (rows) => rows.reduce((s, r) => s + r[ind.id], 0) / rows.length;
  const baseline = avg(history.slice(0, 7));
  const recent = avg(history.slice(-7));
  const status = statusOf(ind, latest);
  const change = recent - baseline;
  const pct = baseline ? (change / baseline) * 100 : 0;
  let trend = "steady";
  if (Math.abs(pct) >= 5) trend = change > 0 ? "rising" : "falling";
  return { latest, baseline, status, trend, change, pct };
}

// Body regions for the body map, grouped by NASA HRP risks (docs/RESEARCH.md section 3)
export const bodyParts = {
  brain: {
    name: "Brain, mood and sleep",
    info: "Isolation, confinement and irregular light cycles affect sleep, mood and decision-making. Radiation can also affect the central nervous system.",
    prevention: ["Keep a fixed sleep window and use sleep-mode lighting", "Limit caffeine after midday", "Journal, tend plants, schedule family calls"],
  },
  eyes: {
    name: "Eyes (SANS)",
    info: "Fluid shifting toward the head can swell the optic nerve and flatten the back of the eye. About 70% of ISS astronauts show some swelling.",
    prevention: ["Weekly vision self-check", "Report any blurry or changed vision", "Countermeasures under study: B vitamins, thigh cuffs"],
    check: "the weekly vision self-check in your check-in",
  },
  heart: {
    name: "Heart and circulation",
    info: "Weightlessness changes blood flow and heart shape. Risks include low blood pressure and fainting at landing, arrhythmias and clots.",
    prevention: ["Daily aerobic exercise", "Fluid loading and compression garments before landing"],
  },
  lungs: {
    name: "Lungs and oxygen",
    info: "Lower-pressure habitats raise the risk of mild hypoxia. Spacewalks carry decompression sickness risk.",
    prevention: ["Follow oxygen prebreathe protocols before spacewalks", "End the spacewalk if joint pain or tingling appears"],
  },
  immune: {
    name: "Immune system",
    info: "Spaceflight stress can reactivate dormant viruses (cold sores, shingles) and cause rashes, allergies and infections.",
    prevention: ["Log any rash, cold sore or sore throat", "Hand hygiene and surface cleaning", "Sleep and stress management"],
  },
  gut: {
    name: "Metabolism and nutrition",
    info: "Food must last years and menu fatigue is real. Diet and inactivity affect blood sugar and overall health.",
    prevention: ["Eat full rations even when appetite drops", "Vary meals to fight menu fatigue"],
  },
  kidneys: {
    name: "Kidneys",
    info: "Calcium released from shrinking bones plus dehydration raises kidney stone risk.",
    prevention: ["Drink at least 2 L a day", "Watch for flank pain or dark urine"],
  },
  bones: {
    name: "Bones and muscles",
    info: "Bones lose 1–1.5% of density per month and muscles weaken without gravity. Exercise is the main countermeasure.",
    prevention: ["90 minutes of resistance and aerobic exercise a day", "Calcium and vitamin D in your diet"],
  },
  wholeBody: {
    name: "Radiation (whole body)",
    info: "Invisible and unfelt. It raises cancer risk and can affect the brain, heart and eyes. Tracked by your dosimeter against NASA's 600 mSv career limit.",
    prevention: ["Shelter in the shielded area during solar storm alerts", "Minimize time in low-shielding modules"],
  },
};
