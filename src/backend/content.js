// Static content used by the backend: environments, quests, badges, med guide, emergencies, checklists.
// Sources for numbers are listed in docs/RESEARCH.md.

export const ENVIRONMENTS = {
  iss: {
    label: "ISS (low Earth orbit)", gravity: "Microgravity", doseRate: 0.4, delayMin: 0,
    focus: ["bones", "eyes", "brain"],
    note: "Inside Earth's magnetic field. Mission Control is a call away.",
  },
  transit: {
    label: "Mars transit", gravity: "Microgravity", doseRate: 1.8, delayMin: 14,
    focus: ["wholeBody", "bones", "eyes", "brain"],
    note: "Outside the magnetosphere: highest radiation. Earth delay 4–24 min one way.",
  },
  moon: {
    label: "Moon base", gravity: "1/6 g", doseRate: 1.4, delayMin: 0.02,
    focus: ["wholeBody", "lungs", "bones"],
    note: "No magnetic field or atmosphere. Frequent spacewalks: watch for decompression sickness.",
  },
  mars: {
    label: "Mars base", gravity: "3/8 g", doseRate: 0.65, delayMin: 14,
    focus: ["bones", "brain", "wholeBody"],
    note: "Partial gravity after months weightless: balance and fainting risks after landing.",
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
  { id: "nausea", label: "Nausea / motion sickness", part: "brain" },
  { id: "dizzy", label: "Dizziness or lightheaded", part: "heart" },
  { id: "rash", label: "Rash or cold sore", part: "immune" },
  { id: "sorethroat", label: "Sore throat / congestion", part: "immune" },
  { id: "jointpain", label: "Joint pain or tingling (after EVA)", part: "lungs" },
  { id: "backpain", label: "Back pain", part: "bones" },
  { id: "flankpain", label: "Flank pain / dark urine", part: "kidneys" },
  { id: "breath", label: "Short of breath", part: "lungs" },
  { id: "chest", label: "Chest pain or palpitations", part: "heart" },
  { id: "anxious", label: "Anxious, low or irritable", part: "brain" },
];

// Daily quests. "check" receives the context built in rules.js and returns true when done.
export const QUESTS = [
  { id: "checkin", label: "Complete your daily check-in", points: 20, check: (c) => c.checkedIn },
  { id: "exercise", label: "Exercise 90 minutes", points: 30, check: (c) => c.row.exercise >= 90 },
  { id: "water", label: "Drink at least 2 L of water", points: 15, check: (c) => c.row.water >= 2 },
  { id: "sleep", label: "Sleep 7+ hours", points: 15, check: (c) => c.row.sleep >= 7 },
  { id: "journal", label: "Write a journal entry", points: 10, check: (c) => c.journaledToday },
  { id: "vision", label: "Weekly vision self-check", points: 10, weekly: true, check: (c) => c.visionThisWeek },
];

export const BADGES = [
  { id: "streak7", label: "7-day check-in streak", test: (c) => c.streak >= 7 },
  { id: "streak30", label: "30-day check-in streak", test: (c) => c.streak >= 30 },
  { id: "iron", label: "Iron bones: 5 days of 90+ min exercise", test: (c) => c.exerciseDays >= 5 },
  { id: "hydro", label: "Hydro hero: 5 days of 2+ L water", test: (c) => c.waterDays >= 5 },
  { id: "writer", label: "Captain's log: 3 journal entries", test: (c) => c.journalCount >= 3 },
  { id: "shelter", label: "Storm survivor: sheltered during a solar event", test: (c) => c.sheltered },
];

// Symptom guides: self-care, when to escalate. Not medical advice.
export const MED_GUIDE = [
  {
    id: "headache", title: "Headache", part: "brain",
    causes: ["Fluid shift toward the head", "High cabin CO₂", "Poor sleep or dehydration", "Mild hypoxia in low-pressure habitats"],
    selfCare: ["Drink 500 mL of water", "Check cabin CO₂ reading and move to a ventilated area", "Rest 30 minutes, then recheck"],
    escalate: ["Sudden, severe 'worst ever' headache", "Headache with vision change, confusion or weakness", "SpO₂ below 92%"],
  },
  {
    id: "vision", title: "Blurry or changed vision", part: "eyes",
    causes: ["Spaceflight Associated Neuro-ocular Syndrome (SANS)", "Fluid shift raising pressure behind the eye"],
    selfCare: ["Do the vision self-check (near and far chart)", "Use the adjustable-focus glasses if issued", "Log it in your check-in"],
    escalate: ["Any new or worsening vision change: report to CMO and flight surgeon for an eye exam/ultrasound"],
  },
  {
    id: "nausea", title: "Nausea / motion sickness", part: "brain",
    causes: ["Space motion sickness (most astronauts in the first days)", "Gravity transition (landing on Moon/Mars, return to Earth)"],
    selfCare: ["Keep head movements slow", "Fix your eyes on a stable 'up' reference", "Use the anti-nausea medication in the kit per label"],
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
    selfCare: ["Keep the area clean and dry", "Avoid sharing items with crewmates", "Use antiviral cream from the kit if prescribed"],
    escalate: ["Painful band-like rash (possible shingles)", "Rash with fever", "Spreading or infected skin"],
  },
  {
    id: "fever", title: "Fever or sore throat", part: "immune",
    causes: ["Infection (microbes can be more virulent in space)", "Immune changes"],
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
    causes: ["Spine lengthens up to 3% in weightlessness", "Muscle deconditioning"],
    selfCare: ["Curl into a fetal position to stretch the spine", "Core exercises in your routine"],
    escalate: ["Pain with numbness or weakness in the legs", "Pain after an impact or landing"],
  },
  {
    id: "flankpain", title: "Flank pain / dark urine", part: "kidneys",
    causes: ["Kidney stone risk from calcium lost from bone plus dehydration"],
    selfCare: ["Drink at least 2–3 L of water today", "Log your fluid intake"],
    escalate: ["Severe one-sided pain", "Blood in urine", "Pain with fever"],
  },
  {
    id: "breath", title: "Short of breath", part: "lungs",
    causes: ["Mild hypoxia in reduced-pressure cabins", "High CO₂", "Deconditioning"],
    selfCare: ["Check SpO₂ and cabin O₂/CO₂ readings", "Rest and slow your breathing"],
    escalate: ["SpO₂ under 92%", "Chest pain", "Confusion or blue lips: start the Low oxygen protocol"],
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
    id: "chest", title: "Chest pain / irregular heartbeat",
    when: "Pressure in the chest, palpitations, shortness of breath.",
    steps: ["Stop activity and rest", "Measure HR, BP, SpO₂; record ECG if available", "Give oxygen if SpO₂ under 94%", "CMO follows the cardiac protocol in the medical kit", "Send priority report to flight surgeon"],
  },
];

export const CHECKLISTS = [
  {
    id: "preEva", title: "Before a spacewalk",
    items: ["Slept 7+ hours last night", "Well hydrated (500 mL in last hour)", "No headache, nausea or dizziness", "SpO₂ 95% or higher", "Completed oxygen prebreathe protocol", "Suit biomedical sensors connected"],
  },
  {
    id: "postEva", title: "After a spacewalk",
    items: ["No joint pain or tingling", "No skin rash or itching", "No confusion or vision change", "Logged EVA duration and dosimeter reading", "Rehydrated"],
  },
  {
    id: "landing", title: "Landing / gravity transition readiness",
    items: ["Fluid loading done before landing", "Compression garment on", "Can stand up without dizziness", "Can walk a straight line", "Can self-exit the vehicle", "No nausea when turning the head"],
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
