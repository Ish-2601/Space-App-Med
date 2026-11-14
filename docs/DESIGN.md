# Design plan

## Screen flow

1. **Crew select (first screen).** Like the Among Us lobby: every astronaut on board appears as a colored crewmate with their name, role and an overall status dot. Tap a crewmate to open their version of the app. **Built:** `src/components/CrewSelect.jsx`
2. **Personal dashboard.** That astronaut's data only. The header shows who you are, mission day and Earth delay, plus a "Switch crew member" button back to the lobby. **Built:** `src/components/Dashboard.jsx`
3. **Body map → body-part detail.** Tap a body part (or the outline for whole-body radiation) to get a **personalized** panel: **Built:** `BodyMap.jsx`, `BodyPartDetail.jsx`
   - the status of that part (worst of its indicators)
   - "For you": personal notes for this astronaut and each related reading compared with **their own baseline** (first week), whether it's rising or falling, and what to do if it's not green
   - what spaceflight does to that part (NASA HRP)
   - how to protect it (NASA countermeasures)

## All pages (built, functional, rough styling)

| Page | File | Purpose |
|---|---|---|
| Today | `pages/Today.jsx` | Health score, alerts with actions, today's tasks |
| Check-in | `pages/CheckIn.jsx` | Daily measurements with how/why, vision, motion sickness, symptoms |
| Body map | `pages/Body.jsx` | Body figure + personalized part detail |
| Trends | `pages/Trends.jsx` | Charts with healthy band and personal baseline |
| Radiation | `pages/Radiation.jsx` | Dose vs limit, projections, solar storm + shelter |
| Mind | `pages/Mind.jsx` | Journal, mood, coping ideas, private conference request |
| Quests | `pages/Quests.jsx` | Quests, streak, points, badges, leaderboard |
| Med guide | `pages/MedGuide.jsx` | Symptom guides, log symptom, notify CMO |
| Checklists | `pages/Checklists.jsx` | Pre/post EVA, landing readiness |
| Earth link | `pages/EarthLink.jsx` | Delayed reports and replies, offline queue |
| Crew (CMO) | `pages/CrewView.jsx` | Whole-crew status, notifications, emergencies |
| Mission control | `pages/MissionControl.jsx` | Environment, advance day, demo triggers, export/reset |
| Emergency | `pages/Emergency.jsx` | Step-by-step protocols |

All data and logic live in `src/backend/` (see `docs/BACKEND.md`), so the UI can be redesigned without touching behaviour.

## Suggested 3-minute demo

1. Lobby: show the four crewmates and their statuses.
2. Open **T. Okafor** → Check-in: enter systolic 152, vision "changed", symptom "Headache" → Today shows red/yellow alerts.
3. Body map → Eyes and Heart: personal notes and baseline comparison.
4. Send report to flight surgeon → Earth link: watch it travel (14 s), get reviewed, and reply.
5. Radiation → simulate a solar particle event → shelter → dose comparison.
6. CMO view from the lobby: whole crew at a glance.

## Data

- `src/data/crew.json`: fictional crew. Each person has a baseline, a drift (how their numbers change over the mission, which creates the demo story) and personal notes per body part.
- `src/data/indicators.json`: indicator ranges, how/why, actions and sources.
- Data is **simulated** and seeded per astronaut, so it's the same on every reload.

## Demo stories built into the crew

- **A. Chen (Commander):** sleep and exercise sliding, so brain and bones go yellow.
- **T. Okafor (Flight engineer):** blood pressure rising and water falling, so heart and kidneys flag; vision note on eyes.
- **M. Rivera (Medical officer):** healthy control case.
- **K. Sato (Mission specialist):** low mood, slight fever, cold sore, SpO₂ dip, so brain, immune and lungs flag.

## Visual style

Dark mission-control theme, traffic-light colors always paired with text labels, big touch targets, short text, and a layout that collapses to one column on tablets and phones.
