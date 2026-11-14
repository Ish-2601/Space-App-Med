# AstroHealth

NASA Space Apps Challenge 2026: *Create Health Monitoring Software for Astronauts on Space Missions*
Challenge page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

A web app that helps astronauts check, understand and act on their own health when Earth is minutes away. It works fully offline, like an onboard computer.

> Prototype using **simulated data**. Not medical advice. Thresholds and facts are sourced in `docs/RESEARCH.md` and in the app's Learn page.

## Run it

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Run the tests with `npm test`. To start over with fresh demo data: Mission control → Reset all data.

## Features

**Daily**
- **NASA Med crew lobby:** galaxy background, personal profile photos, live health percentages and checkup status; select a portrait to open that astronaut's dashboard. Checkups show as necessary when alerts, a daily check-in or scheduled medical checks need attention. The CMO view remains available for the whole crew.
- **Profile photos:** use the camera button to add a JPG, PNG, WebP or GIF (up to 5 MB). Photos are cropped to a 512px square and stored locally in IndexedDB, separately from medical photos. They also appear in the personal dashboard; use Remove photo to restore the default avatar.
- **Today:** health score, alerts with actions (notify CMO, send to flight surgeon), checks due, supplements, quests, environment focus.
- **Check-in:** 12 indicators (sensor values pre-filled), motion sickness, symptoms, with how/why for each.
- **Log activity:** workouts, water, scheduled supplements.
- **Quests:** NASA countermeasures as quests, streaks, points, badges, leaderboard.

**Medical checks (camera, screen, sensors)**, scheduled like NASA's in-flight standard measures:
- **Heart rate from the camera** (face or fingertip, remote photoplethysmography), with a signal-quality check.
- **Reaction self-test:** 3-minute alertness test modelled on NASA's ISS Reaction Self-Test (PVT).
- **Amsler grid** and **near vision chart** (calibrated tumbling E) for SANS eye changes.
- **Balance test** (in gravity only), with phone motion-sensor sway.
- **Photo log:** face (fluid shift), skin (rash, cold sore), eyes; side-by-side compare; send photos to Earth.

**My health:** body map with personal per-part status, trends against your own baseline, radiation dose vs the 600 mSv limit with solar storm sheltering, mind and journal.

**Help:** med guide (12 symptoms), shared med kit with stock and low-supply warnings, EVA/landing checklists, 6 emergency protocols.

**Crew and mission:** Earth link with realistic delay and offline queue, habitat CO₂/O₂/pressure monitor, CMO view, Learn page (NASA's 5 hazards, 17 risks, the challenge's 5 questions answered), mission control (ISS / Mars transit / Moon / Mars, demo triggers, CSV export).

**Offline:** installable PWA; all data stays on the device.

## Structure

| Path | What |
|---|---|
| `src/backend/` | The backend (runs in the browser, works offline). See `docs/BACKEND.md` |
| `src/pages/` | One file per page |
| `src/components/` | Lobby, dashboard shell, body map, camera, medical check components |
| `src/data/` | Indicators (with sources) and crew profiles |
| `tests/` | Unit tests (`npm test`) |
| `docs/` | Research, design, roadmap, backend docs |

## Deploy (free)

The included GitHub Actions workflow tests, builds and publishes to GitHub Pages on every push to `main`. One-time setup: GitHub repo → Settings → Pages → Source: **GitHub Actions**. The site will be at `https://<user>.github.io/astro-health/`.

The camera needs HTTPS (GitHub Pages provides it) or `localhost`.

## Sources

See `docs/RESEARCH.md` and the Learn page. Main sources: NASA Human Research Program (hazards, risks, ongoing research), NASA OCHMO technical briefs, the Canadian Space Agency, and published spaceflight research.
