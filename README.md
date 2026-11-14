# AstroHealth

NASA Space Apps Challenge 2026: *Create Health Monitoring Software for Astronauts on Space Missions*
Challenge page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/

A web-based tool that helps astronauts assess their own health: guided check-ins, color-coded indicators, a clickable body map, trend charts, and guidance on what to do next.

> Prototype using **simulated data**. Not medical advice. Thresholds must be sourced from NASA HRP and other cited references (see `src/data/indicators.json`).

## Run it

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## Structure

| Path | What |
|---|---|
| `src/App.jsx` | UI: body map, indicator list, trend chart, guidance |
| `src/lib.js` | Status logic, simulated mission data, body-part info |
| `src/data/indicators.json` | Indicators, ranges, how-to, why, actions. **Add citations here** |
| `docs/ROADMAP.md` | Task checklist and owners |
| `docs/CHALLENGE.md` | Challenge requirements and judging checklist |

## Deploy (free)

`npm run build`, then publish `dist/` on GitHub Pages, Netlify or Vercel. Put the live link in your submission.

## Team

Add names and roles here.

## Sources

- NASA HRP: 5 Hazards https://www.nasa.gov/hrp/hazards/
- NASA HRP: Risks https://www.nasa.gov/hrp/risks/
- NASA HRP: Ongoing research https://www.nasa.gov/hrp/ongoing-hrp-research/
- CSA: Monitoring Radiation for Astronaut Health https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
