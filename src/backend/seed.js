// Builds the initial (simulated) database: crew profiles, 30 days of readings, past checks,
// supplement log, med kit and habitat sensor history.
import crewData from "../data/crew.json";
import { ENVIRONMENTS, MEDKIT } from "./content.js";

export const SCHEMA_VERSION = 3;
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

const NOISE = { heartRate: 5, systolic: 6, diastolic: 4, spo2: 1.5, glucose: 8, temp: 0.3, sleep: 0.8, mood: 1.5, exercise: 15, water: 0.3, mass: 0.4 };
const DECIMALS = { temp: 1, sleep: 1, water: 1, mass: 1 };
const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

// One simulated day of readings ("wearable + sensor" data). prevDose = yesterday's cumulative dose.
export function simulateRow(person, day, startDay, prevDose, environment) {
  const r = seededRandom(`${person.id}:${day}`);
  const t = Math.min(1.5, (day - startDay) / HISTORY_DAYS);
  const row = { day };
  for (const [id, base] of Object.entries(person.baseline)) {
    const v = base + (person.drift[id] || 0) * t + (NOISE[id] || 0) * (r() - 0.5);
    row[id] = round(v, DECIMALS[id] || 0);
  }
  row.spo2 = Math.min(100, row.spo2);
  row.mood = Math.max(1, Math.min(10, row.mood));
  row.exercise = Math.max(0, row.exercise);
  const rate = ENVIRONMENTS[environment].doseRate;
  row.radiation = round(prevDose + rate * (0.85 + 0.3 * r()), 1);
  return row;
}

// One simulated day of cabin sensor readings
export function simulateHabitat(day, environment) {
  const r = seededRandom(`habitat:${day}`);
  const atm = ENVIRONMENTS[environment].atmosphere;
  return {
    day,
    co2: round(2.1 + r() * 0.8, 1), // mmHg
    o2: round(atm.o2Pct + (r() - 0.5) * 0.6, 1), // %
    pressure: round(atm.pressureKpa + (r() - 0.5) * 0.8, 1), // kPa
    temp: round(22 + (r() - 0.5) * 2, 1), // °C
    humidity: Math.round(45 + (r() - 0.5) * 12), // %
  };
}

// Simulated reaction self-test result that gets slower with less sleep
export function simulatePvt(sleep, r) {
  const meanRt = Math.round(255 + Math.max(0, 7.5 - sleep) * 28 + (r() - 0.5) * 20);
  return {
    trials: 40 + Math.round(r() * 8),
    meanRt,
    medianRt: meanRt - 8,
    speed: Math.round((1000 / meanRt) * 0.98 * 100) / 100,
    lapses: Math.max(0, Math.round((7 - sleep) * 2 + (r() - 0.5) * 1.5)),
    falseStarts: r() < 0.2 ? 1 : 0,
    durationSec: 180,
  };
}

export function createInitialState() {
  const { mission, crew } = crewData;
  const environment = mission.environment || "transit";
  const startDay = mission.day - HISTORY_DAYS + 1;
  const perPerson = (fn) => Object.fromEntries(crew.map((p) => [p.id, fn(p)]));

  const history = perPerson((p) => {
    let dose = p.priorDose + (startDay - 1) * ENVIRONMENTS[environment].doseRate;
    const rows = [];
    for (let d = startDay; d <= mission.day; d++) {
      const row = simulateRow(p, d, startDay, dose, environment);
      dose = row.radiation;
      rows.push(row);
    }
    return rows;
  });

  // Past days are pre-filled (with a few missed days) so streaks have history; today is for the user.
  const checkins = perPerson((p) => {
    const r = seededRandom(`${p.id}:checkins`);
    const out = {};
    for (let d = startDay; d < mission.day; d++) {
      if (r() < 0.12 && d < mission.day - 5) continue;
      out[d] = { ts: null, auto: true, motion: 0, symptoms: [] };
    }
    return out;
  });

  // Past medical checks (newest first): reaction tests every 4 days, vision checks weekly
  const tests = perPerson((p) => {
    const r = seededRandom(`${p.id}:tests`);
    const list = [];
    for (let d = startDay; d < mission.day; d++) {
      const row = history[p.id].find((x) => x.day === d);
      if ((d - startDay) % 4 === 1) list.unshift({ id: `seed-pvt-${p.id}-${d}`, type: "pvt", day: d, ts: null, result: simulatePvt(row.sleep, r) });
      if (d % 7 === 0) {
        list.unshift({ id: `seed-amsler-${p.id}-${d}`, type: "amsler", day: d, ts: null, result: { left: [], right: [] } });
        const late = p.id === "okafor" && d >= mission.day - 7;
        list.unshift({ id: `seed-acuity-${p.id}-${d}`, type: "acuity", day: d, ts: null, result: late ? { left: 0.3, right: 0.2 } : { left: 0.1, right: 0.1 } });
      }
    }
    return list;
  });

  const medLog = perPerson((p) => {
    const list = [];
    for (let d = startDay; d < mission.day; d++) {
      if (!checkins[p.id][d]) continue;
      for (const m of p.medSchedule || []) {
        if (m.freq === "daily" || (m.freq === "weekly" && d % 7 === 3)) list.unshift({ id: `seed-med-${p.id}-${m.med}-${d}`, med: m.med, day: d, ts: null });
      }
    }
    return list;
  });

  const habitatHistory = [];
  for (let d = startDay; d <= mission.day; d++) habitatHistory.push(simulateHabitat(d, environment));

  return {
    version: SCHEMA_VERSION,
    mission: { name: mission.name, day: mission.day, startDay, environment },
    link: { online: true },
    demoSpeed: 60, // 1 real second = 1 simulated minute (so a 14-min Earth delay takes 14 s)
    settings: { pxPerMm: null },
    crew,
    history,
    checkins,
    tests,
    medLog,
    medkit: MEDKIT.map((m) => ({ ...m })),
    exerciseLog: perPerson(() => []),
    photos: perPerson(() => []),
    journal: perPerson(() => []),
    symptomLog: perPerson(() => []),
    checklists: perPerson(() => ({})),
    habitat: { history: habitatHistory, fault: null },
    reports: [],
    events: [],
    emergencies: [],
    notifications: [],
    shelteredEver: perPerson(() => false),
  };
}
