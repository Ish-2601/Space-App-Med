// Builds the initial (simulated) database: crew profiles + 30 days of history each.
import crewData from "../data/crew.json";
import { ENVIRONMENTS } from "./content.js";

export const SCHEMA_VERSION = 2;
export const HISTORY_DAYS = 30;

// Seeded random so a given astronaut + day always produces the same numbers
export function seededRandom(seedText) {
  let a = [...seedText].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE = { heartRate: 5, systolic: 6, diastolic: 4, spo2: 1.5, glucose: 8, temp: 0.3, sleep: 0.8, mood: 1.5, exercise: 15, water: 0.3 };
const DECIMALS = { temp: 1, sleep: 1, water: 1 };

// One simulated day of readings ("wearable + sensor" data). prevDose = yesterday's cumulative dose.
export function simulateRow(person, day, startDay, prevDose, environment) {
  const r = seededRandom(`${person.id}:${day}`);
  const t = Math.min(1.5, (day - startDay) / HISTORY_DAYS);
  const row = { day };
  for (const [id, base] of Object.entries(person.baseline)) {
    const v = base + (person.drift[id] || 0) * t + NOISE[id] * (r() - 0.5);
    const p = 10 ** (DECIMALS[id] || 0);
    row[id] = Math.round(v * p) / p;
  }
  row.spo2 = Math.min(100, row.spo2);
  row.mood = Math.max(1, Math.min(10, row.mood));
  row.exercise = Math.max(0, row.exercise);
  const rate = ENVIRONMENTS[environment].doseRate;
  row.radiation = Math.round((prevDose + rate * (0.85 + 0.3 * r())) * 10) / 10;
  return row;
}

export function createInitialState() {
  const { mission, crew } = crewData;
  const environment = mission.environment || "transit";
  const startDay = mission.day - HISTORY_DAYS + 1;
  const history = {};
  for (const p of crew) {
    // dose accumulated before the simulated window
    let dose = p.priorDose + (startDay - 1) * ENVIRONMENTS[environment].doseRate;
    history[p.id] = [];
    for (let d = startDay; d <= mission.day; d++) {
      const row = simulateRow(p, d, startDay, dose, environment);
      dose = row.radiation;
      history[p.id].push(row);
    }
  }
  const perPerson = (v) => Object.fromEntries(crew.map((p) => [p.id, typeof v === "function" ? v(p) : structuredClone(v)]));

  return {
    version: SCHEMA_VERSION,
    mission: { name: mission.name, day: mission.day, startDay, environment },
    link: { online: true },
    demoSpeed: 60, // 1 real second = 1 simulated minute (so a 14-min Earth delay takes 14 s)
    crew,
    history,
    // { day: { ts, values, vision, motion, symptoms } }. Past days are pre-filled (with a few missed days)
    // so streaks and points have history; today is left for the user to complete.
    checkins: perPerson((p) => {
      const r = seededRandom(`${p.id}:checkins`);
      const out = {};
      for (let d = startDay; d < mission.day; d++) {
        if (r() < 0.12 && d < mission.day - 5) continue; // occasional missed day
        out[d] = { ts: null, auto: true, vision: d % 7 === 0 ? "normal" : null, motion: 0, symptoms: [] };
      }
      return out;
    }),
    journal: perPerson([]), // [{ id, day, ts, text, mood }]
    symptomLog: perPerson([]), // [{ id, day, ts, symptom, note }]
    checklists: perPerson({}), // { listId: { itemIndex: true } }
    reports: [], // Earth link messages
    events: [], // solar particle events
    emergencies: [],
    notifications: [], // messages to the crew medical officer (CMO) / crew
    shelteredEver: perPerson(false),
  };
}
