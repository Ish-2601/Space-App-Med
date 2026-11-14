# Backend

AstroHealth's backend runs **inside the browser** (the "onboard computer"). There's no server, so the app works fully offline, which is exactly the situation on a Mars mission with a 4–24 minute Earth delay. It deploys as a static site (GitHub Pages / Netlify / Vercel) and installs as an offline app (PWA).

The UI never touches data directly. **Everything goes through `src/backend/api.js`**, so the frontend can be redesigned freely, and storage can later be swapped for a real server without touching the UI.

## Files

| File | Role |
|---|---|
| `backend/api.js` | Public API: every action and query the UI uses |
| `backend/rules.js` | Rules engine (pure functions): statuses, alerts, health score, test evaluation, due checks, habitat, meds, streaks, quests, badges, radiation projections, crew overview |
| `backend/store.js` | In-memory database, saves on every change, `useStore()` React hook, 1-second clock |
| `backend/storage.js` | Persistence (localStorage). Replace these 3 functions to use a server |
| `backend/photoStore.js` | Photo images in IndexedDB (photo metadata lives in the main state) |
| `backend/seed.js` | Starting demo data: crew, 30 days of readings, past checks, supplement log, med kit, habitat history |
| `backend/content.js` | Environments, symptoms, medical checks, med kit, workouts, quests, badges, med guide, emergencies, checklists |
| `backend/nasa.js` | NASA hazards, 17 HRP risks, the challenge's guiding questions, sources (Learn page) |
| `backend/rppg.js` | Camera heart-rate algorithm (pure, unit-tested) |
| `backend/pvt.js` | Reaction self-test scoring (pure, unit-tested) |
| `backend/vision.js` | Near vision chart geometry (pure, unit-tested) |
| `data/crew.json` | Crew profiles: baseline, drift (demo story), supplements, personal notes |
| `data/indicators.json` | Indicator ranges, how/why, actions, sources (`relative: true` = % of personal baseline) |

## Using it from a component

```jsx
import { useStore, alertsFor, submitCheckIn } from "../backend/api.js";

function Example({ person }) {
  const state = useStore();               // re-renders when data changes
  const alerts = alertsFor(state, person.id);
  return <button onClick={() => submitCheckIn(person.id, { values: { systolic: 120 } })}>Save</button>;
}
```

## Queries (read; take `state` first)

| Function | Returns |
|---|---|
| `historyOf`, `rowFor(state, pid, day?)` | Daily readings |
| `indicatorStatuses`, `indicatorStatus` | Status per indicator (handles relative indicators) |
| `partStatus(state, pid, part)` | Body part status (readings + symptoms + recent checks) |
| `alertsFor(state, pid)` | Sorted alerts `{ level, title, action, part?, indicator?, page?, escalate? }` |
| `overallStatus`, `healthScore` | Person summary |
| `testsOf`, `latestTest`, `evaluateTest`, `recentCheckResults`, `dueChecks` | Medical checks |
| `habitatToday`, `co2Status`, `ppO2` | Cabin environment |
| `medsDue`, `lowStock`, `daysOfSupply`, `medName` | Supplements and med kit |
| `tasksFor`, `points`, `streak`, `badgesFor` | Gamification |
| `doseSummary` | Dose, % of 600 mSv limit, rate, days to 50/80/100% |
| `crewOverview`, `envOf`, `earthDelayMs` | Crew and mission |

## Actions (write; save automatically)

| Area | Functions |
|---|---|
| Check-in | `submitCheckIn(pid, { values, motion, symptoms })`: red readings notify the CMO |
| Medical checks | `saveTest(pid, "pvt" \| "amsler" \| "acuity" \| "hr" \| "balance", result)`, `setCalibration(pxPerMm)` |
| Photos | `savePhoto(pid, blob, { category, part, note, rating })`, `deletePhoto(pid, id)` |
| Activity | `logWorkout(pid, type, minutes)`, `addWater(pid, liters)`, `takeMed(pid, medId)`, `restockMed(medId, qty)` |
| Symptoms / journal | `logSymptom`, `addJournal`, `deleteJournal` |
| CMO | `notifyCMO(pid, text, level)`, `markNotificationsRead()` |
| Earth link | `sendReport(pid, kind, text, photoIds)`, `setLinkOnline(bool)`, `buildHealthSummary` |
| Radiation | `startSolarEvent(sec)`, `setSheltered(pid, bool)`, `endSolarEvent()` |
| Habitat | `setCo2Fault(bool)` |
| Emergencies | `startEmergency(pid, type)`, `toggleEmergencyStep(id, i)`, `resolveEmergency(id)` |
| Checklists | `toggleChecklistItem(pid, listId, i)`, `resetChecklist` |
| Mission | `setEnvironment(env)`, `advanceDay()`, `setDemoSpeed(n)`, `resetAll()`, `exportData()`, `exportCsv(pid)` |

## Time-based behaviour (`tick`, every second)

- **Reports:** queued → (link up) travelling to Earth for the one-way delay → delivered → flight surgeon "reviews" for 5 s → reply travels back → replied. If the link is down, reports wait in the queue.
- **Solar particle events** end automatically; sheltered crew get ~10% of the event dose.
- **Demo speed:** by default 1 real second = 1 simulated minute, so a 14-minute delay takes 14 seconds.

## Tests

`npm test` runs 35 unit tests: the camera heart-rate algorithm (synthetic pulses 55–130 bpm, noise, low frame rate), reaction-test scoring, vision chart maths, indicator statuses, and the backend (seed stories, check-in, every check type, activity, med kit, habitat, solar events, Earth link timing, day advance, CSV).

## Moving to a real server later

Replace `loadState` / `saveState` in `storage.js` (and the functions in `photoStore.js`) with `fetch` calls to an API, or sync `exportData()` when the Earth link is up. Nothing in the UI needs to change.
