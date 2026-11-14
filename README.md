# AstroHealth

NASA Space Apps Challenge 2026: *Create Health Monitoring Software for Astronauts on Space Missions*
Challenge page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

A web app that helps astronauts check, understand and act on their own health when Earth is minutes away.

> Prototype using **simulated data**. Not medical advice. Thresholds and facts are sourced in `docs/RESEARCH.md`.

## Run it

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To start over with fresh demo data: Mission control → Reset all data.

## Features

- **Crew lobby:** every astronaut as a crewmate; pick one to open their app. A CMO view shows the whole crew.
- **Today:** health score, alerts with actions (notify CMO, send to flight surgeon), daily tasks.
- **Check-in:** daily measurements (sensor values pre-filled), vision self-check, motion sickness, symptoms, with how/why for each.
- **Body map:** tap a body part for your personal status, readings vs your own baseline, notes and NASA countermeasures.
- **Trends:** charts with the healthy band and your personal baseline.
- **Radiation:** dose vs NASA's 600 mSv career limit, projections, solar storm simulation with shelter tracking.
- **Mind:** private journal, mood, coping ideas, request a private conference.
- **Quests:** gamified countermeasures, streaks, points, badges, crew leaderboard.
- **Med guide:** symptom guides (causes, self-care, when to escalate).
- **Checklists:** pre/post spacewalk and landing readiness.
- **Earth link:** reports to the flight surgeon with a realistic delay, offline queue, simulated replies.
- **Emergency:** step-by-step protocols (decompression sickness, solar storm, fainting, hypoxia, chest pain).
- **Mission control:** switch environment (ISS / transit / Moon / Mars), advance days, demo triggers, export or reset data.

## Structure

| Path | What |
|---|---|
| `src/backend/` | The backend (runs in the browser, works offline). See `docs/BACKEND.md` |
| `src/pages/` | One file per page |
| `src/components/` | Crew lobby, dashboard shell, body map, shared bits |
| `src/data/` | Indicators (with sources) and crew profiles |
| `docs/` | Research, design, roadmap, backend docs |

## Deploy (free)

`npm run build`, then publish `dist/` on GitHub Pages, Netlify or Vercel.

## Sources

See `docs/RESEARCH.md`. Main sources: NASA Human Research Program (hazards, risks, ongoing research) and the Canadian Space Agency.
