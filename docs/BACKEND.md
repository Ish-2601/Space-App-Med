# Backend

AstroHealth's backend runs **inside the browser** (the "onboard computer"). There's no server, so the app works fully offline, which is exactly the situation on a Mars mission with a 4–24 minute Earth delay. It deploys as a static site (GitHub Pages / Netlify / Vercel).

The UI never touches data directly. **Everything goes through `src/backend/api.js`**, so the frontend can be redesigned freely, and the storage can later be swapped for a real server without touching the UI.

## Files

| File | Role |
|---|---|
| `backend/api.js` | Public API: every action and query the UI uses |
| `backend/rules.js` | Rules engine (pure functions): statuses, alerts, health score, streaks, quests, badges, radiation projections, crew overview |
| `backend/store.js` | In-memory database, saves on every change, `useStore()` React hook, 1-second clock |
| `backend/storage.js` | Persistence (localStorage). Replace these 3 functions to use a server |
| `backend/seed.js` | Builds the starting demo data: crew + 30 days of simulated readings |
| `backend/content.js` | Environments, symptoms, quests, badges, med guide, emergency protocols, checklists, coping tips |
| `data/crew.json` | Crew profiles: baseline, drift (demo story), personal notes |
| `data/indicators.json` | Indicator ranges, how/why, actions, sources |

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
| `historyOf(state, pid)` / `rowFor(state, pid, day?)` | Daily readings |
| `indicatorStatuses(state, pid)` | `{ indicatorId: "green" \| "yellow" \| "red" }` |
| `partStatus(state, pid, part)` | Body part status (readings + symptoms + vision/motion) |
| `alertsFor(state, pid)` | Sorted alerts `{ level, title, action, part?, indicator?, page?, escalate? }` |
| `overallStatus`, `healthScore` | Person summary |
| `tasksFor`, `points`, `streak`, `badgesFor` | Gamification |
| `doseSummary(state, pid)` | Dose, % of 600 mSv limit, rate, days to 50/80/100% |
| `symptomsToday`, `activeEvent`, `activeEmergencies` | Current situation |
| `crewOverview(state)` | Everyone's status for the CMO view |
| `earthDelayMs(state)` | Demo-time Earth delay |

## Actions (write; save automatically)

| Area | Functions |
|---|---|
| Check-in | `submitCheckIn(pid, { values, vision, motion, symptoms })`: red readings notify the CMO |
| Symptoms / journal | `logSymptom`, `addJournal`, `deleteJournal` |
| CMO | `notifyCMO(pid, text, level)`, `markNotificationsRead()` |
| Earth link | `sendReport(pid, "health" \| "message" \| "emergency" \| "psych", text)`, `setLinkOnline(bool)`, `buildHealthSummary` |
| Radiation | `startSolarEvent(sec)`, `setSheltered(pid, bool)`, `endSolarEvent()` |
| Emergencies | `startEmergency(pid, type)`, `toggleEmergencyStep(id, i)`, `resolveEmergency(id)` |
| Checklists | `toggleChecklistItem(pid, listId, i)`, `resetChecklist` |
| Mission | `setEnvironment(env)`, `advanceDay()`, `setDemoSpeed(n)`, `resetAll()`, `exportData()` |

## Time-based behaviour (`tick`, every second)

- **Reports:** queued → (link up) travelling to Earth for the one-way delay → delivered → flight surgeon "reviews" for 5 s → reply travels back → replied. If the link is down, reports wait in the queue.
- **Solar particle events** end automatically; sheltered crew get ~10% of the event dose.
- **Demo speed:** by default 1 real second = 1 simulated minute, so a 14-minute delay takes 14 seconds.

## Moving to a real server later

Replace `loadState` / `saveState` in `storage.js` with `fetch` calls to an API (for example Express + SQLite), or sync `exportData()` to the server when the Earth link is up. Nothing in the UI needs to change.
