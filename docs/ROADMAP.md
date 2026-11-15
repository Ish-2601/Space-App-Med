# Roadmap and task board

Assign an owner to each line (initials) and tick when done.

## Phase 0: Decide (first 2-3 hours)
- [ ] Everyone reads docs/CHALLENGE.md and docs/RESEARCH.md
- [x] Proposed user, scenario and pitch (below); team to confirm
- [ ] Assign roles; everyone clones the repo and runs `npm run dev`

### Proposed decisions (from research; change if the team disagrees)
- **User:** an astronaut on a long-duration mission with no real-time Mission Control (Mars transit or Mars base). Secondary user: the crew medical officer.
- **Pitch:** *"When Earth is 20 minutes away, Space App Med helps astronauts check, understand and act on their own health."*
- **Demo scenario:** Mars transit, day 120. A daily check-in shows sleep and exercise drifting yellow. The body map lights up bones and brain and explains why (NASA bone-loss and sleep risks). A solar particle event alert then sends the crew to the storm shelter and updates the cumulative dose. The app queues a report to the flight surgeon with a delay timer.
- **Why it wins:** every indicator maps to a NASA HRP risk with citations (docs/RESEARCH.md), it's offline and delay-aware (Distance hazard), and it's self-explanatory (Systems Operations Support risk).

## Phase 1: Foundation
- [x] Research thresholds and citations for each indicator (`indicators.json`, `docs/RESEARCH.md`)
- [x] Add indicators: SpO₂, diastolic BP, exercise, water, cumulative radiation
- [ ] A researcher verifies the clinical links in RESEARCH.md §7
- [x] Non-numeric checks: vision self-check (SANS), motion-sickness rating, symptom checklist (rash, cold sore)
- [x] Simulated data generator with a "hazard event" scenario (solar particle event, landing)
- [x] Environment selector: ISS / transit / Moon / Mars (changes the radiation rate and gravity risks)
- [x] Full backend and all pages functional (docs/BACKEND.md, docs/DESIGN.md)
- [x] Verify environment dose rates and delays against sources (RESEARCH.md §7b)
- [x] Camera and screen checks: heart rate, reaction self-test, Amsler grid, near vision chart, balance, photo log
- [x] Med kit, activity log, habitat monitor, Learn page (NASA hazards and risks), offline PWA, GitHub Pages workflow, unit tests
- [ ] Test camera heart rate and offline install on a real laptop/phone (embedded preview browser can't)
- [ ] Turn on GitHub Pages (Settings → Pages → Source: GitHub Actions) and put the link in the submission
- [x] UI redesign: team console + clean design layer (docs/RESEARCH-UI.md)
- [ ] Demo video + project description (use DESIGN.md demo script and Learn page answers)

## Phase 2: Core features
- [x] Real SVG body map, clickable, with function and status
- [x] Daily check-in wizard with "how and why" explainers
- [x] Color-coded status plus "alert flight surgeon" rule
- [x] Trend charts with mission-day and environment selector

## Phase 3: Standout features
- [x] Gamification: streaks, daily score, countermeasure quests
- [x] Guidance engine (rules from cited sources)
- [x] Optional: camera pulse estimate, radiation tracker, offline PWA

## Phase 3b: Research-driven features (docs/RESEARCH-APPS.md)
- [x] Hearing check, stand test, NASA-TLX workload, hydration colour, meal ratings
- [x] Patterns in your data, printable health summary, night mode, larger text
- [x] Accuracy audit: PVT-B timing, rPPG low heart rates, NASA data validation (docs/NASA-VALIDATION.md)

## Phase 4: Polish
- [x] Mobile/tablet layout, accessibility (colors plus icons, not color alone)
- [ ] README, sources, limitations, ethics note
- [ ] Deploy to a public URL

## Phase 5: Submit
- [ ] 2-3 minute demo video (backup demo)
- [ ] Project description answering the challenge's guiding questions
- [ ] Submit early, then verify the links work in a private window
