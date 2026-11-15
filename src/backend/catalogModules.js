import { getState, update } from "./store.js";
import { setSandboxMode, saveSandboxRecord } from "./sandbox.js";
import { setChartPreferences } from "./trendModel.js";
import { setJudgeDelay } from "./earthQueue.js";
import { setDisplay } from "../display.js";
import { saveClinicalRecord } from "./clinicalStore.js";

const number = (key, label, initial, min, max, step = "any") => ({
  key,
  label,
  type: "number",
  initial,
  min,
  max,
  step,
});
const text = (key, label, initial = "") => ({
  key,
  label,
  type: "textarea",
  initial,
});
const select = (key, label, options, initial = options[0]) => ({
  key,
  label,
  type: "select",
  options,
  initial,
});
const rounded = (n, places = 1) => Number(n.toFixed(places));
const shipTime = (hours) => {
  const minutes = ((Math.round(hours * 60) % 1440) + 1440) % 1440;
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
};
const result = (headline, metrics, explanation) => ({
  headline,
  metrics,
  explanation,
});
const metric = (label, value) => ({ label, value: String(value) });
const toolId = (title) =>
  "tool-" +
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const route = (id, targetRoute, params = {}, launchNotice = "", action) => ({
  id,
  targetRoute,
  params,
  launchNotice,
  action,
  standalone: false,
});
const tool = (id, area, title) =>
  route(id, "body-" + area, { catalogFocus: toolId(title) });
const simulation = (id, title, fields, calculate, note, extra = {}) => ({
  id,
  title,
  targetRoute: "catalog",
  standalone: true,
  params: {},
  fields,
  calculate,
  note,
  ...extra,
});
const note =
  "Local prototype calculation using the values you enter. It is not a diagnosis, treatment recommendation, certified device or autonomous clinical decision.";

export const CATALOG_MODULES = [
  route(
    901,
    "body",
    { catalogFocus: "body-anatomy" },
    "Opens the existing interactive 2.5D body map in Organ Systems mode.",
    () =>
      update((s) => {
        s.settings.bodyMapLayer = "organs";
      }),
  ),
  route(902, "learn"),
  route(903, "today", { catalogFocus: "health-summary" }),
  route(904, "trends", {
    indicator: "heartRate",
    catalogFocus: "health-trend-chart",
  }),
  route(
    905,
    "trends",
    { indicator: "heartRate", catalogFocus: "health-trend-chart" },
    "Selects the spaceflight-adapted screening comparison for your heart-rate chart.",
    (pid) => setChartPreferences(pid, "heartRate", { mode: "adapted" }),
  ),
  route(
    906,
    "medguide",
    {},
    "Enables Private Sandbox before opening the symptom checker. New entries stay private unless you choose to share an escalation.",
    () => setSandboxMode(true),
  ),
  route(907, "today", { catalogFocus: "health-summary" }),
  simulation(
    908,
    "Offline structured triage rehearsal",
    [
      select("symptom", "Main concern", [
        "Headache",
        "Breathlessness",
        "Chest pain",
        "Rash",
      ]),
      select("severity", "Severity", ["Mild", "Moderate", "Severe"]),
      number("hours", "Hours since onset", 1, 0, 720),
      text("context", "What changed or happened?"),
    ],
    (v) =>
      result(
        v.symptom === "Chest pain" || v.severity === "Severe"
          ? "Prompt medical-officer review"
          : "Prepare a symptom review",
        [
          metric("Concern", v.symptom),
          metric("Duration", v.hours + " h"),
          metric("Reported severity", v.severity),
        ],
        "Record onset, associated changes and available vitals. Use Emergency for an active emergency. This is a transparent rule-based rehearsal, not an installed LLM or differential diagnosis.",
      ),
    note,
  ),
  simulation(
    909,
    "Bayesian evidence teaching calculator",
    [
      number("prior", "Hypothetical prior probability (%)", 10, 0.01, 99.99),
      number("sensitivity", "Assumed test sensitivity (%)", 80, 0.01, 99.99),
      number("specificity", "Assumed specificity (%)", 90, 0.01, 99.99),
      select("test", "Hypothetical result", ["Positive", "Negative"]),
    ],
    (v) => {
      const p = v.prior / 100,
        sensitivity = v.sensitivity / 100,
        specificity = v.specificity / 100;
      const a = v.test === "Positive" ? sensitivity : 1 - sensitivity,
        b = v.test === "Positive" ? 1 - specificity : specificity;
      return result(
        "Illustrative posterior probability",
        [
          metric(
            "Posterior",
            rounded((100 * p * a) / (p * a + (1 - p) * b), 2) + "%",
          ),
          metric("Likelihood ratio", rounded(a / b, 2)),
        ],
        "Bayes rule: posterior odds = prior odds × likelihood ratio. These user-entered assumptions are not validated for any disease or for spaceflight.",
      );
    },
    note,
  ),
  route(910, "emergency"),
  route(911, "checks", { check: "ar-ocular", catalogFocus: "ar-guides" }),
  simulation(
    912,
    "ONSD image calibration worksheet",
    [
      number("pixels", "Manually marked sheath width (pixels)", 40, 1, 2000),
      number("scale", "Image calibration (pixels/mm)", 8, 0.1, 1000),
      number("baseline", "Prior clinician-measured width (mm)", 4.8, 0.1, 20),
      select("eye", "Eye", ["Left", "Right"]),
    ],
    (v) =>
      result(
        "Manual calibrated width",
        [
          metric(v.eye + " eye", rounded(v.pixels / v.scale, 2) + " mm"),
          metric(
            "Change from entered baseline",
            rounded(v.pixels / v.scale - v.baseline, 2) + " mm",
          ),
        ],
        "No image is analyzed by AI. Only a qualified operator can establish the imaging plane and interpret ONSD; this arithmetic worksheet cannot detect SANS.",
      ),
    note,
  ),
  simulation(
    913,
    "Bladder ellipsoid volume worksheet",
    [
      number("width", "Measured width (cm)", 6, 0.1, 30),
      number("height", "Measured height (cm)", 5, 0.1, 30),
      number("depth", "Measured depth (cm)", 7, 0.1, 30),
    ],
    (v) =>
      result(
        "Geometric volume estimate",
        [
          metric(
            "0.52 × width × height × depth",
            rounded(0.52 * v.width * v.height * v.depth) + " mL",
          ),
        ],
        "An ellipsoid approximation from manually entered dimensions, not ultrasound image analysis. Irregular shapes and measurement technique can cause substantial error; obtain clinical interpretation.",
      ),
    note,
    {
      source: {
        title: "ACEP: bladder-volume measurement limitations",
        url: "https://www.acep.org/emultrasound/newsroom/may-2022/pocus-for-bladder-assessment-and-volume-technique-tips-and-role-in-system-wide-use/",
      },
    },
  ),
  route(914, "checks", { check: "hr" }),
  route(
    915,
    "checks",
    { check: "ar-pupil", catalogFocus: "ar-guides" },
    "Opens manual alignment rings. The prototype does not diagnose nystagmus or measure pupil reactivity.",
  ),
  route(916, "checks", { check: "amsler" }),
  simulation(
    917,
    "Retinal vessel tracing worksheet",
    [
      number("path", "Manually traced vessel length (pixels)", 120, 1, 5000),
      number("chord", "Straight endpoint distance (pixels)", 100, 1, 5000),
      select("eye", "Eye", ["Left", "Right"]),
    ],
    (v) => {
      if (v.path < v.chord)
        throw new Error(
          "Traced path cannot be shorter than its straight endpoint distance.",
        );
      return result(
        "Manual geometric tortuosity ratio",
        [metric(v.eye + " trace/chord", rounded(v.path / v.chord, 3))],
        "A ratio of 1 means a straight trace. This is not automated retinal analysis and no clinical screening threshold is applied.",
      );
    },
    note,
  ),
  route(918, "today", { catalogFocus: "quick-pulse" }),
  simulation(
    919,
    "Facial fatigue observation log",
    [
      number("fatigue", "Self-rated fatigue (0–10)", 3, 0, 10, 1),
      number("eye", "Eye strain (0–10)", 2, 0, 10, 1),
      number("sleep", "Last night sleep (hours)", 7, 0, 24),
      text("observation", "Your own observation, in your words"),
    ],
    (v) =>
      result(
        "Self-observation recorded",
        [
          metric("Fatigue", v.fatigue + "/10"),
          metric("Eye strain", v.eye + "/10"),
          metric("Sleep", v.sleep + " h"),
        ],
        "No camera-based emotion inference is performed. Changes in facial appearance cannot establish mood or medical status; compare your own observations over time.",
      ),
    note,
  ),
  route(920, "today", { catalogFocus: "motor-readiness" }),
  route(921, "today", { catalogFocus: "quick-pulse" }),
  simulation(
    922,
    "Hands-free clinical note",
    [
      select("topic", "Note topic", [
        "Symptoms",
        "Vitals",
        "Task handoff",
        "Wellbeing",
      ]),
      text("note", "Clinical note / dictation transcript"),
    ],
    (v) => {
      if (!v.note.trim())
        throw new Error("Dictate or type a note before saving.");
      return result(
        "Local note prepared",
        [
          metric("Topic", v.topic),
          metric("Words", v.note.trim().split(/\s+/).length),
        ],
        v.note,
      );
    },
    "Microphone use is optional. Browser speech recognition may use the browser vendor’s online service. Typing works completely offline; this tool does not send a medical report.",
    { widget: "dictation" },
  ),
  route(
    923,
    "trends",
    { indicator: "headache", catalogFocus: "health-trend-chart" },
    "Selects recorded headache observations with the Cabin CO₂ overlay. Missing symptom checks remain missing.",
    (pid) =>
      setChartPreferences(pid, "headache", {
        mode: "personal",
        overlay: "co2",
      }),
  ),
  simulation(
    924,
    "Radiation and lymphocyte paired observation",
    [
      number("dose", "Recorded interval dose (mSv)", 2, 0, 10000),
      number("before", "Earlier lymphocyte count (×10⁹/L)", 2, 0.01, 100),
      number("after", "Later lymphocyte count (×10⁹/L)", 1.8, 0.01, 100),
      number("days", "Days between samples", 7, 1, 365),
    ],
    (v) =>
      result(
        "Observed paired change",
        [
          metric(
            "Lymphocyte change",
            rounded((100 * (v.after - v.before)) / v.before) + "%",
          ),
          metric(
            "Average recorded dose",
            rounded(v.dose / v.days, 3) + " mSv/day",
          ),
        ],
        "This displays two observations, not a depletion predictor. Infection, medication, timing and other factors may affect counts; radiation causation cannot be inferred.",
      ),
    note,
  ),
  simulation(
    925,
    "Sleep and reaction-time scenario",
    [
      number("sleep", "Planned sleep (h/night)", 7, 0, 12),
      number("target", "Personal sleep target (h)", 8, 1, 12),
      number("reaction", "Observed reaction-time baseline (ms)", 250, 50, 2000),
      number("effect", "Hypothetical penalty per lost hour (%)", 3, 0, 25),
    ],
    (v) =>
      result(
        "Illustrative next-day scenario",
        [
          metric(
            "Sleep shortfall",
            rounded(Math.max(0, v.target - v.sleep)) + " h",
          ),
          metric(
            "Scenario reaction time",
            rounded(
              v.reaction *
                (1 + (Math.max(0, v.target - v.sleep) * v.effect) / 100),
            ) + " ms",
          ),
        ],
        "The penalty is an editable teaching assumption, not a validated forecast. Use the reaction self-test to collect an actual observation.",
      ),
    note,
  ),
  simulation(
    926,
    "Circadian schedule planner",
    [
      number("bed", "Target bedtime (ship hour, 0–23)", 22, 0, 23, 1),
      number("sleep", "Planned sleep duration (h)", 8, 1, 12),
      number("dim", "Chosen dim-light lead time (h)", 2, 0, 6),
      number(
        "shift",
        "Planned daily schedule shift (minutes)",
        15,
        -120,
        120,
        1,
      ),
    ],
    (v) =>
      result(
        "Your proposed light and rest schedule",
        [
          metric("Dim-light reminder", shipTime(v.bed - v.dim) + " ship time"),
          metric("Wake time", shipTime(v.bed + v.sleep) + " ship time"),
          metric(
            "Tomorrow bedtime",
            shipTime(v.bed + v.shift / 60) + " ship time",
          ),
        ],
        "A scheduling worksheet for clinician-approved plans. A display theme cannot guarantee a physiological circadian shift or eliminate all blue light from hardware.",
      ),
    note,
  ),
  simulation(
    927,
    "Caffeine plan residual worksheet",
    [
      number("dose", "Already consumed caffeine (mg)", 80, 0, 1000),
      number("hours", "Hours until intended sleep", 8, 0, 48),
      number("half", "Assumed half-life (hours)", 5, 1, 15),
    ],
    (v) =>
      result(
        "Illustrative residual caffeine",
        [
          metric(
            "Estimated remaining amount",
            rounded(v.dose * Math.pow(0.5, v.hours / v.half)) + " mg",
          ),
        ],
        "Amount × 0.5^(hours / assumed half-life). Individual clearance varies. This does not recommend a dose or authorize taking caffeine.",
      ),
    note,
  ),
  route(
    928,
    "medkit",
    { catalogFocus: "medication-dosing-notes" },
    "Opens clinician-reviewed pharmacokinetic notes; the app never adjusts a drug dose automatically.",
  ),
  route(929, "medkit", { catalogFocus: "pharmacy-stability" }),
  simulation(
    930,
    "Medication reconciliation review",
    [
      text("medicine", "Medication name"),
      text("supplement", "Other medicine or supplement"),
      select("review", "Clinical review status", [
        "Not reviewed",
        "Reviewed by medical officer",
        "Hold pending review",
      ]),
      text("plan", "Clinician-entered interaction notes"),
    ],
    (v) => {
      if (!v.medicine.trim() || !v.supplement.trim())
        throw new Error("Enter both substances for the review record.");
      return result(
        v.review === "Not reviewed"
          ? "Interaction status unknown — request review"
          : v.review,
        [metric("Combination", v.medicine + " + " + v.supplement)],
        v.plan.trim() ||
          "This app has no comprehensive drug-interaction database. Absence of a listed warning never means this combination is safe.",
      );
    },
    note,
  ),
  route(931, "medkit", { catalogFocus: "medkit-inventory" }),
  route(932, "medkit", { catalogFocus: "medkit-packs" }),
  simulation(
    933,
    "Medical supply consumption forecast",
    [
      text("item", "Supply item", "Antiviral cream"),
      number("stock", "Units remaining", 5, 0, 100000),
      number("usage", "Average units used per day", 0.4, 0.001, 10000),
      number("lead", "Resupply lead time (days)", 30, 0, 2000),
    ],
    (v) =>
      result(
        "Stock coverage at entered consumption",
        [
          metric("Days remaining", rounded(v.stock / v.usage)),
          metric("Units needed during lead time", Math.ceil(v.lead * v.usage)),
          metric(
            "Projected shortage",
            Math.max(0, Math.ceil(v.lead * v.usage - v.stock)),
          ),
        ],
        "A constant-use inventory scenario. Confirm actual stock, expiry and mission logistics; no order is sent.",
      ),
    note,
  ),
  tool(934, "gut", "Space food RFID / barcode & micronutrient analyzer"),
  route(935, "checks", { check: "urine" }),
  tool(936, "kidneys", "Renal stone risk index (RSRI)"),
  route(937, "body", { openTwin: true, catalogFocus: "digital-twin" }),
  route(938, "body", { openTwin: true, catalogFocus: "digital-twin" }),
  tool(
    939,
    "heart",
    "Pre-landing orthostatic intolerance & Chibis LBNP planner",
  ),
  simulation(
    940,
    "Sensorimotor recovery progress",
    [
      number("prior", "Prior balance-test duration (seconds)", 12, 0, 600),
      number("now", "Current duration (seconds)", 18, 0, 600),
      number("dizziness", "Current dizziness (0–10)", 2, 0, 10, 1),
      text("setting", "Test conditions / assistance"),
    ],
    (v) =>
      result(
        "Recorded recovery comparison",
        [
          metric("Duration change", rounded(v.now - v.prior) + " s"),
          metric("Dizziness", v.dizziness + "/10"),
        ],
        "Compare only tests performed under similar supervised conditions. A longer duration alone is not fitness-to-duty clearance.",
      ),
    note,
  ),
  route(941, "quests"),
  route(942, "today", { catalogFocus: "crew-biodome" }),
  simulation(
    943,
    "Non-punitive recovery planner",
    [
      number("sleep", "Last night sleep (hours)", 7, 0, 24),
      number("hrv", "Current HRV (ms)", 40, 1, 300),
      number("baseline", "Personal HRV baseline (ms)", 45, 1, 300),
      number("strain", "High-strain minutes originally planned", 60, 0, 300),
    ],
    (v) =>
      result(
        v.sleep < 6 || v.hrv < v.baseline * 0.8
          ? "Active Recovery — streak preserved"
          : "Review regular plan",
        [
          metric(
            "HRV compared with baseline",
            rounded((v.hrv / v.baseline) * 100) + "%",
          ),
          metric(
            "High-strain minutes to review",
            v.sleep < 6 || v.hrv < v.baseline * 0.8 ? v.strain : 0,
          ),
        ],
        "Prototype recovery rule: sleep below six hours or HRV below 80% of the entered baseline suggests reviewing high-strain tasks. It does not prescribe exercise or override mission medical instructions.",
      ),
    note,
  ),
  tool(944, "brain", "Autonomous CBT thought-reframing wizard"),
  tool(945, "heart", "HRV resonance box-breathing visual pacer"),
  simulation(
    946,
    "Crew climate private reflection",
    [
      number("tension", "Perceived tension (0–10)", 3, 0, 10, 1),
      number("support", "Felt support (0–10)", 7, 0, 10, 1),
      text("need", "One support need"),
      select("sharing", "Intended sharing", [
        "Keep in my local log",
        "Discuss voluntarily at debrief",
      ]),
    ],
    (v) =>
      result(
        "Reflection prepared",
        [
          metric("Tension", v.tension + "/10"),
          metric("Support", v.support + "/10"),
          metric("Sharing preference", v.sharing),
        ],
        "No anonymous survey infrastructure or anonymization guarantee is provided on this shared device. No message is sent. " +
          v.need,
      ),
    note,
  ),
  simulation(
    947,
    "Crew mediation script builder",
    [
      text("event", "Describe an observable event"),
      text("impact", "How did it affect the work?"),
      text("request", "One concrete request"),
      number("minutes", "Debrief duration (minutes)", 10, 2, 60),
    ],
    (v) => {
      if (!v.event.trim() || !v.request.trim())
        throw new Error("Enter an event and a concrete request.");
      return result(
        "Debrief script",
        [
          metric(
            "Opening and listening",
            Math.max(1, Math.floor(v.minutes / 3)) + " min",
          ),
          metric("Full session", v.minutes + " min"),
        ],
        `Open: “I noticed ${v.event}. The effect was ${v.impact || "something I would like to discuss"}. Could we ${v.request}?” Invite the other person’s perspective, repeat what you heard, and agree one next step. This is a template, not an AI therapist.`,
      );
    },
    note,
  ),
  tool(948, "brain", "Sensory monotony countermeasure launcher"),
  simulation(
    949,
    "Store-and-forward packet size lab",
    [
      text(
        "packet",
        "Clinical JSON payload",
        '{"heartRate":66,"spo2":98,"temp":36.7}',
      ),
      number("bandwidth", "Available bytes per second", 64, 1, 1000000),
    ],
    (v) => {
      let parsed;
      try {
        parsed = JSON.parse(v.packet);
      } catch {
        throw new Error("Enter valid JSON.");
      }
      const compact = JSON.stringify(parsed);
      const bytes = new TextEncoder().encode(compact).length;
      return result(
        "Minified local packet",
        [
          metric("Original bytes", new TextEncoder().encode(v.packet).length),
          metric("Minified bytes", bytes),
          metric(
            "Transmission time at entered rate",
            rounded(bytes / v.bandwidth, 2) + " s",
          ),
        ],
        compact +
          "\nWhitespace removal is not a clinical compression codec. Nothing is transmitted.",
      );
    },
    note,
  ),
  route(950, "earth", { catalogFocus: "priority-queue" }),
  simulation(
    951,
    "Access-policy rehearsal",
    [
      select("role", "Simulated role", [
        "Astronaut",
        "Crew medical officer",
        "Ground flight surgeon",
      ]),
      select("resource", "Requested record", [
        "Own public readings",
        "Another crew member’s public readings",
        "Private Sandbox logs",
      ]),
      select("consent", "Crew consent", ["Not provided", "Provided"]),
    ],
    (v) =>
      result(
        v.resource === "Private Sandbox logs"
          ? "Private store stays excluded"
          : v.resource === "Own public readings" || v.consent === "Provided"
            ? "Demo policy allows review"
            : "Demo policy requests consent",
        [
          metric("Role being rehearsed", v.role),
          metric("Resource", v.resource),
        ],
        "A policy worksheet only: switching this selector does not authenticate a role, grant access, or enforce security. Private Sandbox data is never loaded by this module.",
      ),
    note,
  ),
  route(952, "crew", { catalogFocus: "crew-readiness" }),
  simulation(
    953,
    "Hands-free navigation rehearsal",
    [
      select("command", "Simulated gesture", [
        "Nod: next step",
        "Look left: Home",
        "Look right: Body",
        "Double nod: Emergency",
      ]),
      number("dwell", "Dwell confirmation time (seconds)", 2, 1, 10),
    ],
    (v) =>
      result(
        "Gesture selected",
        [
          metric("Simulated command", v.command),
          metric("Required dwell", v.dwell + " s"),
        ],
        "Use the on-screen command buttons to navigate. No eye tracking or head-motion sensing runs; gestures are explicitly simulated.",
      ),
    note,
    { widget: "navigation" },
  ),
  route(
    954,
    "today",
    {},
    "Enables Circadian Red-Shift for the whole app. This changes UI colors; a browser cannot guarantee zero blue light from display hardware.",
    () => setDisplay({ mode: "redshift" }),
  ),
  route(
    955,
    "emergency",
    {},
    "Enables the existing high-contrast Alertness display and opens the emergency catalog. It does not activate a protocol.",
    () => setDisplay({ mode: "alertness", large: true }),
  ),
  simulation(
    956,
    "Medical drill flashcards",
    [
      select(
        "a",
        "A demo has an unresponsive crew member. First software action?",
        [
          "Open emergency protocol and call trained help",
          "Wait for a remote reply",
        ],
      ),
      select("b", "Private Sandbox records should be:", [
        "Excluded from routine public reports",
        "Automatically sent with all reports",
      ]),
      select("c", "A correlation in two trends establishes:", [
        "An association requiring investigation",
        "A proven cause",
      ]),
    ],
    (v) =>
      result(
        "Training drill completed",
        [
          metric(
            "Correct answers",
            [
              v.a.startsWith("Open"),
              v.b.startsWith("Excluded"),
              v.c.startsWith("An association"),
            ].filter(Boolean).length + "/3",
          ),
        ],
        "Rationale: use onboard emergency procedures promptly, preserve private-store boundaries, and treat correlation as an observation rather than a causal diagnosis. Repeat with alternate answers to review.",
      ),
    note,
  ),
  simulation(
    957,
    "30-second procedure orientation",
    [
      select("procedure", "Training topic", [
        "Locate the medical pack",
        "Prepare a clean observation workspace",
        "Document a patient handoff",
      ]),
      text("observations", "What did you verify?"),
    ],
    (v) =>
      result(
        "Orientation notes",
        [
          metric("Topic", v.procedure),
          metric("Format", "Timed illustrated text, no video claimed"),
        ],
        v.observations ||
          "Review pack labels and equipment, check the mission-approved procedure, and ask a trained operator before any invasive intervention.",
      ),
    note,
    { widget: "tutorial", timerSeconds: 30 },
  ),
  route(958, "body", { openTwin: true, catalogFocus: "digital-twin" }),
  simulation(
    959,
    "Multilingual handoff vocabulary",
    [
      select("term", "Term", ["Water", "Pain", "Heart", "Help"]),
      select("language", "Language", [
        "English",
        "Russian",
        "Japanese",
        "French",
        "German",
        "Italian",
        "Arabic",
      ]),
    ],
    (v) => {
      const lex = {
        Water: ["Water", "Вода", "水", "Eau", "Wasser", "Acqua", "ماء"],
        Pain: ["Pain", "Боль", "痛み", "Douleur", "Schmerz", "Dolore", "ألم"],
        Heart: ["Heart", "Сердце", "心臓", "Cœur", "Herz", "Cuore", "قلب"],
        Help: ["Help", "Помощь", "助け", "Aide", "Hilfe", "Aiuto", "مساعدة"],
      };
      return result(
        "Basic vocabulary reference",
        [
          metric(
            v.language,
            lex[v.term][
              [
                "English",
                "Russian",
                "Japanese",
                "French",
                "German",
                "Italian",
                "Arabic",
              ].indexOf(v.language)
            ],
          ),
        ],
        "A small offline vocabulary, not a medical translation service. Use an interpreter or approved multilingual protocol for clinical instructions.",
      );
    },
    note,
  ),
  route(960, "emergency", { catalogFocus: "cpr-metronome" }),
  route(
    961,
    "emergency",
    { catalogFocus: "cpr-metronome" },
    "Opens the code timer. Medication timings must be entered from a clinician-approved plan; no dose is calculated.",
  ),
  simulation(
    962,
    "Adult burn area and prescribed-fluid worksheet",
    [
      number("head", "Head/neck affected (%)", 0, 0, 9),
      number("arms", "Both arms affected (%)", 0, 0, 18),
      number("torso", "Anterior and posterior trunk affected (%)", 9, 0, 36),
      number("legs", "Both legs affected (%)", 0, 0, 36),
      number("perineum", "Perineum affected (%)", 0, 0, 1),
      number("rate", "Clinician-prescribed fluid rate (mL/h)", 0, 0, 5000),
      number("hours", "Plan duration (hours)", 1, 0, 48),
    ],
    (v) =>
      result(
        "Adult area worksheet",
        [
          metric(
            "Entered affected surface",
            v.head + v.arms + v.torso + v.legs + v.perineum + "%",
          ),
          metric(
            "Volume from entered prescription",
            rounded(v.rate * v.hours) + " mL",
          ),
        ],
        "Adult Rule-of-Nines regions are a rough educational estimate and not appropriate for every patient. Superficial-only burns are not included in clinical TBSA calculations. No fluid-resuscitation formula or dose recommendation is supplied; a trained clinician must assess burn depth and treatment.",
      ),
    note,
    {
      source: {
        title:
          "American Burn Association: burn assessment and referral guidance",
        url: "https://www.ameriburn.org/burn-care-team/resources/guidelines-for-burn-patient-referral",
      },
    },
  ),
  route(963, "emergency", {
    type: "dental",
    catalogFocus: "emergency-protocol-preview",
  }),
  route(964, "emergency", {
    type: "ocular",
    catalogFocus: "emergency-protocol-preview",
  }),
  route(965, "emergency", {
    type: "toxic",
    catalogFocus: "emergency-protocol-preview",
  }),
  route(966, "emergency", {
    type: "dcs",
    catalogFocus: "emergency-protocol-preview",
  }),
  tool(967, "vestibular", "Vestibular adaptation & space motion sickness log"),
  tool(968, "bones", "Microgravity fetal-tuck spinal stretch timer"),
  route(
    969,
    "body",
    { catalogFocus: "body-anatomy" },
    "Selects the EVA Suit & Musculoskeletal Hotspots layer.",
    () =>
      update((s) => {
        s.settings.bodyMapLayer = "eva";
      }),
  ),
  tool(970, "vestibular", "24-hour cabin acoustic dosimetry tracker"),
  tool(971, "immune", "Latent viral reactivation risk index"),
  simulation(
    972,
    "GI transit and food-diversity journal",
    [
      number("hours", "Hours since last bowel movement", 24, 0, 720),
      number("stool", "Bristol stool type (1–7)", 4, 1, 7, 1),
      number("plants", "Distinct plant foods this week", 12, 0, 100, 1),
      text("symptoms", "GI symptoms or observations"),
    ],
    (v) =>
      result(
        "GI observations logged",
        [
          metric("Time since bowel movement", v.hours + " h"),
          metric("Stool type", v.stool + "/7"),
          metric("Dietary variety count", v.plants),
        ],
        "Dietary variety is not a microbiome diversity measurement. This journal cannot identify organisms or diagnose an intestinal condition. " +
          v.symptoms,
      ),
    note,
  ),
  simulation(
    973,
    "Cycle and iron-status journal",
    [
      number("day", "Cycle day", 12, 1, 120, 1),
      select("flow", "Reported bleeding", [
        "None",
        "Light",
        "Moderate",
        "Heavy",
      ]),
      number("ferritin", "Lab ferritin (ng/mL)", 40, 0, 5000),
      text("plan", "Clinician-reviewed hormonal or iron plan"),
    ],
    (v) =>
      result(
        "Sensitive health entry prepared",
        [
          metric("Cycle day", v.day),
          metric("Reported bleeding", v.flow),
          metric("Entered ferritin", v.ferritin + " ng/mL"),
        ],
        "No fertility prediction or iron dose recommendation is made. Interpret laboratory values with the mission clinician. Private Sandbox can keep this entry outside routine crew records.",
      ),
    note,
  ),
  tool(974, "immune", "Photo tracking · nailbed & foot-loop hotspot map"),
  route(
    975,
    "trends",
    { indicator: "heartRate", catalogFocus: "health-trend-chart" },
    "Selects the personal prior-14-day baseline for the actual recorded resting-heart-rate history.",
    (pid) =>
      setChartPreferences(pid, "heartRate", {
        mode: "personal",
        overlay: "none",
      }),
  ),
  simulation(
    976,
    "Plain-language medical glossary",
    [
      select("term", "Medical term", [
        "Orthostatic intolerance",
        "Cephalad fluid shift",
        "Hyperopia",
        "Hypoxia",
        "HRV",
      ]),
    ],
    (v) => {
      const definitions = {
        "Orthostatic intolerance":
          "Difficulty keeping circulation steady when moving upright; this may cause lightheadedness.",
        "Cephalad fluid shift":
          "Body fluids moving toward the head in reduced gravity.",
        Hyperopia: "Farsightedness: nearby objects can be harder to focus on.",
        Hypoxia: "Too little oxygen reaching the body’s tissues.",
        HRV: "Heart-rate variability: variation in the time between heartbeats.",
      };
      return result(
        v.term,
        [],
        definitions[v.term] +
          " This explanation does not establish whether you have the condition.",
      );
    },
    note,
  ),
  route(977, "learn"),
  route(978, "today", { catalogFocus: "wearables" }),
  route(979, "checkin"),
  route(980, "summary"),
  route(981, "radiation"),
  simulation(
    982,
    "Water-quality and biocide review",
    [
      number("silver", "Measured silver concentration (mg/L)", 0.1, 0, 100),
      number("limit", "Mission-approved review limit (mg/L)", 0.4, 0.001, 100),
      number("water", "Water consumed (L/day)", 2.5, 0, 20),
      text("sample", "Sample ID and lab method"),
    ],
    (v) =>
      result(
        v.silver > v.limit
          ? "Entered limit exceeded — request water-system review"
          : "Within the entered review limit",
        [
          metric(
            "Estimated silver in consumed volume",
            rounded(v.silver * v.water, 3) + " mg/day",
          ),
          metric(
            "Comparison with entered limit",
            rounded((v.silver / v.limit) * 100) + "%",
          ),
        ],
        "The limit is supplied by the operator and is not an app-approved drinking-water standard. Do not add biocide or change water treatment based on this worksheet.",
      ),
    note,
  ),
  simulation(
    983,
    "Exercise-equipment CSV import rehearsal",
    [
      text(
        "csv",
        "Rows: equipment, minutes, loadKg",
        "ARED,30,40\nT2,25,0\nCEVIS,20,0",
      ),
    ],
    (v) => {
      const rows = v.csv
        .trim()
        .split(/\r?\n/)
        .map((line, i) => {
          const [a, b, c, ...extra] = line.split(",").map((x) => x.trim());
          if (
            !["ARED", "T2", "CEVIS"].includes(a) ||
            !b ||
            !c ||
            extra.length ||
            ![Number(b), Number(c)].every(Number.isFinite) ||
            +b <= 0 ||
            +b > 300 ||
            +c < 0 ||
            +c > 1000
          )
            throw new Error(
              "Row " +
                (i + 1) +
                ": use ARED/T2/CEVIS, minutes 1–300, load kg 0–1000.",
            );
          return { equipment: a, minutes: +b, load: +c };
        });
      return result(
        "Validated equipment rows",
        [
          metric("Sessions", rows.length),
          metric(
            "Total minutes",
            rows.reduce((a, b) => a + b.minutes, 0),
          ),
          metric(
            "Entered ARED load-time index",
            rounded(
              rows
                .filter((r) => r.equipment === "ARED")
                .reduce((a, b) => a + b.minutes * b.load, 0),
            ) + " kg·min",
          ),
        ],
        "This imports manual CSV into a local module record; it does not claim hardware telemetry or infer biomechanical work from the load-time index.",
      );
    },
    note,
  ),
  tool(984, "bones", "ARED / T2 / CEVIS muscle-fatigue heatmap"),
  route(985, "checklists", {
    list: "preEva",
    catalogFocus: "checklist-preEva",
  }),
  route(986, "checklists", {
    list: "postEva",
    catalogFocus: "checklist-postEva",
  }),
  simulation(
    987,
    "Social connection planner",
    [
      number("days", "Days since meaningful personal contact", 3, 0, 365),
      number("goal", "Your preferred contact interval (days)", 7, 1, 365),
      text("person", "Person or group to connect with", "Family"),
      text("plan", "Next contact plan"),
    ],
    (v) =>
      result(
        v.days >= v.goal
          ? "Your chosen contact reminder is due"
          : "Next connection reminder planned",
        [
          metric("Days until chosen reminder", Math.max(0, v.goal - v.days)),
          metric("Connection", v.person || "Not specified"),
        ],
        v.plan ||
          "Choose a convenient asynchronous message, call window or shared activity. This saves a plan only; nobody is contacted.",
      ),
    note,
  ),
  simulation(
    988,
    "Plant harvest nutrition worksheet",
    [
      select("crop", "Habitat crop", ["Mizuna lettuce", "Dwarf tomatoes"]),
      number("grams", "Harvest mass (g)", 100, 0, 10000),
      number("kcal", "Label energy per 100 g (kcal)", 20, 0, 1000),
      number("servings", "Crew servings", 4, 1, 20, 1),
    ],
    (v) =>
      result(
        "Harvest allocation",
        [
          metric("Mass per serving", rounded(v.grams / v.servings) + " g"),
          metric(
            "Entered-label energy per serving",
            rounded(((v.grams / 100) * v.kcal) / v.servings) + " kcal",
          ),
        ],
        "Use verified nutritional labels or analyses for mission food planning. This worksheet does not assert measured micronutrient content or food safety.",
      ),
    note,
  ),
  simulation(
    989,
    "Offline space-biology reference explorer",
    [
      select("topic", "Reference topic", [
        "Gene expression",
        "Microbiome",
        "Radiation",
        "Musculoskeletal",
      ]),
      text("question", "Your research question"),
    ],
    (v) =>
      result(
        "Reference search prepared",
        [
          metric("Topic", v.topic),
          metric("Catalog", "NASA Open Science Data Repository"),
        ],
        "Use the official OSDR portal at https://osdr.nasa.gov/bio/repo/ to search " +
          v.topic.toLowerCase() +
          ". This offline tool stores your research query; it does not claim to retrieve live NASA data or provide API results. " +
          v.question,
      ),
    note,
  ),
  simulation(
    990,
    "Synthetic cohort comparison",
    [
      number("value", "Your entered measurement", 66, 0, 10000),
      number("mean", "Synthetic cohort mean", 64, 0, 10000),
      number("sd", "Synthetic cohort standard deviation", 8, 0.01, 10000),
      number("n", "Synthetic cohort size", 20, 2, 10000, 1),
    ],
    (v) =>
      result(
        "Illustrative standardized difference",
        [
          metric(
            "Standard deviations from synthetic mean",
            rounded((v.value - v.mean) / v.sd, 2),
          ),
          metric("Synthetic sample size", v.n),
        ],
        "All reference values are manually supplied fictional examples, not TRISH EXPAND records. No other crew member’s or private health data is read.",
      ),
    note,
  ),
  simulation(
    991,
    "Local storage round-trip inspector",
    [
      text(
        "payload",
        "Test payload (avoid sensitive data)",
        "Storage rehearsal",
      ),
      select("format", "Serialization format", ["JSON object", "UTF-8 text"]),
    ],
    (v) => {
      const encoded =
        v.format === "JSON object"
          ? JSON.stringify({ value: v.payload })
          : v.payload;
      return result(
        "Local persistence test prepared",
        [
          metric(
            "Serialized size",
            new TextEncoder().encode(encoded).length + " bytes",
          ),
          metric(
            "Recovered text matches",
            v.format === "JSON object"
              ? String(JSON.parse(encoded).value === v.payload)
              : "true",
          ),
        ],
        "Save and reopen this module to verify browser persistence. This app uses browser-local storage, not encrypted SQLite or a protected medical database; no encryption guarantee is made.",
      );
    },
    note,
  ),
  simulation(
    992,
    "Telemetry battery-budget scenario",
    [
      number("interval", "Sampling interval (seconds)", 60, 1, 3600),
      number("watts", "Energy cost per sample (mWh)", 0.02, 0.0001, 10),
      number("battery", "Available battery energy (Wh)", 10, 0.01, 10000),
      number("background", "Other device load (W)", 0.2, 0, 100),
    ],
    (v) => {
      const consumption = v.background + ((3600 / v.interval) * v.watts) / 1000;
      return result(
        "Estimated telemetry budget",
        [
          metric("Samples per hour", rounded(3600 / v.interval)),
          metric("Average total load", rounded(consumption, 4) + " W"),
          metric("Scenario runtime", rounded(v.battery / consumption) + " h"),
        ],
        "This arithmetic scenario does not control device power, throttle medical alarms or alter actual wearable sampling.",
      );
    },
    note,
  ),
  simulation(
    993,
    "Haptic alert rehearsal",
    [
      select("pattern", "Pattern", [
        "Two short pulses",
        "Three long pulses",
        "Short-long-short",
      ]),
    ],
    (v) =>
      result(
        "Selected haptic pattern",
        [metric("Pattern", v.pattern)],
        "Use Test pattern to request browser vibration. Unsupported devices show an equivalent visual pulse; this is not a certified emergency alert.",
      ),
    note,
    { widget: "haptic" },
  ),
  simulation(
    994,
    "Color-accessibility status preview",
    [
      select("palette", "Preview palette", [
        "Deuteranopia-safe contrast",
        "Protanopia-safe contrast",
        "Monochrome",
      ]),
      select("status", "Sample status", ["In range", "Needs review", "Urgent"]),
    ],
    (v) =>
      result(
        "Accessible status preview",
        [
          metric("Palette", v.palette),
          metric("Visible text and icon", v.status),
        ],
        "The preview always pairs color with words and a distinct icon. This previews module content only; it does not imply a formal accessibility audit of the whole app.",
      ),
    note,
    { widget: "palette" },
  ),
  simulation(
    995,
    "One-handed thumb-arc navigation",
    [
      select("hand", "Reach side", ["Right", "Left"]),
      number("reach", "Reach radius (pixels)", 160, 100, 240, 10),
    ],
    (v) =>
      result(
        "Thumb-arc preview configured",
        [metric("Hand", v.hand), metric("Arc radius", v.reach + " px")],
        "Use the large Home, Body and Emergency controls in this interactive preview. The rest of the application retains its existing navigation.",
      ),
    note,
    { widget: "thumb" },
  ),
  simulation(
    996,
    "Weekly self-assessment review",
    [
      number("sleep", "Average sleep this week (h)", 7, 0, 24),
      number("tasks", "Completed planned health tasks", 5, 0, 70, 1),
      number("planned", "Planned health tasks", 7, 1, 70, 1),
      select("change", "Health changes this week", [
        "No new concerns",
        "New or worsening concerns",
        "Awaiting clinical review",
      ]),
      text("review", "What needs follow-up?"),
    ],
    (v) => {
      if (v.tasks > v.planned)
        throw new Error("Completed tasks cannot exceed planned tasks.");
      return result(
        "Weekly review prepared",
        [
          metric("Completion", rounded((v.tasks / v.planned) * 100) + "%"),
          metric("Average sleep", v.sleep + " h"),
          metric("Follow-up", v.change),
        ],
        v.review ||
          "Review any unfinished checks and agree next week’s plan. A completed checklist is not medical clearance.",
      );
    },
    note,
  ),
  route(997, "trends", { catalogFocus: "health-patterns" }),
  route(
    998,
    "emergency",
    { type: "faint", catalogFocus: "emergency-protocol-preview" },
    "Opens the unresponsive-crew protocol. The separate Start protocol button starts a simulation and shows the priority-report behavior.",
  ),
  route(
    999,
    "earth",
    { catalogFocus: "priority-queue" },
    "Enables the 40-minute Mars round-trip judge demo (compressed simulation time) for the existing Earth Link queue.",
    () => setJudgeDelay(true),
  ),
  simulation(
    1000,
    "Astronaut health passport entry",
    [
      select("phase", "Mission phase", [
        "Pre-flight",
        "In-orbit",
        "Post-flight recovery",
      ]),
      text("summary", "Health summary"),
      text("goals", "Current goals and follow-up"),
      text(
        "clinician",
        "Reviewing clinician / review status",
        "Not yet reviewed",
      ),
    ],
    (v) => {
      if (!v.summary.trim())
        throw new Error("Enter a phase summary before saving.");
      return result(
        "Local passport entry",
        [
          metric("Phase", v.phase),
          metric("Review", v.clinician || "Not recorded"),
        ],
        v.summary +
          "\nFollow-up: " +
          (v.goals || "Not recorded") +
          "\nExport includes only this module’s visible record; this is not an authenticated international medical passport.",
      );
    },
    note,
  ),
];

export const getCatalogModule = (id) =>
  CATALOG_MODULES.find((module) => module.id === Number(id)) || null;
export const catalogModuleDefaults = (module) =>
  Object.fromEntries(
    (module.fields || []).map((field) => [field.key, field.initial]),
  );
export function evaluateCatalogModule(id, values) {
  const module = getCatalogModule(id);
  if (!module?.standalone)
    throw new Error("Choose a standalone catalog module.");
  if (!values || typeof values !== "object" || Array.isArray(values))
    throw new Error("Enter the module fields before evaluating.");
  const normalized = {};
  for (const field of module.fields) {
    const raw = values[field.key];
    if (field.type === "number") {
      if (raw === "" || raw == null || !Number.isFinite(Number(raw)))
        throw new Error("Enter a number for " + field.label + ".");
      const value = Number(raw);
      if (
        value < field.min ||
        value > field.max ||
        (field.step === 1 && !Number.isInteger(value))
      )
        throw new Error(
          field.label +
            " must be between " +
            field.min +
            " and " +
            field.max +
            (field.step === 1 ? " as a whole number." : "."),
        );
      normalized[field.key] = value;
    } else if (field.type === "select") {
      if (!field.options.includes(raw))
        throw new Error("Choose a valid " + field.label.toLowerCase() + ".");
      normalized[field.key] = raw;
    } else {
      if (typeof raw !== "string" || raw.length > 6000)
        throw new Error(
          field.label + " must be text of at most 6,000 characters.",
        );
      normalized[field.key] = raw.trim();
    }
  }
  return { values: normalized, result: module.calculate(normalized) };
}
export function saveCatalogModule(id, pid, values) {
  const evaluated = evaluateCatalogModule(id, values);
  return saveClinicalRecord(
    pid,
    "catalog-" + id,
    catalogRecordPayload(id, evaluated.values, evaluated.result),
  );
}
export function catalogRecordPayload(id, values, output) {
  return {
    values,
    ...(output ? { result: output } : {}),
    ...(Number(id) === 908 && values.symptom === "Chest pain"
      ? { chestPain: true }
      : {}),
  };
}
export function savePrivateCatalogDraft(id, pid, values) {
  return saveSandboxRecord(
    pid,
    "clinical:catalog-" + id,
    catalogRecordPayload(id, values),
    { draft: true },
  );
}
export function launchCatalogModule(id, { pid, go }) {
  const module = getCatalogModule(id);
  if (!module) throw new Error("This catalog entry has no software launcher.");
  if (!getState().crew.some((person) => person.id === pid))
    throw new Error("Choose a crew profile.");
  if (module.standalone) return { standalone: true, module };
  if (typeof go !== "function") throw new Error("Navigation is unavailable.");
  module.action?.(pid);
  go(module.targetRoute, { ...module.params });
  return { standalone: false, targetRoute: module.targetRoute };
}
