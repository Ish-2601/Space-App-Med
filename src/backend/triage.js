// Fast triage: symptoms + situation + live data -> ranked possible causes with "why" and "do now".
// It points the crew at what to check and which protocol to start. It is NOT a diagnosis:
// the crew medical officer and flight surgeon decide. Weights are this app's prototype rules,
// built from the NASA HRP risk pages, the app's symptom guides and standard first-aid red flags.
import { habitatToday, rowFor, latestTest, evaluateTest, activeEvent, envOf, ppO2, CO2_LIMIT_MMHG, CO2_TARGET_MMHG } from "./rules.js";

export const TRIAGE_SYMPTOMS = [
  { id: "headache", label: "Headache", icon: "brain" },
  { id: "vision", label: "Blurry or changed vision", icon: "eyes" },
  { id: "dizzy", label: "Dizzy or light-headed", icon: "body" },
  { id: "fainted", label: "Fainted / passed out", icon: "alert" },
  { id: "chest", label: "Chest pain or pressure", icon: "heart" },
  { id: "palpitations", label: "Racing or irregular heartbeat", icon: "heart" },
  { id: "breath", label: "Short of breath", icon: "air" },
  { id: "bluelips", label: "Blue lips or fingers", icon: "air" },
  { id: "confusion", label: "Confused or slow thinking", icon: "brain" },
  { id: "weakness", label: "Weak or numb on one side", icon: "alert" },
  { id: "nausea", label: "Nausea or vomiting", icon: "kit" },
  { id: "jointpain", label: "Joint pain or tingling", icon: "exercise" },
  { id: "rash", label: "Rash, itching or skin redness", icon: "shield" },
  { id: "fever", label: "Fever or chills", icon: "sun" },
  { id: "flankpain", label: "Side/back pain or dark urine", icon: "water" },
  { id: "ear", label: "Ear pain, ringing or hearing loss", icon: "medical" },
];

export const TRIAGE_CONTEXT = [
  { id: "afterEva", label: "During or after a spacewalk" },
  { id: "gravityChange", label: "Just landed / gravity change" },
  { id: "headInjury", label: "Hit their head / injury" },
  { id: "firstDays", label: "First days in space" },
];

// Symptoms that mean "treat this as an emergency now", whatever the ranking says
const RED_FLAGS = {
  chest: "Chest pain",
  fainted: "Lost consciousness",
  confusion: "Confusion",
  bluelips: "Blue lips or fingers",
  weakness: "One-sided weakness or numbness",
};

const n = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

// Gather the live data the rules look at. Vitals typed in now win over today's logged reading.
export function triageData(state, pid, vitals = {}) {
  const row = rowFor(state, pid) || {};
  const hab = habitatToday(state);
  const pick = (now, today, label) =>
    n(now) != null ? { v: n(now), src: "measured now" } : today != null ? { v: today, src: `today's ${label}` } : null;
  const recent = (type, days) => {
    const t = latestTest(state, pid, type);
    if (!t || state.mission.day - t.day > days) return null;
    return { ...evaluateTest(state, pid, t), day: t.day, result: t.result };
  };
  const ev = activeEvent(state);
  return {
    spo2: pick(vitals.spo2, row.spo2, "reading"),
    hr: pick(vitals.hr, row.heartRate, "resting reading"),
    sys: pick(vitals.sys, row.systolic, "reading"),
    temp: pick(vitals.temp, row.temp, "reading"),
    water: row.water,
    co2: hab?.co2,
    ppo2: hab ? ppO2(hab) : null,
    acuity: recent("acuity", 14),
    amsler: recent("amsler", 14),
    stand: recent("stand", 7),
    hearing: recent("hearing", 45),
    urine: recent("urine", 3),
    motion: state.checkins[pid]?.[state.mission.day]?.motion ?? null,
    storm: ev ? { sheltered: !!ev.sheltered[pid] } : null,
    microgravity: envOf(state).microgravity,
  };
}

// Each condition: symptom weights, situation weights, evidence from data, urgency, actions.
export const CONDITIONS = [
  {
    id: "co2", name: "High cabin CO₂ (scrubber problem)", urgency: "emergency", protocol: "co2", guide: "headache", part: "lungs",
    symptoms: { headache: 3, breath: 2, confusion: 2, dizzy: 1, vision: 1, nausea: 1 },
    evidence: (d) => {
      if (d.co2 == null) return [];
      if (d.co2 > CO2_LIMIT_MMHG) return [[5, `Cabin CO₂ is ${d.co2} mmHg, above NASA's ${CO2_LIMIT_MMHG} mmHg limit`]];
      if (d.co2 > CO2_TARGET_MMHG) return [[2, `Cabin CO₂ is ${d.co2} mmHg, above the recommended ${CO2_TARGET_MMHG}`]];
      return [[-3, `Cabin CO₂ is normal (${d.co2} mmHg)`]];
    },
    doNow: ["Move everyone to the best-ventilated module", "Check the CO₂ reading on a second sensor", "Switch on the backup CO₂ removal system"],
  },
  {
    id: "hypoxia", name: "Low oxygen (hypoxia)", urgency: "emergency", protocol: "hypoxia", guide: "breath", part: "lungs",
    symptoms: { breath: 3, confusion: 3, bluelips: 5, headache: 2, dizzy: 2, vision: 1 },
    evidence: (d) => {
      const out = [];
      if (d.spo2) {
        if (d.spo2.v < 92) out.push([5, `SpO₂ ${d.spo2.v}% (${d.spo2.src}), below 92%`]);
        else if (d.spo2.v < 95) out.push([2, `SpO₂ ${d.spo2.v}% (${d.spo2.src}), a little low`]);
        else out.push([-3, `SpO₂ ${d.spo2.v}% (${d.spo2.src}) is normal`]);
      }
      if (d.ppo2 != null && d.ppo2 < 18) out.push([2, `Cabin oxygen pressure is ${d.ppo2} kPa (low-pressure habitat)`]);
      return out;
    },
    doNow: ["Put on an oxygen mask", "Measure SpO₂ now and every 5 minutes", "Check cabin O₂ and pressure readings"],
  },
  {
    id: "cardiac", name: "Heart problem (chest pain or abnormal rhythm)", urgency: "emergency", protocol: "chest", guide: "chest", part: "heart",
    symptoms: { chest: 5, palpitations: 4, breath: 2, fainted: 2, dizzy: 1, nausea: 1 },
    evidence: (d) => (d.hr && (d.hr.v > 110 || d.hr.v < 45) ? [[2, `Heart rate ${d.hr.v} bpm (${d.hr.src})`]] : []),
    doNow: ["Stop all activity and rest", "Measure heart rate, BP and SpO₂; record an ECG if available", "Give oxygen if SpO₂ is under 94%"],
  },
  {
    id: "dcs", name: "Decompression sickness (the bends)", urgency: "emergency", protocol: "dcs", guide: "jointpain", part: "lungs",
    symptoms: { jointpain: 4, weakness: 3, rash: 2, confusion: 2, breath: 2, dizzy: 1 },
    context: { afterEva: 5 },
    missing: { afterEva: -3 },
    doNow: ["Stop the spacewalk and return to habitat pressure", "Breathe 100% oxygen", "Lie flat; the CMO checks symptoms every 15 minutes"],
  },
  {
    id: "neuro", name: "Possible stroke or other nerve emergency", urgency: "emergency", part: "brain",
    symptoms: { weakness: 6, confusion: 2, vision: 2, dizzy: 1, headache: 1 },
    doNow: ["Note the exact time symptoms started", "Check face droop, arm weakness and speech", "Give oxygen, keep them still, and get the CMO now"],
  },
  {
    id: "headinjury", name: "Head injury / concussion", urgency: "emergency", part: "brain",
    symptoms: { confusion: 3, headache: 2, nausea: 2, vision: 2, dizzy: 2, fainted: 2 },
    context: { headInjury: 5 },
    missing: { headInjury: -5 },
    doNow: ["Keep them still and don't leave them alone", "Check responsiveness and pupils every 15 minutes", "Escalate at once if vomiting, confusion or drowsiness gets worse"],
  },
  {
    id: "orthostatic", name: "Low blood pressure on standing (after gravity change)", urgency: "urgent", protocol: "faint", guide: "dizzy", part: "heart",
    symptoms: { dizzy: 3, fainted: 4, nausea: 1, vision: 1 },
    context: { gravityChange: 4 },
    evidence: (d) => {
      const out = [];
      if (d.sys && d.sys.v < 90) out.push([3, `Systolic BP ${d.sys.v} mmHg (${d.sys.src})`]);
      if (d.stand && d.stand.status !== "green") out.push([2, `Stand test on day ${d.stand.day}: ${d.stand.summary}`]);
      return out;
    },
    missingFn: (d, ctx) => (d.microgravity && !ctx.gravityChange ? [[-2, "In weightlessness there is no standing up, so this is less likely"]] : []),
    doNow: ["Lie flat with legs raised", "Give fluids (with salt tablets per procedure)", "Measure heart rate and BP lying and then sitting"],
  },
  {
    id: "radiation", name: "Radiation exposure (solar storm)", urgency: "emergency", protocol: "spe", part: "wholeBody",
    symptoms: { nausea: 3, rash: 1, dizzy: 1 },
    evidence: (d) =>
      d.storm ? (d.storm.sheltered ? [[1, "A solar storm is under way (sheltered)"]] : [[5, "A solar storm is under way and they are NOT in the shelter"]]) : [[-4, "No solar storm right now"]],
    doNow: ["Go to the storm shelter now", "Bring a portable dosimeter and water", "Log the dose after the all-clear"],
  },
  {
    id: "sans", name: "Eye changes from weightlessness (SANS)", urgency: "routine", guide: "vision", part: "eyes",
    symptoms: { vision: 4, headache: 1 },
    evidence: (d) => {
      const out = [];
      if (d.acuity && d.acuity.status !== "green") out.push([3, `Near vision chart on day ${d.acuity.day}: ${d.acuity.summary}`]);
      if (d.amsler && d.amsler.status !== "green") out.push([2, `Amsler grid on day ${d.amsler.day}: ${d.amsler.summary}`]);
      if (d.microgravity) out.push([1, "In weightlessness (fluid shifts toward the head)"]);
      return out;
    },
    doNow: ["Do the near vision chart and Amsler grid in Checks", "Use the adjustable-focus glasses if issued", "Report to the CMO for an eye exam / ultrasound"],
  },
  {
    id: "motion", name: "Space motion sickness", urgency: "routine", guide: "nausea", part: "vestibular",
    symptoms: { nausea: 4, dizzy: 2, headache: 1 },
    context: { firstDays: 3, gravityChange: 2 },
    evidence: (d) => (d.motion >= 6 ? [[2, `Motion sickness rated ${d.motion}/10 in today's check-in`]] : []),
    doNow: ["Keep head movements slow", "Fix your eyes on a stable 'up' reference", "Anti-nausea medication from the med kit"],
  },
  {
    id: "dehydration", name: "Dehydration", urgency: "routine", guide: "dizzy", part: "kidneys",
    symptoms: { dizzy: 2, headache: 2, flankpain: 1, nausea: 1 },
    evidence: (d) => {
      const out = [];
      if (d.water != null && d.water < 1.5) out.push([3, `Only ${d.water} L of water logged today`]);
      else if (d.water != null && d.water < 2) out.push([1, `${d.water} L of water today (goal 2 L)`]);
      if (d.urine?.result?.shade >= 4) out.push([d.urine.result.shade >= 7 ? 3 : 2, `Hydration colour check: ${d.urine.summary}`]);
      return out;
    },
    doNow: ["Drink 500 mL of water now", "Rest, then recheck how you feel in 30 minutes", "Log water in Log activity"],
  },
  {
    id: "kidneystone", name: "Kidney stone", urgency: "urgent", guide: "flankpain", part: "kidneys",
    symptoms: { flankpain: 5, nausea: 2, fever: 1 },
    evidence: (d) => (d.water != null && d.water < 2 ? [[1, `Low water intake today (${d.water} L)`]] : []),
    doNow: ["Drink 2–3 L of water over the day", "Pain relief from the med kit", "Tell the CMO; escalate for fever or blood in urine"],
  },
  {
    id: "infection", name: "Infection", urgency: "urgent", guide: "fever", part: "immune",
    symptoms: { fever: 4, rash: 1, headache: 1, nausea: 1, breath: 1 },
    evidence: (d) =>
      d.temp ? (d.temp.v >= 38 ? [[4, `Temperature ${d.temp.v} °C (${d.temp.src})`]] : d.temp.v >= 37.5 ? [[1, `Temperature ${d.temp.v} °C (${d.temp.src}); note resting temperature runs about 1 °C higher on long missions`]] : []) : [],
    doNow: ["Measure temperature now and every 4 hours", "Rest, drink fluids, limit close contact with crewmates", "Tell the CMO if 38 °C or higher"],
  },
  {
    id: "skin", name: "Rash or reactivated virus (cold sore, shingles)", urgency: "routine", guide: "rash", part: "immune",
    symptoms: { rash: 4, fever: 1 },
    doNow: ["Photograph it in the Photo log", "Keep it clean and dry; don't share items", "Antiviral cream from the med kit"],
  },
  {
    id: "ear", name: "Ear or hearing problem", urgency: "routine", part: "vestibular",
    symptoms: { ear: 5, dizzy: 2, nausea: 1 },
    evidence: (d) => (d.hearing && d.hearing.status !== "green" ? [[2, `Hearing check on day ${d.hearing.day}: ${d.hearing.summary}`]] : []),
    doNow: ["Move away from noisy equipment; wear hearing protection", "Do the hearing check in Checks", "Sudden hearing loss is urgent: tell the CMO now"],
  },
];

const URGENCY_RANK = { emergency: 3, urgent: 2, routine: 1 };

// symptoms: [ids]; context: { afterEva: true, ... }; vitals: { spo2, hr, sys, temp }
export function triage(state, pid, { symptoms = [], context = {}, vitals = {} } = {}) {
  const d = triageData(state, pid, vitals);
  const set = new Set(symptoms);
  const results = [];
  for (const c of CONDITIONS) {
    const matched = Object.keys(c.symptoms).filter((s) => set.has(s));
    if (!matched.length) continue; // only consider causes that explain at least one symptom
    let score = matched.reduce((a, s) => a + c.symptoms[s], 0);
    const why = matched.map((s) => [c.symptoms[s], TRIAGE_SYMPTOMS.find((x) => x.id === s).label]);
    for (const [k, w] of Object.entries(c.context || {})) {
      if (context[k]) {
        score += w;
        why.push([w, TRIAGE_CONTEXT.find((x) => x.id === k).label]);
      }
    }
    for (const [k, w] of Object.entries(c.missing || {})) {
      if (!context[k]) {
        score += w;
        why.push([w, `Not "${TRIAGE_CONTEXT.find((x) => x.id === k).label.toLowerCase()}"`]);
      }
    }
    for (const [w, text] of [...(c.evidence?.(d) || []), ...(c.missingFn?.(d, context) || [])]) {
      score += w;
      why.push([w, text]);
    }
    if (score <= 1) continue;
    const strength = score >= 7 ? "strong" : score >= 4 ? "possible" : "weak";
    // An emergency-type cause only counts as "emergency now" when the match is at least possible
    const urgency = c.urgency === "emergency" && strength === "weak" ? "urgent" : c.urgency;
    results.push({ ...c, score, strength, urgencyNow: urgency, why: why.sort((a, b) => b[0] - a[0]) });
  }
  results.sort((a, b) => b.score - a.score || URGENCY_RANK[b.urgencyNow] - URGENCY_RANK[a.urgencyNow]);

  const flags = symptoms.filter((s) => RED_FLAGS[s]).map((s) => RED_FLAGS[s]);
  if (d.spo2 && d.spo2.v < 90) flags.push(`SpO₂ ${d.spo2.v}%`);
  if (context.headInjury && (set.has("confusion") || set.has("nausea") || set.has("fainted"))) flags.push("Head injury with confusion, vomiting or fainting");
  if (set.has("breath") && d.spo2 && d.spo2.v < 92) flags.push("Short of breath with low SpO₂");
  const emergency = flags.length > 0 || results.some((r) => r.urgencyNow === "emergency" && r.strength === "strong");
  return { results: results.slice(0, 4), flags, emergency, data: d };
}
