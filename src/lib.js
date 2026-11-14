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
export function simulateHistory(days = 30) {
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const drift = d / days; // slow deterioration to make the demo interesting
    rows.push({
      day: d,
      heartRate: Math.round(68 + drift * 14 + Math.random() * 6),
      systolic: Math.round(118 + drift * 12 + Math.random() * 6),
      glucose: Math.round(92 + drift * 20 + Math.random() * 10),
      temp: +(36.6 + Math.random() * 0.4).toFixed(1),
      sleep: +(7.4 - drift * 2 + Math.random()).toFixed(1),
      mood: Math.round(8 - drift * 3 + Math.random() * 2),
    });
  }
  return rows;
}

export const bodyParts = {
  heart: { name: "Heart & circulation", info: "Fluid shifts and deconditioning change heart rate and blood pressure." },
  brain: { name: "Brain & behavior", info: "Sleep disruption, isolation and confinement affect mood and performance." },
  immune: { name: "Immune system", info: "Spaceflight can alter immune responses and reactivate latent viruses." },
  gut: { name: "Metabolism & nutrition", info: "Diet, stress and inactivity influence blood sugar and nutrition." },
}; // TODO: add bones, muscles, eyes (SANS), kidneys (stones), radiation exposure
