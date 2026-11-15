export const EMERGENCY_SOURCES = {
  packs:
    "https://www.nasa.gov/wp-content/uploads/2015/03/medical_kit_checklist_-_full_release.pdf",
  contamination:
    "https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf",
  eye: "https://jts.health.mil/assets/docs/cpgs/Eye_Trauma_Initial_Care_01_Jun_2021_ID03.pdf",
  renal: "https://www.nasa.gov/ochmo-mtb-003-urinary-health-2/",
  renalSymptoms:
    "https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/symptoms-causes",
  dental: "https://www.mouthhealthy.org/dental-care/dental-emergencies",
  cpr: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7607644/",
};

export const MEDICAL_PACKS = {
  EMTP: {
    color: "red",
    label: "Red EMTP",
    name: "Emergency Medical Treatment Pack",
    drawer: "Medical rack · drawer E1",
  },
  CMP: {
    color: "white",
    label: "White CMP",
    name: "Convenience Medication Pack",
    drawer: "Medical rack · drawer C1",
  },
  MDP: {
    color: "blue",
    label: "Blue MDP",
    name: "Medical Diagnostic Pack",
    drawer: "Medical rack · drawer D1",
  },
  PEP: {
    color: "yellow",
    label: "Yellow PEP",
    name: "Physician Equipment Pack",
    drawer: "Medical rack · drawer P1",
  },
  MTP: {
    color: "pink",
    label: "Pink MTP",
    name: "Minor Treatment Pack",
    drawer: "Medical rack · drawer T1",
  },
  CCPK: {
    color: "green",
    label: "Green CCPK",
    name: "Crew Contamination Protection Kit · prototype color",
    drawer: "Airlock safety locker · drawer S1",
  },
};

const guide = (
  pack,
  note,
  timerSeconds = 0,
  timerLabel = "Reassessment reminder",
) => ({ pack, note, timerSeconds, timerLabel });
export const SPECIALIZED_EMERGENCIES = [
  {
    id: "ocular",
    title: "Ocular foreign body / chemical eye splash",
    when: "Chemical exposure, particles in an eye, new pain or loss of vision.",
    steps: [
      "Stop exposure, alert the CMO and identify the substance",
      "For a chemical splash, begin prompt eye irrigation under the mission procedure",
      "Have the CMO assess vision and exclude penetrating injury",
      "Prepare specialist eye equipment for the trained medical officer",
      "Record vitals, symptoms and the irrigation timeline",
      "Send a priority update and arrange ongoing eye assessment",
    ],
    stepGuides: [
      guide(
        "CCPK",
        "Contain floating droplets; avoid rubbing the eye. Retain the chemical label for the medical officer.",
      ),
      guide(
        "CCPK",
        "Use the station eyewash / eyewash goggles and fluid containment system. Suspected penetrating injury needs urgent CMO assessment; do not press on the eye or remove embedded objects.",
        1200,
        "Irrigation elapsed reminder · CMO decides when to stop",
      ),
      guide(
        "MDP",
        "Tell the CMO immediately about reduced vision, severe pain or a visible wound. The timer is a record, not permission to stop irrigation.",
      ),
      guide(
        "PEP",
        "Morgan Lens and fluorescein are clinician-directed options after examination. Do not self-insert a lens or use it for a suspected globe injury.",
      ),
      guide(
        "MDP",
        "Use the vitals form below. Add eye affected, substance, exposure time and current vision in the priority note.",
      ),
      guide(
        "EMTP",
        "Keep the CMO with the patient; send changes while the Earth link is delayed.",
      ),
    ],
    sources: ["eye", "contamination"],
  },
  {
    id: "renal",
    title: "Acute renal colic / kidney stone obstruction",
    when: "Severe side or groin pain, blood in urine, vomiting or difficulty passing urine.",
    steps: [
      "Stop work and request urgent CMO assessment",
      "Check for fever, inability to urinate and worsening symptoms",
      "Record vitals and the last urine output",
      "Prepare ultrasound and clinician-directed treatment options",
      "Reassess pain, hydration tolerance and urine output",
      "Send the priority report and agree an evacuation or continued-care plan",
    ],
    stepGuides: [
      guide(
        "EMTP",
        "The symptoms can have causes other than a stone. Keep the patient supported and attended.",
      ),
      guide(
        "MDP",
        "Fever or chills, inability to urinate, uncontrolled pain or vomiting require urgent escalation. Do not wait for a timer or an Earth reply.",
      ),
      guide(
        "MDP",
        "Record readings below. Include temperature, pain rating and urine output in the priority note.",
      ),
      guide(
        "PEP",
        "Ketorolac and tamsulosin require clinician assessment and a mission-approved prescription. Acoustic propulsion is an equipment- and training-dependent specialist option; this app does not deliver treatment.",
      ),
      guide(
        "MDP",
        "Follow the clinician's fluid plan; do not force fluids through suspected obstruction.",
        300,
        "Clinical reassessment reminder",
      ),
      guide(
        "EMTP",
        "The CMO determines whether obstruction or infection needs urgent intervention; record that decision and any resource constraints.",
      ),
    ],
    sources: ["renal", "renalSymptoms"],
  },
  {
    id: "toxic",
    title: "Toxic atmosphere — ammonia / hydrazine / smoke",
    when: "Toxic-gas alarm, suspected chemical release, smoke, or acute breathing/eye irritation.",
    steps: [
      "Raise the cabin alarm and leave the contaminated module",
      "Use the mission-approved emergency breathing equipment while evacuating",
      "Account for every crew member in a safe atmosphere",
      "Isolate and assess the source using trained spacecraft procedures",
      "Record exposed crew vitals and decontamination needs",
      "Send a priority report; re-enter only after authorized all-clear",
    ],
    stepGuides: [
      guide(
        "CCPK",
        "Follow spacecraft fire/toxic-release procedures. Do not enter the hazard area to investigate without the required protection.",
      ),
      guide(
        "EMTP",
        "Quick-Don PBA / O₂ mask selection depends on the spacecraft and contaminant. A basic oxygen mask or CCPK mask is not universal chemical protection. Use certified emergency breathing equipment and trained procedures.",
      ),
      guide(
        "MDP",
        "Report missing or symptomatic crew immediately. A pulse oximeter alone cannot rule out toxic exposure.",
        300,
        "Exposed-crew reassessment reminder",
      ),
      guide(
        "CCPK",
        "Dräger tube testing is substance-specific and performed by trained crew. CCPK PPE is inadequate for highly volatile ammonia; evacuation is required. Hydrazine and smoke need mission-specific controls.",
      ),
      guide(
        "MDP",
        "Record vitals below, exposure duration and symptoms. The CMO directs CCPK eyewash, containment and decontamination in a safe area.",
      ),
      guide(
        "EMTP",
        "Only the designated vehicle authority can clear the module after appropriate measurements. A timer or this app cannot declare the atmosphere safe.",
      ),
    ],
    sources: ["contamination"],
  },
  {
    id: "dental",
    title: "Dental avulsion / crown fracture / abscess",
    when: "A knocked-out or broken tooth, severe dental pain, swelling or suspected infection.",
    steps: [
      "Alert the CMO and check breathing, swallowing and bleeding",
      "Preserve a knocked-out permanent tooth or broken fragment",
      "Record injury time, symptoms and current vitals",
      "Prepare the dental kit for the trained clinician",
      "Reassess swelling, pain and bleeding while awaiting dental advice",
      "Send a priority report and document the definitive care plan",
    ],
    stepGuides: [
      guide(
        "EMTP",
        "Trouble breathing or swallowing, spreading facial swelling or uncontrolled bleeding requires immediate emergency escalation.",
      ),
      guide(
        "MTP",
        "Handle an avulsed tooth by the crown, avoid scrubbing the root, and keep it moist in an approved tooth-preservation medium. Get urgent dental guidance.",
      ),
      guide(
        "MDP",
        "Use the vitals form and priority note. Record the time out of the socket, tooth location, fever and associated facial injury.",
      ),
      guide(
        "PEP",
        "Cavit/IRM temporary filling material, eugenol and the extraction kit are clinician-directed resources. Do not attempt an extraction, abscess drainage or place chemicals directly on tissue yourself.",
      ),
      guide(
        "MTP",
        "Follow the CMO's care plan and report deterioration immediately. This reminder does not delay urgent treatment.",
        300,
        "Dental reassessment reminder",
      ),
      guide(
        "EMTP",
        "Record remote dental consultation, any approved intervention and follow-up. A temporary filling does not resolve an abscess.",
      ),
    ],
    sources: ["dental"],
  },
];

const ORIGINAL_PACK_MAP = {
  dcs: ["EMTP", "EMTP", "EMTP", "MTP", "MDP", "EMTP"],
  spe: ["CCPK", "MDP", "CCPK", "CCPK", "MDP"],
  faint: ["EMTP", "MTP", "MDP", "CMP", "MDP", "EMTP"],
  hypoxia: ["EMTP", "MDP", "EMTP", "MDP", "EMTP"],
  co2: ["MDP", "CCPK", "CCPK", "MTP", "MDP", "EMTP"],
  chest: ["EMTP", "MDP", "EMTP", "PEP", "EMTP"],
};

export function protocolStepGuide(def, index) {
  if (!def || !Number.isInteger(index) || !def.steps?.[index]) return null;
  if (def.stepGuides?.[index]) return def.stepGuides[index];
  const pack = ORIGINAL_PACK_MAP[def.id]?.[index] || "MDP";
  const timers = { "dcs:4": 900, "faint:4": 3600, "hypoxia:3": 300 };
  return guide(
    pack,
    "Pack association and drawer are prototype staging aids. Confirm the actual vehicle inventory and follow the CMO's approved procedure.",
    timers[`${def.id}:${index}`] || 0,
  );
}

export const CPR_BPM = 110;
export const CPR_METHODS = [
  {
    id: "handstand",
    title: "Zero-G handstand",
    instruction:
      "With the patient secured on the CMRS, a trained rescuer braces their feet against the opposite wall and uses the arms to compress the chest. Feasibility depends on cabin span and rescuer height.",
  },
  {
    id: "bearhug",
    title: "Reverse bear-hug",
    instruction:
      "A trained rescuer positions behind the patient, encircling the chest to apply compressions. This is an immediate-access technique when restraint is not yet available; compression quality can be limited.",
  },
  {
    id: "cmrs",
    title: "CMRS waist-restraint",
    instruction:
      "Secure the patient on the Crew Medical Restraint System. Secure the trained rescuer at the waist and lower legs alongside the patient, then use the approved chest-compression technique.",
  },
];

export function timerRemaining(timer, now = Date.now()) {
  if (!timer) return 0;
  return Math.max(
    0,
    Math.ceil(
      (timer.running ? timer.deadline - now : timer.remainingMs) / 1000,
    ),
  );
}
export function codeElapsed(record, now = Date.now()) {
  return Math.max(
    0,
    Math.floor(
      ((record?.elapsedMs || 0) +
        (record?.running ? now - record.startedAt : 0)) /
        1000,
    ),
  );
}
export function formatDuration(seconds) {
  return `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
}
