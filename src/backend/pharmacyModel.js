export const PHARMACY_DRUGS = [
  {
    id: "epinephrine",
    name: "Epinephrine",
    note: "Emergency medication: use the mission formulary and trained medical officer’s direction. A simulated potency estimate cannot determine whether a lot is usable.",
  },
  {
    id: "promethazine",
    name: "Promethazine",
    note: "Review sedation, alertness, interactions, route and formulation with the medical officer before safety-critical work.",
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    note: "Antibiotic choice depends on the infection, allergy history and approved treatment plan. The calculator does not determine an antibiotic dose or course.",
  },
  {
    id: "zolpidem",
    name: "Zolpidem",
    note: "Review next-day impairment, sleep opportunity, interactions and mission duties with the medical officer. Do not repeat a dose because this model shows a lower percentage.",
  },
];

export const PHARMACY_ENVIRONMENTS = {
  iss: { name: "ISS", stress: 1 },
  moon: { name: "Moon", stress: 1.3 },
  mars: { name: "Mars surface", stress: 1.5 },
  transit: { name: "Mars transit", stress: 1.8 },
};
export const DEFAULT_PHARMACY_SCENARIO = {
  drug: "epinephrine",
  environment: "transit",
  days: 180,
  temperature: 22,
  initialPotency: 100,
  baseLoss: 0.02,
  absorbedDoseGy: 0.2,
  radiationLoss: 0,
  packaging: "sealed",
  lot: "",
  pharmacistNote: "",
};

export function pharmacyPotency(input) {
  const fields = {
    days: [0, 2000],
    temperature: [0, 45],
    initialPotency: [0, 120],
    baseLoss: [0, 1],
    absorbedDoseGy: [0, 20],
    radiationLoss: [0, 50],
  };
  const clean = {};
  for (const [key, [min, max]] of Object.entries(fields)) {
    const value = Number(input[key]);
    if (
      input[key] === "" ||
      input[key] == null ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      throw new Error(`${key} must be between ${min} and ${max}.`);
    clean[key] = value;
  }
  if (
    !PHARMACY_DRUGS.some((d) => d.id === input.drug) ||
    !PHARMACY_ENVIRONMENTS[input.environment]
  )
    throw new Error("Choose a medicine and mission environment.");
  if (!["sealed", "repacked"].includes(input.packaging))
    throw new Error("Choose the packaging condition.");
  const tempFactor = 2 ** ((clean.temperature - 22) / 10);
  const packFactor = input.packaging === "repacked" ? 1.4 : 1;
  const storageLoss =
    (clean.baseLoss / 100) * clean.days * tempFactor * packFactor;
  const radiationLoss =
    (clean.radiationLoss / 100) *
    clean.absorbedDoseGy *
    PHARMACY_ENVIRONMENTS[input.environment].stress;
  const baseline = clean.initialPotency * Math.exp(-storageLoss);
  const potency = clean.initialPotency * Math.exp(-storageLoss - radiationLoss);
  const curve = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return {
      day: Math.round(clean.days * t),
      baseline: clean.initialPotency * Math.exp(-storageLoss * t),
      potency:
        clean.initialPotency * Math.exp(-(storageLoss + radiationLoss) * t),
    };
  });
  return {
    potency,
    baseline,
    radiationDifference: baseline - potency,
    curve,
    tempFactor,
    packFactor,
    environmentFactor: PHARMACY_ENVIRONMENTS[input.environment].stress,
    experimental: true,
  };
}
