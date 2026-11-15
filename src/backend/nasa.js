// NASA Human Research Program content, summarized from the challenge resources (docs/RESEARCH.md).
// "tracks" = pages in Space App Med that monitor or counter each risk.

const R = "https://www.nasa.gov/reference/";

export const HAZARDS = [
  {
    id: "radiation", name: "Space radiation", icon: "☢",
    summary: "Invisible and unfelt. Galactic cosmic rays and solar storms raise cancer risk and can affect the brain, heart and eyes.",
    facts: ["Earth's magnetosphere largely shields the planet; beyond it crews are exposed to galactic cosmic rays and solar storms", "Radiation increases cancer risk, can damage the central nervous system and alter cognitive and motor function", "Neutrons are about 30% of ISS radiation (CSA)"],
    url: "https://www.nasa.gov/hrp/hazard-space-radiation/",
  },
  {
    id: "isolation", name: "Isolation and confinement", icon: "🧠",
    summary: "Small crews living in a small space for months: sleep loss, circadian disruption and workload can harm mood, teamwork and performance.",
    facts: ["NASA is building behavioral-health monitoring to catch early risk factors", "Journaling, plants and windows help", "Analogs: HERA (45 days) and CHAPEA (1 year)"],
    url: "https://www.nasa.gov/hrp/hazard-isolation-and-confinement/",
  },
  {
    id: "distance", name: "Distance from Earth", icon: "🛰",
    summary: "Mars is on average 140 million miles away. Help, supplies and medical care from Earth are slow or impossible.",
    facts: ["Up to 20 minutes one-way communication delay", "Roughly 3-year Mars mission", "Crews must handle medical problems themselves"],
    url: "https://www.nasa.gov/hrp/hazard-distance-from-earth/",
  },
  {
    id: "gravity", name: "Gravity fields", icon: "🦴",
    summary: "Weightlessness and changes between gravity fields affect bones, muscles, balance, the heart and the eyes.",
    facts: ["Weight-bearing bones lose on average 1–1.5% of mineral density per month", "Fluids shift toward the head and may put pressure on the eyes", "Dehydration + calcium from bones raise kidney stone risk"],
    url: "https://www.nasa.gov/hrp/hazard-gravity-fields/",
  },
  {
    id: "hostile", name: "Hostile / closed environments", icon: "🏠",
    summary: "The spacecraft is home and machine: temperature, pressure, CO₂, noise, lighting and microbes all matter.",
    facts: ["Microbes can change characteristics in space and transfer more easily between crew", "Stress hormones can rise and the immune system can change", "CO₂ above 3 mmHg (1-hour average) is over NASA's limit (NASA-STD-3001)"],
    url: "https://www.nasa.gov/hrp/hazard-hostile-closed-environments/",
  },
];

export const RISKS = [
  { id: "immune", name: "Altered immune system responses", hazards: ["radiation", "hostile", "isolation"], summary: "Stress can wake dormant viruses (cold sores, shingles) and cause rashes, allergies and infections.", countermeasures: ["Symptom tracking", "Hygiene", "Sleep and stress management"], tracks: ["checkin", "photos", "medguide"], url: `${R}risk-of-altered-immune-system-responses/` },
  { id: "sensorimotor", name: "Altered sensorimotor and vestibular function", hazards: ["gravity"], summary: "Motion sickness, poor coordination and dizziness during gravity changes. Most astronauts get space motion sickness.", countermeasures: ["Medication", "Training", "Recovery time before critical tasks"], tracks: ["checks", "checkin", "checklists"], url: `${R}risk-of-altered-sensorimotor-and-vestibular-function/` },
  { id: "cardio", name: "Cardiovascular adaptations", hazards: ["gravity", "radiation"], summary: "Blood clots, arrhythmias and low blood pressure that raises fainting risk at landing.", countermeasures: ["Exercise", "Diet", "Compression garments and fluid loading before landing"], tracks: ["checkin", "checks", "trends", "emergency"], url: `${R}risk-of-cardiovascular-adaptations/` },
  { id: "dcs", name: "Decompression sickness", hazards: ["hostile"], summary: "Nitrogen bubbles when moving from the cabin to a lower-pressure suit.", countermeasures: ["Oxygen prebreathe", "Lower-pressure habitats", "Variable-pressure suits (in development)"], tracks: ["checklists", "medguide", "emergency"], url: `${R}risk-of-decompression-sickness/` },
  { id: "microbes", name: "Host-microorganism interactions", hazards: ["hostile"], summary: "Skin and gut microbes change and some become more virulent in space.", countermeasures: ["Disinfectants", "Anti-inflammatories and antibiotics (under study)", "Monitoring microbes"], tracks: ["checkin", "medkit"], url: `${R}risk-of-host-microorganism-interactions/` },
  { id: "hypoxia", name: "Hypoxia", hazards: ["hostile"], summary: "Reduced-pressure habitats for frequent spacewalks raise the risk of mild hypoxia: headache, confusion, poor sleep.", countermeasures: ["Balancing O₂ and pressure", "SpO₂ monitoring"], tracks: ["checkin", "habitat", "emergency"], url: `${R}risk-of-hypoxia/` },
  { id: "nutrition", name: "Inadequate food and nutrition", hazards: ["distance"], summary: "Food must last years without resupply; menu fatigue can lead to eating less.", countermeasures: ["Varied, crew-selected menus", "Enhanced diet"], tracks: ["checkin", "trends"], url: `${R}risk-of-inadequate-food-and-nutrition/` },
  { id: "eva", name: "Injury and compromised performance from spacewalks", hazards: ["hostile", "gravity"], summary: "Fatigue, injury, DCS, low O₂ and high CO₂ during more frequent, longer spacewalks.", countermeasures: ["Prebreathe protocols", "Fitness", "Suit biomedical monitoring"], tracks: ["checklists", "checks"], url: `${R}risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/` },
  { id: "fitness", name: "Reduced cardiorespiratory and musculoskeletal fitness", hazards: ["gravity"], summary: "Average strength and aerobic losses of 10–12%; 12–38% of ISS crew lose over 20%.", countermeasures: ["1.5 h of exercise a day, 6–7 days a week", "Periodic fitness self-tests"], tracks: ["log", "quests", "trends"], url: `${R}risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/` },
  { id: "sans", name: "Spaceflight Associated Neuro-ocular Syndrome (SANS)", hazards: ["gravity"], summary: "Fluid moving toward the head can cause optic nerve swelling, folds in the retina and flattening of the back of the eye. About 70% of ISS astronauts experience some swelling in the back of their eyes. Near vision often worsens (SANS review).", countermeasures: ["Vision monitoring", "B-vitamin supplement (under study)", "Thigh cuffs (under study)"], tracks: ["checks", "medkit"], url: `${R}risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/` },
  { id: "bone", name: "Spaceflight-induced bone changes", hazards: ["gravity"], summary: "Weight-bearing bones lose 1–1.5% density per month, raising fracture and osteoporosis risk.", countermeasures: ["Resistive exercise", "Bisphosphonates", "Diet"], tracks: ["log", "medkit", "body"], url: `${R}risk-of-spaceflight-induced-bone-changes/` },
  { id: "behavior", name: "Behavioral conditions and psychiatric disorders", hazards: ["isolation", "distance"], summary: "Anxiety and depression affect sleep, morale and decisions; support from Earth is delayed.", countermeasures: ["Journaling", "Plants and windows", "Privacy", "Family contact"], tracks: ["mind", "checkin"], url: `${R}risk-of-behavioral-conditions-and-psychiatric-disorders/` },
  { id: "teamwork", name: "Inadequate teamwork", hazards: ["isolation", "distance"], summary: "Conflict and miscommunication in a small crew far from help.", countermeasures: ["Selecting a crew that works well together", "Recovering quickly after setbacks and conflicts"], tracks: ["crew", "quests"], url: `${R}risk-of-inadequate-teamwork/` },
  { id: "sleep", name: "Inadequate sleep and irregular schedules", hazards: ["isolation"], summary: "Work overload and irregular light cycles (16 sunrises a day on the ISS) disrupt sleep and alertness.", countermeasures: ["LED lighting that mimics day/night", "Caffeine management", "Scheduled rest"], tracks: ["checkin", "checks", "trends"], url: `${R}risk-from-inadequate-sleep-and-irregular-schedules/` },
  { id: "systems", name: "Inadequate systems operations support", hazards: ["distance"], summary: "Without real-time Mission Control, crews need tools they can use on their own.", countermeasures: ["User-friendly, self-explanatory systems", "Training"], tracks: ["today", "medguide", "learn"], url: `${R}risk-of-inadequate-systems-operations-support/` },
  { id: "loads", name: "Injury from dynamic loads", hazards: ["gravity"], summary: "Landing injuries made worse by bone loss and disorientation; on the Moon and Mars, crews must self-egress.", countermeasures: ["Seat and restraint design", "Fitness"], tracks: ["checklists", "checks"], url: `${R}risk-of-injury-from-dynamic-loads/` },
  { id: "cancer", name: "Radiation-induced cancers", hazards: ["radiation"], summary: "Higher lifetime cancer risk; also central nervous system and degenerative effects.", countermeasures: ["Shielding (Artemis, lunar Gateway)", "Continuous dose monitoring", "600 mSv career limit (NASA-STD-3001)", "250 mSv per solar particle event (NASA-STD-3001)"], tracks: ["radiation"], url: `${R}risk-of-radiation-induced-cancers/` },
];

// The challenge's guiding questions, answered by the app
export const GUIDING_QUESTIONS = [
  {
    q: "Which measurements can be performed in space?",
    a: "Heart rate, blood pressure, SpO₂, temperature, glucose (fingerstick), body mass (spring-based device), sleep and activity (wrist actigraphy), dosimeter readings, vision checks, cognitive tests like NASA's Reaction Self-Test, mood surveys, and photos. Space App Med collects all of these, plus camera-based pulse and screen-based vision tests.",
  },
  {
    q: "Why is an exam needed?",
    a: "Every measurement maps to a NASA Human Research Program risk. Examples: blood pressure for cardiovascular adaptation and landing fainting, vision tests for SANS (about 70% of ISS astronauts), reaction tests for sleep loss, dose for radiation cancer risk. See the risk table in Learn.",
  },
  {
    q: "How do spaceflight hazards affect these indicators?",
    a: "Each indicator lists the hazards that move it. Weightlessness shifts fluid (BP, vision, face swelling) and weakens bone and muscle; isolation lowers sleep and mood; radiation adds dose every day; closed cabins raise CO₂ and infection risk.",
  },
  {
    q: "When might a result warrant attention?",
    a: "Green: fine. Yellow: self-care plus recheck, with the action shown. Red: notify the crew medical officer and flight surgeon (automatic for red readings). Some situations are immediate: decompression symptoms, solar storms, fainting, low oxygen, chest pain, high CO₂ (Emergency protocols). Many checks compare you to your own baseline, because NASA notes effects vary between astronauts.",
  },
  {
    q: "What actions can prevent a critical condition?",
    a: "NASA countermeasures built into quests and guidance: 1.5 hours of exercise a day, 6–7 days a week; hydration against kidney stones; LED lighting and caffeine management for sleep; B vitamins and thigh cuffs (under study) for SANS; bisphosphonates for bone; compression garments and fluids before landing; journaling, windows, plants and privacy; radiation shielding and dose monitoring; CO₂ below NASA's 3 mmHg limit; oxygen prebreathe before spacewalks. (The 2 L/day water goal is a general health target, not a NASA figure.)",
  },
];

export const SOURCES = [
  { label: "Challenge: Create Health Monitoring Software for Astronauts", url: "https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/" },
  { label: "NASA HRP: 5 Hazards of Human Spaceflight", url: "https://www.nasa.gov/hrp/hazards/" },
  { label: "NASA HRP: Risks of Human Spaceflight", url: "https://www.nasa.gov/hrp/risks/" },
  { label: "NASA HRP: Ongoing research (Standard Measures, ARCHeR, CIPHER, B-Complex, Thigh Cuff)", url: "https://www.nasa.gov/hrp/ongoing-hrp-research/" },
  { label: "Law et al. (NASA), J Occup Environ Med 56(5):477–483, 2014: CO₂ and headaches on the ISS", url: "https://www.sciencedaily.com/releases/2014/05/140501100922.htm" },
  { label: "CSA: Monitoring radiation for astronaut health", url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" },
  { label: "CSA: Why do we conduct science experiments in space?", url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp" },
  { label: "NASA OCHMO: Radiation protection technical brief (600 mSv limit)", url: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf" },
  { label: "NASA OCHMO: Carbon dioxide technical brief (3 mmHg limit)", url: "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf" },
  { label: "NASA Spinoff: Reaction Self-Test (PVT) on the ISS", url: "https://spinoff.nasa.gov/Spinoff2013/hm_1.html" },
  { label: "SANS review (near vision / hyperopic shift)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7005826/" },
  { label: "Curiosity RAD: Mars cruise and surface dose", url: "https://www.space.com/23875-mars-radiation-life-manned-mission.html" },
  { label: "Chang'e-4 LND: Moon surface dose", url: "https://www.sciencedaily.com/releases/2020/09/200926145212.htm" },
];
