import data from "./data/indicators.json";

export const indicators = data.indicators;

// green if inside green range, yellow if inside yellow range, otherwise red
export function statusOf(ind, value) {
  if (value == null || Number.isNaN(value)) return "unknown";
  if (value >= ind.green[0] && value <= ind.green[1]) return "green";
  if (value >= ind.yellow[0] && value <= ind.yellow[1]) return "yellow";
  return "red";
}

// Simulated mission history. LABEL THIS AS SIMULATED IN THE UI/DEMO.
// Slow drift over the mission makes the demo show yellow/red states.
export function simulateHistory(days = 30) {
  const rows = [];
  let dose = 120; // mSv already accumulated before this window (earlier missions)
  for (let d = 1; d <= days; d++) {
    const drift = d / days;
    const r = Math.random;
    dose += 0.35 + r() * 0.15; // ~0.2-0.5 mSv/day, NASA ISS range (docs/RESEARCH.md §5)
    rows.push({
      day: d,
      heartRate: Math.round(66 + drift * 14 + r() * 6),
      systolic: Math.round(112 + drift * 14 + r() * 6),
      diastolic: Math.round(72 + drift * 8 + r() * 4),
      spo2: Math.round(98 - drift * 2 - r() * 2),
      glucose: Math.round(88 + drift * 18 + r() * 8),
      temp: +(36.6 + r() * 0.5).toFixed(1),
      sleep: +(7.6 - drift * 1.8 + r() * 0.8).toFixed(1),
      mood: Math.round(8 - drift * 3 + r() * 1.5),
      exercise: Math.round(95 - drift * 40 + r() * 15),
      water: +(2.4 - drift * 0.7 + r() * 0.3).toFixed(1),
      radiation: +dose.toFixed(1),
    });
  }
  return rows;
}

// Body regions for the body map, grouped by NASA HRP risks (docs/RESEARCH.md §3)
export const bodyParts = {
  brain: { name: "Brain, mood & sleep", info: "Isolation, confinement and irregular light cycles affect sleep, mood and decision-making. Radiation can also affect the central nervous system." },
  eyes: { name: "Eyes (SANS)", info: "Fluid shifting toward the head can swell the optic nerve and flatten the back of the eye. About 70% of ISS astronauts show some swelling. Report any blurry or changed vision." },
  heart: { name: "Heart & circulation", info: "Weightlessness changes blood flow and heart shape and can cause low blood pressure and fainting at landing, arrhythmias or clots." },
  lungs: { name: "Lungs & oxygen", info: "Lower-pressure habitats raise the risk of mild hypoxia. Spacewalks carry decompression sickness risk." },
  immune: { name: "Immune system", info: "Spaceflight stress can reactivate dormant viruses (cold sores, shingles) and cause rashes, allergies and infections." },
  gut: { name: "Metabolism & nutrition", info: "Long missions need food that lasts years. Menu fatigue and inactivity affect nutrition and blood sugar." },
  kidneys: { name: "Kidneys", info: "Calcium from bone loss plus dehydration raises kidney stone risk. Hydration is the key countermeasure." },
  bones: { name: "Bones & muscles", info: "Bones lose 1–1.5% of density per month and muscles weaken without gravity. Daily exercise is the main countermeasure." },
  wholeBody: { name: "Radiation (whole body)", info: "Invisible and unfelt. It raises cancer risk and can affect the brain, heart and eyes. Tracked by your dosimeter against NASA's 600 mSv career limit." },
};
// Indicators to add later (no number yet): vision self-check (eyes), motion-sickness rating (inner ear), symptom checklist (immune).
