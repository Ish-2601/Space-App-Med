export const bounded = (n, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
export const rounded = (n, digits = 1) => Number(n.toFixed(digits));
export function dayScopedClinicalItems(payload, day, key, fallback = []) {
  return payload?.logDay === day && Array.isArray(payload[key])
    ? payload[key]
    : fallback;
}
export const emptyAcousticDay = () => [
  { hours: 0, dba: 55 },
  { hours: 0, dba: 55 },
  { hours: 0, dba: 55 },
];
export function numberIn(value, min, max, label = "Value") {
  if (value === "" || value == null || !Number.isFinite(Number(value)))
    throw new Error(`${label} needs a number.`);
  const n = Number(value);
  if (n < min || n > max)
    throw new Error(`${label} must be between ${min} and ${max}.`);
  return n;
}
export function viralIndex({ stress, sleep, cortisolRatio, radiation }) {
  const factors = [
    numberIn(stress, 0, 10) * 3,
    bounded((8 - numberIn(sleep, 0, 16)) * 6, 0, 30),
    bounded((numberIn(cortisolRatio, 0, 500) - 100) * 0.2, 0, 20),
    bounded(numberIn(radiation, 0, 1000) * 2, 0, 20),
  ];
  return { score: Math.round(factors.reduce((a, b) => a + b, 0)), factors };
}
export function renalIndex({
  water,
  specificGravity,
  color,
  sodium,
  boneLoss,
}) {
  const factors = [
    bounded((2.5 - numberIn(water, 0, 10)) * 16, 0, 40),
    bounded((numberIn(specificGravity, 1, 1.05) - 1.005) * 800, 0, 20),
    ((numberIn(color, 1, 8) - 1) / 7) * 10,
    bounded((numberIn(sodium, 0, 15000) - 1500) / 100, 0, 15),
    bounded(numberIn(boneLoss, 0, 10) * 10, 0, 15),
  ];
  return { score: Math.round(factors.reduce((a, b) => a + b, 0)), factors };
}
export function acousticExposure(segments) {
  const rows = segments.map((s) => ({
    hours: numberIn(s.hours, 0, 24, "Hours"),
    dba: numberIn(s.dba, 20, 140, "Noise"),
  }));
  const hours = rows.reduce((n, r) => n + r.hours, 0);
  if (hours <= 0 || hours > 24)
    throw new Error("Log more than zero and no more than 24 hours.");
  return {
    hours: rounded(hours),
    leq: rounded(
      10 *
        Math.log10(
          rows.reduce((n, r) => n + r.hours * 10 ** (r.dba / 10), 0) / hours,
        ),
    ),
    fanFlag: rows.some((r) => r.hours > 0 && r.dba > 60),
  };
}
export function landingPlan({
  mass,
  prescribedMlKg,
  consumedMl,
  sodiumG,
  lbnpMinutes,
}) {
  const target =
    numberIn(mass, 30, 200, "Body mass") *
    numberIn(prescribedMlKg, 0, 30, "CMO-prescribed mL/kg");
  const consumed = numberIn(consumedMl, 0, 6000, "Consumed volume");
  return {
    targetMl: Math.round(target),
    remainingMl: Math.max(0, Math.round(target - consumed)),
    sodiumG: numberIn(sodiumG, 0, 15, "CMO-prescribed sodium"),
    lbnpMinutes: numberIn(lbnpMinutes, 0, 120, "CMO-prescribed LBNP time"),
  };
}
export function fatigueMap({ ared, t2, cevis, exertion }) {
  const a = numberIn(ared, 0, 180),
    t = numberIn(t2, 0, 180),
    c = numberIn(cevis, 0, 180),
    effort = numberIn(exertion, 0, 10) / 10;
  return Object.fromEntries(
    Object.entries({
      shoulders: a * 0.9,
      lumbar: a * 0.8 + t * 0.3,
      quadriceps: a * 0.7 + t * 0.6 + c * 0.8,
      calves: t * 1.1 + c * 0.3,
    }).map(([key, load]) => [key, Math.round(bounded(load * effort))]),
  );
}
export function organDose({ lens, marrow, thyroid, cns, quality, shielding }) {
  const q = numberIn(quality, 1, 30, "Quality factor"),
    fraction = 1 - numberIn(shielding, 0, 100, "Assumed shielding") / 100;
  return [
    ["Eye lens", lens],
    ["Bone marrow / BFO", marrow],
    ["Thyroid", thyroid],
    ["CNS", cns],
  ].map(([organ, value]) => {
    const before = numberIn(value, 0, 10000, organ) * q;
    return {
      organ,
      before: rounded(before, 2),
      after: rounded(before * fraction, 2),
    };
  });
}
export function onsdChange({ baseline, left, right, shift }) {
  const base = numberIn(baseline, 1, 10),
    l = numberIn(left, 1, 10),
    r = numberIn(right, 1, 10);
  return {
    left: rounded(l - base, 2),
    right: rounded(r - base, 2),
    shift: numberIn(shift, 0, 2.5),
  };
}
export function breathingPhase(elapsed) {
  const phase = ((Math.max(0, elapsed) % 10000) / 10000) * 4;
  const index = Math.floor(phase);
  return {
    label: [
      "Breathe in gently",
      "Comfortable pause",
      "Breathe out gently",
      "Comfortable pause",
    ][index],
    scale:
      index === 0
        ? 0.65 + 0.35 * (phase % 1)
        : index === 1
          ? 1
          : index === 2
            ? 1 - 0.35 * (phase % 1)
            : 0.65,
    cycle: Math.floor(elapsed / 10000),
  };
}
export const SPACE_FOODS = [
  {
    code: "NM-101",
    name: "Spinach and chickpea pouch",
    lutein: 6,
    zeaxanthin: 0.4,
    omega3: 0.2,
    iron: 4,
    sodium: 380,
  },
  {
    code: "NM-102",
    name: "Salmon and rice pouch",
    lutein: 0.2,
    zeaxanthin: 0.1,
    omega3: 1.5,
    iron: 1.3,
    sodium: 420,
  },
  {
    code: "NM-103",
    name: "Fortified breakfast pouch",
    lutein: 0.5,
    zeaxanthin: 0.2,
    omega3: 0.1,
    iron: 12,
    sodium: 300,
  },
];
export function foodTotals(meals, ironCeiling) {
  const ceiling = numberIn(ironCeiling, 1, 100, "Personal iron review ceiling");
  const total = { lutein: 0, zeaxanthin: 0, omega3: 0, iron: 0, sodium: 0 };
  meals.forEach((meal) => {
    const food = SPACE_FOODS.find((f) => f.code === meal.code);
    if (!food) throw new Error("Unknown food code.");
    const servings = numberIn(meal.servings, 0.25, 10);
    Object.keys(total).forEach((k) => (total[k] += food[k] * servings));
  });
  Object.keys(total).forEach((k) => (total[k] = rounded(total[k], 2)));
  return { ...total, ironFlag: total.iron > ceiling };
}
export const CLINICAL_SOURCES = {
  cbt: [
    "NHS thought-record self-help",
    "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/",
  ],
  sensory: [
    "NASA: mental well-being in space",
    "https://www.nasa.gov/missions/station/iss-research/mental-well-being-in-space/",
  ],
  sans: [
    "NASA: SANS risk",
    "https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/",
  ],
  vitamins: [
    "NASA: B-vitamin research",
    "https://www.nasa.gov/podcasts/houston-we-have-a-podcast/lets-b-complex/",
  ],
  cardio: [
    "NASA: cardiovascular countermeasures",
    "https://www.nasa.gov/directorates/esdmd/hhp/cardiovascular-and-vision/",
  ],
  chibis: [
    "NASA: Fluid Shifts / Chibis study",
    "https://www.nasa.gov/humans-in-space/nasa-fluid-shifts-study-advances-journey-to-mars/",
  ],
  immune: [
    "NASA: dormant viruses during spaceflight",
    "https://www.nasa.gov/humans-in-space/nasa-investigates-how-dormant-viruses-behave-during-spaceflight/",
  ],
  dust: [
    "NASA: celestial dust risk",
    "https://www.nasa.gov/directorates/esdmd/hhp/risk-of-adverse-health-performance-effects-of-celestial-dust-exposure/",
  ],
  noise: [
    "NASA: acoustic environment",
    "https://www.nasa.gov/reference/vehicle-systems-interfaces-structure-environmental-design/",
  ],
  kidney: [
    "NASA: urinary health technical brief",
    "https://www.nasa.gov/wp-content/uploads/2025/01/ochmo-mtb-003-urinary-health.pdf",
  ],
  body: [
    "NASA: the human body in space",
    "https://www.nasa.gov/humans-in-space/the-human-body-in-space/",
  ],
  food: [
    "NASA: space food and taste",
    "https://www.nasa.gov/podcasts/houston-we-have-a-podcast/space-food/",
  ],
  iron: [
    "NIH: iron reference information",
    "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
  ],
  shielding: [
    "ESA: Artemis I radiation protection results",
    "https://blogs.esa.int/orion/2026/08/28/artemis-i-radiation-results-to-protect-astronauts/",
  ],
};
