# Design plan

## Screen flow

1. **Crew select (first screen).** Like the Among Us lobby: every astronaut on board appears as a colored crewmate with their name, role and an overall status dot. Tap a crewmate to open their version of the app. **Built:** `src/components/CrewSelect.jsx`
2. **Personal dashboard.** That astronaut's data only. The header shows who you are, mission day and Earth delay, plus a "Switch crew member" button back to the lobby. **Built:** `src/components/Dashboard.jsx`
3. **Body map → body-part detail.** Tap a body part (or the outline for whole-body radiation) to get a **personalized** panel: **Built:** `BodyMap.jsx`, `BodyPartDetail.jsx`
   - the status of that part (worst of its indicators)
   - "For you": personal notes for this astronaut and each related reading compared with **their own baseline** (first week), whether it's rising or falling, and what to do if it's not green
   - what spaceflight does to that part (NASA HRP)
   - how to protect it (NASA countermeasures)

## Sections still to build (see ROADMAP)

| Page | Purpose | Priority |
|---|---|---|
| Today | Health score, alert banner, today's tasks | Must |
| Check-in | Step-by-step daily measurements with how/why | Must |
| Trends | Charts vs personal baseline with green/yellow/red bands | Must (basic version exists) |
| Radiation | Cumulative dose vs 600 mSv limit, solar storm alert | Should |
| Quests | Gamified countermeasures, streaks | Should |
| Med guide | Symptom guides: self-treat, recheck or escalate | Should |
| Earth link | Queued reports to the flight surgeon with delay timer | Should |
| Mind | Mood, private journal, coping ideas | Nice |
| Emergency | Step lists for decompression sickness, solar storm, fainting, low O₂ | Nice |
| Crew view | Medical officer sees everyone's status | Nice (the lobby partly covers this) |

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
