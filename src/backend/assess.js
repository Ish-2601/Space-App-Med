// Scoring for the newer self-checks. Pure functions, no state. Each rule names its source.

// ---------- Hearing (tone screening) ----------
// NASA runs an On-Orbit Hearing Assessment for crew on missions longer than 30 days because the
// ISS is noisy (~72 dBA background). This screen is NOT calibrated: levels are "dB below the
// loudest tone" on the same headphones and volume, so results are only compared with the
// astronaut's own baseline.
export const HEARING_FREQS = [1000, 2000, 3000, 4000, 6000]; // Hz; noise damage shows up first at 3-6 kHz
export const HEARING_LEVELS = [-20, -30, -40, -50, -60, -70, -80]; // dBFS, loud to quiet

// A threshold shift is how many dB LOUDER a tone must now be to be heard (positive = worse).
export function hearingShift(base, now) {
  const out = {};
  for (const ear of ["left", "right"]) {
    out[ear] = {};
    for (const f of HEARING_FREQS) {
      const b = base?.[ear]?.[f];
      const n = now?.[ear]?.[f];
      out[ear][f] = b == null || n == null ? null : n - b;
    }
  }
  return out;
}

// Standard threshold shift (OSHA 29 CFR 1910.95): average shift of 10 dB or more at 2, 3 and 4 kHz in either ear.
// Sudden hearing loss (AAO-HNS guideline): 30 dB or more at 3 consecutive frequencies.
export function evaluateHearing(base, now) {
  if (!base) return { status: "green", summary: "first test saved as your baseline", sts: null };
  const shift = hearingShift(base, now);
  let worstAvg = 0;
  let sudden = false;
  for (const ear of ["left", "right"]) {
    const s = shift[ear];
    const vals = [2000, 3000, 4000].map((f) => s[f]).filter((v) => v != null);
    if (vals.length === 3) worstAvg = Math.max(worstAvg, vals.reduce((a, b) => a + b, 0) / 3);
    for (let i = 0; i + 2 < HEARING_FREQS.length; i++) {
      const run = [0, 1, 2].map((k) => s[HEARING_FREQS[i + k]]);
      if (run.every((v) => v != null && v >= 30)) sudden = true;
    }
  }
  const avg = Math.round(worstAvg);
  if (sudden) return { status: "red", summary: "a 30 dB+ drop across 3 tones: possible sudden hearing loss", sts: avg };
  if (worstAvg >= 10) return { status: "yellow", summary: `hearing about ${avg} dB worse at 2–4 kHz than your baseline`, sts: avg };
  return { status: "green", summary: "same as your baseline", sts: avg };
}

// ---------- Stand test (landing readiness) ----------
// Protocol from NASA landing-day stand tests: 2 min lying down, then 3.5 min standing.
// Orthostatic hypotension (consensus definition, Freeman et al. 2011): systolic drop >= 20 mmHg
// or diastolic drop >= 10 mmHg within 3 minutes of standing.
// Orthostatic tachycardia: heart rate rise >= 30 bpm on standing.
export const STAND_REST_SEC = 120;
export const STAND_UP_SEC = 210;

export function evaluateStand(r) {
  const sysDrop = r.restSys != null && r.standSys != null ? r.restSys - r.standSys : null;
  const diaDrop = r.restDia != null && r.standDia != null ? r.restDia - r.standDia : null;
  const hrRise = r.restHr != null && r.standHr != null ? r.standHr - r.restHr : null;
  const oh = (sysDrop != null && sysDrop >= 20) || (diaDrop != null && diaDrop >= 10);
  const tachy = hrRise != null && hrRise >= 30;
  const parts = [];
  if (hrRise != null) parts.push(`heart rate ${hrRise >= 0 ? "+" : ""}${hrRise} bpm`);
  if (sysDrop != null) parts.push(`systolic ${sysDrop > 0 ? "-" : "+"}${Math.abs(sysDrop)} mmHg`);
  const text = parts.join(", ") || "no vitals entered";
  if (!r.completed) return { status: "red", summary: `could not finish standing (${text})` };
  if (oh && r.symptoms) return { status: "red", summary: `blood pressure fell on standing with symptoms (${text})` };
  if (oh || tachy || r.symptoms) {
    const why = oh ? "blood pressure fell on standing" : tachy ? "heart rate rose 30+ bpm on standing" : "symptoms while standing";
    return { status: "yellow", summary: `${why} (${text})` };
  }
  return { status: "green", summary: `stable on standing (${text})` };
}

// ---------- Workload (NASA-TLX, raw) ----------
// Six 0-100 scales; "raw TLX" is their average (Hart 2006). Performance runs from 0 = perfect to 100 = failure,
// so for every scale higher means more load. There is no official clinical cut-off: this app flags 70+
// or a jump of 15+ points above the person's own usual score.
export const TLX_SCALES = [
  { id: "mental", label: "Mental demand", low: "Very low", high: "Very high", q: "How mentally demanding was your work today?" },
  { id: "physical", label: "Physical demand", low: "Very low", high: "Very high", q: "How physically demanding was it?" },
  { id: "temporal", label: "Time pressure", low: "Very low", high: "Very high", q: "How hurried or rushed was the pace?" },
  { id: "performance", label: "Performance", low: "Perfect", high: "Failure", q: "How successful were you in doing what you were asked?" },
  { id: "effort", label: "Effort", low: "Very low", high: "Very high", q: "How hard did you have to work to reach your level of performance?" },
  { id: "frustration", label: "Frustration", low: "Very low", high: "Very high", q: "How insecure, discouraged, irritated, stressed or annoyed were you?" },
];

export function rawTlx(r) {
  const vals = TLX_SCALES.map((s) => Number(r[s.id])).filter((v) => !Number.isNaN(v));
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

export function evaluateTlx(r, usual = null) {
  const score = rawTlx(r);
  const jump = usual != null ? score - usual : 0;
  if (score >= 70 || jump >= 15) {
    return { status: "yellow", summary: `workload ${score}/100${jump >= 15 ? `, ${Math.round(jump)} above your usual` : ""}` };
  }
  return { status: "green", summary: `workload ${score}/100` };
}

// ---------- Hydration (urine colour, Armstrong 8-shade scale) ----------
// 1-3 = well hydrated; higher numbers = more concentrated urine. B vitamins and some medicines can turn
// urine bright yellow, so colour is a screening hint, not a measurement.
export const URINE_SHADES = ["#fdfbe8", "#fbf6c3", "#f8ef9c", "#f3e173", "#ebcf4e", "#dcb436", "#c79a2a", "#a87b22"];

export function evaluateUrine(shade) {
  if (shade <= 3) return { status: "green", summary: `colour ${shade} of 8: well hydrated` };
  if (shade <= 6) return { status: "yellow", summary: `colour ${shade} of 8: drink about 500 mL and recheck` };
  return { status: "red", summary: `colour ${shade} of 8: dehydrated` };
}

// ---------- Meals (NASA 9-point hedonic scale) ----------
// NASA rates space food from 1 (dislike extremely) to 9 (like extremely); foods that don't average above 6
// are reformulated or replaced. Eating less than usual over time can lead to the body mass loss seen in crews.
export const HEDONIC = ["Dislike extremely", "Dislike very much", "Dislike moderately", "Dislike slightly", "Neither like nor dislike", "Like slightly", "Like moderately", "Like very much", "Like extremely"];
export const PORTIONS = [
  { id: "all", label: "All of it", value: 1 },
  { id: "most", label: "Most", value: 0.75 },
  { id: "half", label: "About half", value: 0.5 },
  { id: "little", label: "A little or none", value: 0.2 },
];

export function mealSummary(meals, day, days = 7) {
  const recent = meals.filter((m) => m.day > day - days && m.day <= day);
  if (!recent.length) return null;
  const avg = recent.reduce((a, m) => a + m.rating, 0) / recent.length;
  const lowIntake = recent.filter((m) => m.portion === "half" || m.portion === "little").length;
  return { count: recent.length, avgRating: Math.round(avg * 10) / 10, lowIntake, menuFatigue: avg <= 6, eatingLess: lowIntake >= 3 };
}

// ---------- Patterns ("insights") ----------
// Compares two groups of days. Needs at least `min` days in each group; reports the difference with
// the sample sizes. A pattern is not proof that one thing causes the other.
export function compareGroups(rows, splitFn, valueFn, min = 3) {
  const a = [];
  const b = [];
  for (const r of rows) {
    const v = valueFn(r);
    if (v == null || Number.isNaN(v)) continue;
    const g = splitFn(r);
    if (g === true) a.push(v);
    else if (g === false) b.push(v);
  }
  if (a.length < min || b.length < min) return null;
  const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length;
  return { a: mean(a), b: mean(b), na: a.length, nb: b.length };
}
