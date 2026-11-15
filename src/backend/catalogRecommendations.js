import { SPACEFLIGHT_CATALOG_1000 } from "../data/spaceflightCatalog1000.ts";

// Explicit item IDs keep cross-system recommendations intentional. Category 10
// remains available in the explorer but is not hardware or a countermeasure.
export const BODY_RECOMMENDATIONS = {
  brain: {
    title: "Head and mental wellbeing",
    reason:
      "Sleep, stress monitoring and approved sensory variety for long-duration missions.",
    ids: [
      13, 14, 404, 417, 420, 720, 36, 37, 51, 52, 401, 403, 405, 413, 418, 451,
    ],
  },
  eyes: {
    title: "Eyes and vision",
    reason:
      "Vision measurements and clinician-selected optical correction; imaging and refraction need trained interpretation.",
    ids: [21, 22, 25, 674, 675, 29, 24, 28, 30, 78, 673, 521, 547, 668],
  },
  vestibular: {
    title: "Hearing and balance",
    reason:
      "Hearing assessment, cabin-noise logging and supervised vestibular adaptation.",
    ids: [38, 69, 84, 383, 405, 749, 26, 27, 83, 85, 386, 900],
  },
  heart: {
    title: "Heart and circulation",
    reason:
      "Cardiovascular monitoring, exercise support and clinician-planned landing countermeasures.",
    ids: [1, 7, 8, 310, 315, 381, 18, 31, 93, 101, 102, 362, 382],
  },
  lungs: {
    title: "Respiratory health",
    reason:
      "Respiratory measurements and mission-approved dust containment and cabin-air maintenance.",
    ids: [9, 33, 32, 72, 738, 740, 34, 65, 74, 99, 110, 718, 741, 767],
  },
  immune: {
    title: "Immunity and skin",
    reason:
      "Immune and skin observation, nailbed documentation and mechanical protection against suit and restraint hotspots.",
    ids: [
      51, 53, 87, 94, 625, 804, 11, 12, 56, 57, 58, 172, 617, 618, 629, 698,
    ],
  },
  gut: {
    title: "Nutrition and metabolism",
    reason:
      "Food logging, hydration equipment and varied nutrient sources within the mission nutrition plan.",
    ids: [77, 501, 519, 521, 511, 548, 3, 41, 55, 505, 512, 525, 552, 572],
  },
  kidneys: {
    title: "Kidneys and hydration",
    reason:
      "Urine measurements, hydration tracking and clinician-directed assessment of urinary obstruction.",
    ids: [48, 49, 89, 90, 501, 503, 50, 191, 300, 590, 632],
  },
  bones: {
    title: "Bones, joints and muscles",
    reason:
      "Resistance and aerobic exercise, muscle-load measurements and therapist-cleared mobility support.",
    ids: [
      301, 304, 306, 39, 331, 333, 40, 45, 98, 305, 324, 328, 349, 366, 367,
      829,
    ],
  },
  wholeBody: {
    title: "Radiation exposure",
    reason:
      "Dosimetry and mission-designed shielding. Equipment listings do not establish a safe dose or verified shielding performance.",
    ids: [61, 62, 64, 701, 702, 710, 63, 703, 705, 774, 870],
  },
};

export const EMERGENCY_RECOMMENDATIONS = {
  dcs: {
    title: "Decompression sickness",
    reason:
      "Oxygen delivery, patient restraint and clinical monitoring for the CMO-led decompression response.",
    ids: [9, 110, 101, 781, 784, 880, 782, 7, 31],
  },
  spe: {
    title: "Solar particle event",
    reason:
      "Dosimeters, shelter supplies and radiation alerts; use the actual mission-approved shelter manifest.",
    ids: [61, 64, 701, 702, 703, 710, 501, 774, 870, 599],
  },
  faint: {
    title: "Fainting / loss of consciousness",
    reason:
      "Assess responsiveness and breathing with the CMO, then document circulation and oxygen measurements.",
    ids: [7, 9, 1, 101, 110, 31, 315, 381],
  },
  hypoxia: {
    title: "Low oxygen",
    reason:
      "Oxygen measurement, cabin-pressure checks and trained use of the vehicle's approved breathing equipment.",
    ids: [9, 110, 34, 74, 781, 711, 107, 109],
  },
  co2: {
    title: "High cabin CO₂",
    reason:
      "Verify local readings, restore cabin CO₂ removal and check airflow using approved spacecraft procedures.",
    ids: [65, 713, 714, 767, 74, 718, 720, 99, 837],
  },
  chest: {
    title: "Chest pain / irregular heartbeat",
    reason:
      "Clinical monitoring and resuscitation readiness under CMO direction; an AED is used according to its prompts and crew training.",
    ids: [1, 7, 9, 102, 104, 101, 31, 18, 103, 107, 110],
  },
  ocular: {
    title: "Ocular foreign body / chemical splash",
    reason:
      "Contain contaminated fluid and support prompt eye assessment. Morgan Lens, fluorescein and embedded-object procedures require trained clinical review.",
    ids: [176, 177, 29, 30, 24, 200, 742, 673, 277],
  },
  renal: {
    title: "Renal colic / obstruction",
    reason:
      "Assess urine and obstruction, with specialist imaging and clinician-authorized treatment. Severe pain, fever or inability to pass urine needs urgent review.",
    ids: [89, 48, 49, 9, 191, 300, 211, 50, 136],
  },
  toxic: {
    title: "Toxic atmosphere",
    reason:
      "Evacuate to a safe atmosphere and use contaminant-specific detection and certified protection. CCPK and basic oxygen masks do not provide universal ammonia or hydrazine protection.",
    ids: [711, 712, 67, 68, 726, 727, 200, 66, 735, 762, 781],
  },
  dental: {
    title: "Dental injury / abscess",
    reason:
      "Preserve dental structures and prepare supplies for the clinician. Filling material, eugenol and extraction tools are not self-treatment instructions.",
    ids: [184, 185, 186, 47, 174, 189, 187, 188, 190, 46, 680],
  },
};

const catalogById = new Map(
  SPACEFLIGHT_CATALOG_1000.map((item) => [item.id, item]),
);

export function recommendationContext({
  partKey,
  bodySystem,
  emergencyType,
} = {}) {
  if (emergencyType) return EMERGENCY_RECOMMENDATIONS[emergencyType] || null;
  return BODY_RECOMMENDATIONS[partKey || bodySystem] || null;
}

export function getRecommendationIds(context = {}) {
  return [...(recommendationContext(context)?.ids || [])];
}

export function recommendedCatalogItems({ limit = 6, ...context } = {}) {
  const items = getRecommendationIds(context)
    .map((id) => catalogById.get(id))
    .filter(
      (item) =>
        item &&
        item.categoryId >= 1 &&
        item.categoryId <= 9 &&
        item.itemType !== "Smart Software Module",
    );
  return limit == null ? items : items.slice(0, Math.max(0, Math.floor(limit)));
}
