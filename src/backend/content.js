// Static content used by the backend. Sources for numbers are listed in docs/RESEARCH.md.
import { SPECIALIZED_EMERGENCIES } from "./emergencySpecialized.js";

// Dose rates (mSv/day): ISS ~0.5 (0.2–0.7 depending on solar cycle; Chang'e-4 comparison measured 0.73),
// Mars cruise 1.84 and Mars surface 0.64 (Curiosity RAD), Moon surface 1.37 (Chang'e-4 LND).
// Base atmospheres: ISS/Orion sea-level air; surface habitats use NASA's proposed exploration atmosphere
// (56.5 kPa / 8.2 psia, 34% O2) to make frequent spacewalks safer (see HRP hypoxia risk).
export const ENVIRONMENTS = {
  iss: {
    label: "ISS (low Earth orbit)", gravity: "Microgravity", microgravity: true, doseRate: 0.5, delayMin: 0,
    atmosphere: { pressureKpa: 101.3, o2Pct: 21 },
    focus: ["bones", "eyes", "brain"],
    note: "Inside Earth's magnetic field. Mission Control is a call away.",
  },
  transit: {
    label: "Mars transit", gravity: "Microgravity", microgravity: true, doseRate: 1.84, delayMin: 14,
    atmosphere: { pressureKpa: 101.3, o2Pct: 21 },
    focus: ["wholeBody", "bones", "eyes", "brain"],
    note: "Outside the magnetosphere: the highest radiation of any phase. Earth delay up to 20 min one way (NASA).",
  },
  moon: {
    label: "Moon base", gravity: "1/6 g", microgravity: false, doseRate: 1.37, delayMin: 0.022,
    atmosphere: { pressureKpa: 56.5, o2Pct: 34 },
    focus: ["wholeBody", "lungs", "vestibular", "bones"],
    note: "No magnetic field or atmosphere. Frequent spacewalks: watch for decompression sickness and mild hypoxia.",
  },
  mars: {
    label: "Mars base", gravity: "3/8 g", microgravity: false, doseRate: 0.64, delayMin: 14,
    atmosphere: { pressureKpa: 56.5, o2Pct: 34 },
    focus: ["vestibular", "bones", "brain", "wholeBody"],
    note: "Partial gravity after months weightless: balance, fainting and injury risks after landing.",
  },
  // Pressurized rover traverse away from the Mars base. Same surface dose and exploration
  // atmosphere as the base (NASA's pressurized-rover concepts use it for quick spacewalks).
  rover: {
    label: "Mars rover traverse", gravity: "3/8 g", microgravity: false, doseRate: 0.64, delayMin: 14,
    atmosphere: { pressureKpa: 56.5, o2Pct: 34 },
    focus: ["vestibular", "lungs", "wholeBody", "brain"],
    note: "Small cabin far from the base: frequent spacewalks, cramped sleep, and help may be hours away.",
  },
};

// "14 min", "1.3 s" or "none"
export function delayText(env) {
  if (!env.delayMin) return "none";
  return env.delayMin < 1 ? `${Math.round(env.delayMin * 60 * 10) / 10} s` : `${env.delayMin} min`;
}

export const SYMPTOMS = [
  { id: "headache", label: "Headache", part: "brain" },
  { id: "vision", label: "Blurry or changed vision", part: "eyes" },
  { id: "nausea", label: "Nausea / motion sickness", part: "vestibular" },
  { id: "dizzy", label: "Dizziness or lightheaded", part: "heart" },
  { id: "rash", label: "Rash or cold sore", part: "immune" },
  { id: "fever", label: "Fever, sore throat or congestion", part: "immune" },
  { id: "jointpain", label: "Joint pain or tingling (after EVA)", part: "lungs" },
  { id: "backpain", label: "Back pain", part: "bones" },
  { id: "flankpain", label: "Flank pain / dark urine", part: "kidneys" },
  { id: "breath", label: "Short of breath", part: "lungs" },
  { id: "chest", label: "Chest pain or palpitations", part: "heart" },
  { id: "lowmood", label: "Anxious, low or irritable", part: "brain" },
];

// Medical checks done with the camera, screen or sensors. "every" = days between checks.
export const CHECKS = [
  {
    id: "pvt", title: "Reaction self-test", every: 4, part: "brain",
    what: "3-minute alertness test: tap as soon as the counter appears.",
    why: "NASA's Reaction Self-Test (a 3-minute psychomotor vigilance test) has been used on the ISS since 2009 to show astronauts when their performance drops, for example from heavy workloads and reduced sleep. NASA has scheduled it periodically and around events like sleep shifts; the every-4-days schedule here is this app's choice.",
    action: { yellow: "You're slower than your baseline. Avoid safety-critical tasks if you can, protect tonight's sleep, retest tomorrow.", red: "Strong signs of fatigue. Tell the commander before any safety-critical task and ask for rest." },
  },
  {
    id: "amsler", title: "Amsler grid (vision distortion)", every: 7, part: "eyes",
    what: "Hold the screen about 30–35 cm away (normal reading distance) with your reading glasses on if you use them. Cover one eye, stare at the centre dot, mark any wavy, blurry or missing lines.",
    why: "SANS can fold the retina and choroid at the back of the eye. Folds near the centre of vision can make straight lines look wavy. The grid is a quick self-screen between eye exams.",
    action: { yellow: "Distortion marked. Report to the CMO for an eye exam / ultrasound (SANS).", red: "Distortion marked. Report to the CMO and flight surgeon now." },
  },
  {
    id: "acuity", title: "Near vision chart", every: 7, part: "eyes",
    what: "Hold the screen at 40 cm and tell which way each E points.",
    why: "Losing near vision (a 'hyperopic shift') is the main symptom astronauts notice with SANS. Comparing to your own baseline shows change early.",
    action: { yellow: "Near vision is 2+ lines worse than your baseline. Report to the CMO; use adjustable-focus glasses if issued.", red: "Near vision is 4+ lines worse. Report to the CMO and flight surgeon now." },
  },
  {
    id: "hr", title: "Heart rate (camera)", every: 7, part: "heart",
    what: "Measures your pulse from tiny colour changes in your skin, using the camera (face or fingertip).",
    why: "A quick way to check resting heart rate without a wearable; feeds your heart-rate trend.",
    action: { yellow: "Heart rate outside your healthy range. Rest 5 minutes and recheck.", red: "Heart rate far outside range. Recheck with the medical monitor and notify the CMO." },
  },
  {
    id: "balance", title: "Balance test", every: 14, part: "vestibular", gravityOnly: true,
    what: "Stand on one leg, arms crossed, eyes open, for up to 30 seconds.",
    why: "Gravity transitions affect balance and coordination. After landing on the Moon or Mars, crews must walk and self-exit without help (HRP sensorimotor risk).",
    action: { yellow: "Balance is reduced. Move carefully, use handholds, avoid ladders and driving rovers today.", red: "Balance is poor. No EVA, ladder or rover tasks. Notify the CMO." },
  },
  {
    id: "hearing", title: "Hearing check", every: 30, part: "vestibular",
    what: "Put on the same headphones at the same volume, in the quietest spot you can find. Tap when you hear each tone.",
    why: "Spacecraft are noisy: the ISS background is about 72 dBA, and NASA tests the hearing of crew on missions longer than 30 days (On-Orbit Hearing Assessment). This screen is not calibrated, so it only compares you with your own first result.",
    action: { yellow: "Hearing is worse than your baseline at 2–4 kHz. Wear hearing protection in noisy modules, retest in a quiet spot, and tell the CMO.", red: "Possible sudden hearing loss. Tell the CMO now: it is treated as urgent." },
  },
  {
    id: "stand", title: "Stand test (landing readiness)", every: 7, part: "heart", gravityOnly: true,
    what: "Lie down for 2 minutes, then stand still for 3.5 minutes. Record heart rate and blood pressure at the end of each part. Do it daily for the first few days after landing.",
    why: "After weightlessness, blood pools in the legs when you stand, and many astronauts feel faint after landing. NASA uses lie-then-stand tests after landing. A fall of 20+ mmHg systolic (or 10+ diastolic) within 3 minutes of standing is called orthostatic hypotension.",
    action: { yellow: "Your body is still adapting to gravity. Drink fluids, wear compression garments, stand up slowly and avoid ladders and driving today.", red: "Do not do tasks that need you to stand for long. Lie down with legs raised and notify the CMO." },
  },
  {
    id: "tlx", title: "Workload rating (NASA-TLX)", every: 7, part: "brain",
    what: "Rate six parts of your workload from 0 to 100: mental, physical, time pressure, performance, effort and frustration.",
    why: "The NASA Task Load Index is NASA's standard way to measure workload. Work overload is one of the stressors behind the HRP sleep and behavioural-health risks. There is no official cut-off: the app flags 70+ or a jump of 15+ above your usual.",
    action: { yellow: "Your workload is high. Talk to the commander about the schedule and protect your sleep window tonight.", red: "Your workload is very high. Talk to the commander today." },
  },
  {
    id: "urine", title: "Hydration colour check", every: 3, part: "kidneys",
    what: "Match your urine colour to the closest of 8 shades.",
    why: "Dehydration plus calcium from shrinking bones raises kidney-stone risk in space (NASA gravity hazard). The 8-shade colour chart (Armstrong) is the one the US military uses for a quick self-check. B vitamins and some medicines can make urine bright yellow.",
    action: { yellow: "Drink about 500 mL of water over the next hour and check again.", red: "You are likely dehydrated. Drink now; tell the CMO if you also have flank pain, dizziness or very little urine." },
  },
  {
    id: "face", title: "Face photo (fluid shift)", every: 7, part: "heart", photo: true,
    what: "Take a front-facing photo in the same spot and light each week.",
    why: "Fluid shifts toward the head in weightlessness ('puffy face, bird legs'). Comparing photos over time shows how your body is adapting.",
    action: { yellow: "Puffiness rated high. Mention it at your next CMO check.", red: "Severe swelling: notify the CMO." },
  },
];

// Shared crew medical kit (prototype list, not a prescription)
export const MEDKIT = [
  { id: "pain", name: "Pain reliever (ibuprofen)", purpose: "Headache, back pain", stock: 60, min: 15 },
  { id: "nausea", name: "Anti-nausea medication", purpose: "Space motion sickness", stock: 30, min: 10 },
  { id: "sleep", name: "Sleep aid (melatonin)", purpose: "Sleep onset, schedule shifts", stock: 60, min: 15 },
  { id: "antiviral", name: "Antiviral cream", purpose: "Cold sores (viral reactivation)", stock: 5, min: 2 },
  { id: "antihist", name: "Antihistamine", purpose: "Allergy, congestion", stock: 40, min: 10 },
  { id: "antibiotic", name: "Antibiotic course", purpose: "Infection (CMO approval needed)", stock: 6, min: 3 },
  { id: "bvit", name: "Vitamin B complex", purpose: "SANS countermeasure under study (NASA B-Complex)", stock: 120, min: 30 },
  { id: "vitd", name: "Vitamin D", purpose: "Bone health", stock: 150, min: 30 },
  { id: "bisphos", name: "Bisphosphonate", purpose: "Bone loss, taken weekly (NASA-studied countermeasure)", stock: 20, min: 6 },
  { id: "salt", name: "Salt tablets", purpose: "Fluid loading before landing", stock: 40, min: 12 },
];

export const WORKOUTS = [
  { id: "resistance", label: "Resistance (ARED-style)" },
  { id: "cycle", label: "Cycle ergometer (CEVIS-style)" },
  { id: "treadmill", label: "Treadmill (T2-style)" },
  { id: "compact", label: "Compact flywheel / rowing" },
];

// Daily quests. "check" receives the context built in rules.js and returns true when done.
export const QUESTS = [
  { id: "checkin", label: "Complete your daily check-in", points: 20, check: (c) => c.checkedIn },
  { id: "exercise", label: "Exercise 90 minutes", points: 30, check: (c) => c.row.exercise >= 90 },
  { id: "water", label: "Drink at least 2 L of water", points: 15, check: (c) => c.row.water >= 2 },
  { id: "sleep", label: "Sleep 7+ hours", points: 15, check: (c) => c.row.sleep >= 7 },
  { id: "meds", label: "Take your scheduled supplements", points: 10, check: (c) => c.medsDone },
  { id: "checks", label: "Complete a medical check", points: 15, check: (c) => c.checkDone },
  { id: "journal", label: "Write a journal entry", points: 10, check: (c) => c.journaledToday },
];

export const BADGES = [
  { id: "streak7", label: "7-day check-in streak", test: (c) => c.streak >= 7 },
  { id: "streak30", label: "30-day check-in streak", test: (c) => c.streak >= 30 },
  { id: "iron", label: "Iron bones: 5 of the last 7 days with 90+ min exercise", test: (c) => c.exerciseDays >= 5 },
  { id: "hydro", label: "Hydro hero: 5 of the last 7 days with 2+ L water", test: (c) => c.waterDays >= 5 },
  { id: "sharp", label: "Sharp mind: 3 reaction self-tests", test: (c) => c.pvtCount >= 3 },
  { id: "eagle", label: "Eagle eye: vision checks done", test: (c) => c.visionChecks >= 2 },
  { id: "writer", label: "Captain's log: 3 journal entries", test: (c) => c.journalCount >= 3 },
  { id: "shelter", label: "Storm survivor: sheltered during a solar event", test: (c) => c.sheltered },
];

// Symptom guides: self-care, when to escalate. Not medical advice.
export const MED_GUIDE = [
  {
    id: "headache", title: "Headache", part: "brain",
    causes: ["High cabin CO₂ (each +1 mmHg doubles the odds of headache on the ISS)", "Fluid shift toward the head", "Poor sleep or dehydration", "Mild hypoxia in low-pressure habitats"],
    selfCare: ["Check the Habitat page: CO₂ above 3 mmHg? Move to a ventilated area", "Drink 500 mL of water", "Rest 30 minutes, then recheck", "Pain reliever from the med kit if needed"],
    escalate: ["Sudden, severe 'worst ever' headache", "Headache with vision change, confusion or weakness", "SpO₂ below 92%"],
  },
  {
    id: "vision", title: "Blurry or changed vision", part: "eyes",
    causes: ["Spaceflight Associated Neuro-ocular Syndrome (SANS)", "Fluid shift raising pressure behind the eye", "Choroidal folds causing a hyperopic (far-sighted) shift"],
    selfCare: ["Do the Amsler grid and near vision chart in Checks", "Use the adjustable-focus glasses if issued", "Log it in your check-in"],
    escalate: ["Any new or worsening vision change: report to CMO and flight surgeon for an eye exam / ultrasound"],
  },
  {
    id: "nausea", title: "Nausea / motion sickness", part: "vestibular",
    causes: ["Space motion sickness (most astronauts in the first days)", "Gravity transition (landing on Moon/Mars, return to Earth)"],
    selfCare: ["Keep head movements slow", "Fix your eyes on a stable 'up' reference", "Anti-nausea medication from the med kit"],
    escalate: ["Vomiting more than 24 hours", "Unable to keep fluids down", "Nausea with severe headache"],
  },
  {
    id: "dizzy", title: "Dizziness or fainting", part: "heart",
    causes: ["Low blood pressure after weightlessness (orthostatic intolerance)", "Dehydration", "Gravity transition"],
    selfCare: ["Sit or lie down with legs raised", "Drink fluids with salt tablets per procedure", "Wear compression garments for landing"],
    escalate: ["Fainted (lost consciousness)", "Chest pain or irregular heartbeat", "Systolic BP under 85"],
  },
  {
    id: "rash", title: "Rash or cold sore", part: "immune",
    causes: ["Reactivated dormant virus (herpes, shingles)", "Altered immunity from stress and radiation", "Skin microbiome changes"],
    selfCare: ["Photograph it in the Photo log to track changes", "Keep the area clean and dry", "Avoid sharing items with crewmates", "Antiviral cream from the med kit"],
    escalate: ["Painful band-like rash (possible shingles)", "Rash with fever", "Spreading or infected skin"],
  },
  {
    id: "fever", title: "Fever, sore throat or congestion", part: "immune",
    causes: ["Infection (microbes can be more virulent in space)", "Immune changes", "Congestion from fluid shift"],
    selfCare: ["Rest and hydrate", "Measure temperature every 4 hours", "Limit close contact with crewmates"],
    escalate: ["Temperature 38.0 °C or higher", "Difficulty breathing", "Symptoms over 48 hours"],
  },
  {
    id: "jointpain", title: "Joint pain or tingling after a spacewalk", part: "lungs",
    causes: ["Decompression sickness ('the bends'): nitrogen bubbles after moving to lower pressure"],
    selfCare: ["If on EVA: stop, tell the crew, and return to the airlock now", "Breathe 100% oxygen per procedure"],
    escalate: ["Always escalate: start the Decompression sickness emergency protocol"],
  },
  {
    id: "backpain", title: "Back pain", part: "bones",
    causes: ["Height can increase as much as 3% in space as the spine lengthens", "Muscle deconditioning"],
    selfCare: ["Curl into a fetal position to stretch the spine", "Core exercises in your routine"],
    escalate: ["Pain with numbness or weakness in the legs", "Pain after an impact or landing"],
  },
  {
    id: "flankpain", title: "Flank pain / dark urine", part: "kidneys",
    causes: ["Kidney stone risk from calcium lost from bone plus dehydration"],
    selfCare: ["Drink at least 2–3 L of water today", "Log water in Log activity"],
    escalate: ["Severe one-sided pain", "Blood in urine", "Pain with fever"],
  },
  {
    id: "breath", title: "Short of breath", part: "lungs",
    causes: ["Mild hypoxia in reduced-pressure cabins", "High CO₂", "Deconditioning"],
    selfCare: ["Check SpO₂ and the Habitat page O₂/CO₂ readings", "Rest and slow your breathing"],
    escalate: ["SpO₂ under 92%", "Chest pain", "Confusion or blue lips: start the Low oxygen protocol"],
  },
  {
    id: "chest", title: "Chest pain or palpitations", part: "heart",
    causes: ["Heart rhythm changes (cardiovascular adaptation)", "Muscle strain", "Anxiety"],
    selfCare: ["Stop activity and rest", "Measure heart rate, BP and SpO₂"],
    escalate: ["Always escalate chest pain: start the Chest pain emergency protocol"],
  },
  {
    id: "lowmood", title: "Low mood, anxiety or irritability", part: "brain",
    causes: ["Isolation and confinement", "Sleep loss and circadian disruption", "Distance from family and Earth"],
    selfCare: ["Write in your private journal", "Tend the plants, look out a window", "Play a recorded message from home", "Talk to a crewmate you trust"],
    escalate: ["Feeling hopeless or unable to work", "Thoughts of self-harm: tell the CMO now and request a private conference"],
  },
];

export const EMERGENCIES = [
  {
    id: "dcs", title: "Decompression sickness (the bends)",
    when: "Joint pain, tingling, rash, or confusion during or after a spacewalk.",
    steps: ["Stop work and tell the crew on comms", "Return to the airlock / habitat pressure immediately", "Breathe 100% oxygen", "Remove from activity and lie flat", "CMO assesses symptoms every 15 minutes", "Send priority report to flight surgeon"],
  },
  {
    id: "spe", title: "Solar particle event (radiation storm)",
    when: "Space-weather alert or dosimeter dose-rate spike.",
    steps: ["Move to the shielded storm shelter", "Bring water and portable dosimeter", "Confirm every crew member is sheltered", "Stay until the all-clear", "Log dosimeter reading after the event"],
  },
  {
    id: "faint", title: "Fainting / loss of consciousness",
    when: "Crew member collapses or reports blacking out, often after a gravity change.",
    steps: ["Check breathing and responsiveness", "Lay flat with legs raised", "Measure heart rate, BP and SpO₂", "Give fluids once awake", "CMO monitors for 1 hour", "Send priority report to flight surgeon"],
  },
  {
    id: "hypoxia", title: "Low oxygen (hypoxia)",
    when: "SpO₂ under 92%, confusion, headache, blue lips.",
    steps: ["Put on an oxygen mask", "Check cabin O₂ and pressure readings", "Move to a normal-pressure area if available", "Recheck SpO₂ every 5 minutes", "Send priority report to flight surgeon"],
  },
  {
    id: "co2", title: "High CO₂ (scrubber failure)",
    when: "CO₂ above 3 mmHg, headaches, shortness of breath, poor concentration.",
    steps: ["Confirm the reading on a second sensor", "Switch on the backup CO₂ removal system", "Move crew to the best-ventilated module", "Avoid strenuous exercise until CO₂ falls", "Log symptoms for each crew member", "Send report to Earth"],
  },
  {
    id: "chest", title: "Chest pain / irregular heartbeat",
    when: "Pressure in the chest, palpitations, shortness of breath.",
    steps: ["Stop activity and rest", "Measure HR, BP, SpO₂; record ECG if available", "Give oxygen if SpO₂ under 94%", "CMO follows the cardiac protocol in the medical kit", "Send priority report to flight surgeon"],
  },
  ...SPECIALIZED_EMERGENCIES,
];

export const CHECKLISTS = [
  {
    id: "preEva", title: "Before a spacewalk",
    items: ["Slept 7+ hours last night", "Reaction self-test normal in the last 4 days", "Well hydrated (500 mL in last hour)", "No headache, nausea or dizziness", "SpO₂ 95% or higher", "Completed oxygen prebreathe protocol", "Suit biomedical sensors connected"],
  },
  {
    id: "postEva", title: "After a spacewalk",
    items: ["No joint pain or tingling", "No skin rash or itching", "No confusion or vision change", "Logged EVA duration and dosimeter reading", "Rehydrated"],
  },
  {
    id: "landing", title: "Landing / gravity transition readiness",
    items: ["Fluid loading done before landing (salt tablets + water)", "Compression garment on", "Can stand up without dizziness", "Balance test done after landing", "Can walk a straight line", "Can self-exit the vehicle", "No nausea when turning the head"],
  },
];

export const COPING = [
  "Write in your private journal: NASA uses journaling to support crews in isolation.",
  "Tend the plants: growing food in space may ease the feeling of confinement.",
  "Spend time at a window: views reduce monotony.",
  "Play a recorded message from family.",
  "Keep a regular sleep window and use the sleep lighting.",
  "Plan a shared crew meal or game night.",
];
