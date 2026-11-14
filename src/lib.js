import data from "./data/indicators.json";
import crewData from "./data/crew.json";

export const indicators = data.indicators;
export const crew = crewData.crew;
export const mission = crewData.mission;

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

// Small seeded random generator so each astronaut's simulated data is stable between reloads
function seededRandom(seedText) {
  let a = [...seedText].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE = { heartRate: 5, systolic: 6, diastolic: 4, spo2: 1.5, glucose: 8, temp: 0.3, sleep: 0.8, mood: 1.5, exercise: 15, water: 0.3 };
const DECIMALS = { temp: 1, sleep: 1, water: 1 };

// Simulated mission history for one astronaut. LABEL AS SIMULATED IN THE UI.
export function simulateHistory(person, days = 30) {
  const r = seededRandom(person.id);
  const rows = [];
  let dose = person.priorDose + mission.day * 0.35 - days * 0.35; // dose before this window
  for (let d = 1; d <= days; d++) {
    const t = d / days;
    const row = { day: mission.day - days + d };
    for (const [id, base] of Object.entries(person.baseline)) {
      const v = base + (person.drift[id] || 0) * t + NOISE[id] * (r() - 0.5);
      const p = 10 ** (DECIMALS[id] || 0);
      row[id] = Math.round(v * p) / p;
    }
    row.spo2 = Math.min(100, row.spo2);
    row.mood = Math.max(1, Math.min(10, row.mood));
    dose += 0.3 + r() * 0.2; // ~0.2-0.5 mSv/day (docs/RESEARCH.md section 5)
    row.radiation = Math.round(dose * 10) / 10;
    rows.push(row);
  }
  return rows;
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

export function personStatus(person) {
  const history = simulateHistory(person);
  const latest = history[history.length - 1];
  return worstStatus(indicators.map((i) => statusOf(i, latest[i.id])));
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
    check: "Vision self-check (not a number yet)",
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
