// Screen groupings reuse the app's existing indicators, symptoms and checks.
export const HEALTH_AREAS = {
  brain: {
    title: "Head and mental wellbeing",
    short: "Brain",
    icon: "brain",
    description: "Sleep, stress, mood and alertness",
    symptoms: ["headache", "nausea", "dizzy", "lowmood"],
    tools: [
      ["mind", "Journal and support", "journal"],
      ["checkin", "Daily check-in", "today"],
    ],
  },
  eyes: {
    title: "Eyes and vision",
    short: "Eyes",
    icon: "eyes",
    description: "Near vision and changes in what you see",
    symptoms: ["vision"],
    tools: [["photos", "Eye photo log", "camera"]],
  },
  vestibular: {
    title: "Hearing and balance",
    short: "Balance",
    icon: "body",
    description: "Hearing, motion sickness and coordination",
    symptoms: ["nausea", "dizzy"],
    tools: [["checklists", "Landing checklists", "today"]],
  },
  heart: {
    title: "Heart and circulation",
    short: "Heart",
    icon: "heart",
    description: "Pulse, blood pressure and circulation",
    symptoms: ["chest", "dizzy"],
    tools: [["log", "Activity and hydration", "exercise"]],
  },
  lungs: {
    title: "Respiratory health",
    short: "Respiratory",
    icon: "air",
    description: "Blood oxygen, breathing and cabin air",
    symptoms: ["breath", "jointpain"],
    tools: [
      ["habitat", "Cabin air readings", "air"],
      ["checklists", "Spacewalk checklists", "today"],
    ],
  },
  immune: {
    title: "Immunity and skin",
    short: "Immune system",
    icon: "shield",
    description: "Temperature, skin changes and illness",
    symptoms: ["rash", "fever"],
    tools: [
      ["photos", "Skin photo log", "camera"],
      ["medkit", "Medical supplies", "kit"],
    ],
  },
  gut: {
    title: "Nutrition and metabolism",
    short: "Nutrition",
    icon: "kit",
    description: "Body mass, glucose and meals",
    symptoms: ["nausea"],
    tools: [["log", "Meals and activity", "kit"]],
  },
  kidneys: {
    title: "Kidneys and hydration",
    short: "Kidneys",
    icon: "water",
    description: "Fluid intake and urinary symptoms",
    symptoms: ["flankpain"],
    tools: [["log", "Log water intake", "water"]],
  },
  bones: {
    title: "Bones, joints and muscles",
    short: "Joints and muscles",
    icon: "exercise",
    description: "Movement, exercise and joint or back pain",
    symptoms: ["jointpain", "backpain"],
    tools: [
      ["log", "Log a workout", "exercise"],
      ["checklists", "Spacewalk checklists", "today"],
    ],
  },
  wholeBody: {
    title: "Radiation exposure",
    short: "Radiation",
    icon: "radiation",
    description: "Personal dose and storm protection",
    symptoms: [],
    tools: [["radiation", "Dose and storm shelter", "sun"]],
  },
};

export const SLEEP_QUALITY = ["Poor", "Fair", "Good", "Restful"];
export const areaPage = (part) => "body-" + part;
