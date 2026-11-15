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

Open http://localhost:5173 (or the port Vite prints). Run the tests with `npm test`. To start over with fresh demo data: All tools → Demo controls → Reset all data.

## NASA Med console

The personal Home screen shows the current mission, daily tasks and diagnostics, and a health score out of 100. The bottom navigation is **Home → Body → Emergency → Users**; Users returns to profile selection. Other existing features remain under **All tools**.

Body opens a menu with ten dedicated system screens, including head and mental wellbeing, heart, respiratory health, and bones/joints/muscles. Focused diagnostic checks update only the selected person's relevant readings and symptoms. Head checks also record self-reported sleep quality and stress, alongside mood and daily journal status. These prototype scores are not clinical diagnoses. Missing measurements remain unscored.

Home includes an emergency simulator. The global banner appears only for active emergency protocols, solar events, or cabin faults, and disappears when they end. A simulated protocol can be ended from Home. Existing camera, vision, hearing, reaction, standing, workload, and hydration checks remain available from the related body screens.

The interface uses dark surfaces, muted glass controls, and the supplied galaxy background in the crew lobby. The responsive navigation connects Home, Body, Emergency, and Users.

- Home combines a live health score, priority action, daily routine, and streak.
- The eight-step check-in reviews all 12 indicators and symptoms before saving.
- Body links system status, baseline trends, medical checks, radiation, and photos.
- Medical checks use a shared measurement workspace; the Amsler grid supports both eyes, clearing, and keyboard arrow/Space controls.
- Crew combines the simulated Earth link, delivery timeline, habitat readings, personal journal, and the medical officer's overview.
- Emergency protocols support patient selection, persistent steps, a timer, vitals, priority updates, and completion or early termination.
- Solar storm checklists retain per-person steps after the all-clear. Demo controls change environments, link status, and events.

All reports, notifications, and replies are simulated locally. Camera and motion checks require device support and permission. Photo files stay in IndexedDB and are not included in JSON/CSV exports.

## Mission utilities and adaptive health tools

- **Private Sandbox:** available in the global bar, including the Users screen. Check-ins, focused diagnostic drafts/results, tests, symptoms, triage queries, mood/journal logs, wearable snapshots and activity logs go into `privateSandboxRecords`. They do not alter public readings, scores, task progress, CMO notifications or Earth reports. Switching modes remounts forms; private diagnostic drafts can be resumed only in sandbox mode. The Private records drawer is scoped to the selected crew member. This is local data separation, not encryption or an authenticated privacy boundary.
- **Critical sandbox prompts:** explicitly entered SpO₂ below 85%, chest pain, or an acute event dose above 500 mSv opens a modal. Sharing creates one local CMO notification and simulated priority report containing only the critical finding. Keeping it private leaves public data unchanged. Lifetime cumulative radiation is never treated as an acute event dose. Private records are excluded from ordinary JSON/CSV exports and health reports.
- **Hands-Free:** Web Speech recognition supports Next step, Record vitals, Start timer, Read aloud and Open Emergency. The same five buttons work without a microphone. Speech recognition requires browser support/permission and may use the browser vendor's speech service; synthesis reads visible instructions. A one-minute timer persists across screens and refreshes.
- **Circadian display:** cool cyan Alertness, Standard Orbit Day, and amber/red Red-Shift. Legacy Night Mode preferences migrate automatically. The named 480 nm and 0% Blue Light modes describe screen palettes, not calibrated spectra or a guarantee of melatonin protection.
- **Home:** six simulated BLE/ANT+ wearable feeds refresh every 15 seconds and can sync a snapshot to today's readings. Quick Pulse saves three five-choice ratings. The five-second voice-log simulation generates cadence, pitch variability and fatigue drift from demo baselines without recording audio. Cognitive Motor Readiness uses form interaction timing/correction counts only; it does not capture text or diagnose cognitive impairment.
- **Cooperative Bio-Dome:** completed public crew tasks grow interactive dwarf tomatoes and mizuna. Short sleep (under six hours) or HRV below the prototype 30 ms trigger substitutes an Active Recovery task. Completing recovery earns the task's points and preserves a streak without inventing exercise minutes or completing the daily check-in.
- **Layered anatomy:** Organ Systems, Microgravity Fluid Shift and EVA hotspots retain all ten body destinations. Fluid-shift intensity follows ISS/transit 0G, Moon 0.16G or Mars 0.38G; the overlay illustrates anatomy rather than measuring swelling.
- **Health trends:** all biometric trend views offer a preceding 14-day personal baseline, the app's adapted screening range, or sourced Earth reference ranges where defined. Cabin CO₂, daily radiation dose, pressure or simulated acoustic noise can use a separate right axis. Correlation banners use aligned days and explicitly avoid causal claims. Raw chart readings are accessible in a table. Chart modes do not change alert thresholds.
- **Digital Twin:** Body and Trends open a persistent four-slider scenario drawer for ARED, water, sleep and storm shielding. Thirty-day curves show relative bone-density, aerobic-capacity, renal-risk and vigilance indices. These deterministic demonstration equations are disclosed and are not clinically validated personal predictions.

Run `npm test` and `npm run build` after changes. Regression coverage includes public/private isolation, critical boundary values and confirmation, draft persistence, wearable sync idempotence, recovery points/streaks, day-aligned correlations, forecast controls, voice actions, and legacy display preferences.

## Specialized clinical and emergency modules

All ten Body screens now include specialized tools without replacing their existing readings, diagnostics, charts or care links. Structured records and drafts persist locally in `clinicalRecords`, or in `privateSandboxRecords` while Sandbox is on. Switching modes never publishes private entries.

| Body screen | Tools |
|---|---|
| Head and mental wellbeing | Six-step offline CBT thought record; forest/ocean/mountain previews; approved scent-cartridge prompts; sleeping-bag ventilation checklist and session timer |
| Eyes | Baseline/left/right ONSD and hyperopic-shift log, globe-flattening/choroidal-fold observations, CMO countermeasure notes and AR link |
| Hearing and balance | Motion-provocation log and energy-averaged acoustic exposure log with >60 dBA fan-noise review flags |
| Heart | Six-breath/minute visual box pacer and simulated coherence; calculator for an entered, CMO-approved fluid-loading/LBNP plan |
| Respiratory | Regolith exposure and FeNO log, Suitlock/HEPA checklist |
| Immunity and skin | Disclosed viral-reactivation scenario index; nailbed/foot-loop hotspot map linked to local photo records |
| Nutrition | Camera barcode, manual-code and reader input; sample food manifest with micronutrient totals and configurable iron-review ceiling |
| Kidneys | Interactive renal-risk scenario gauge, hydration/urine/sodium inputs, clinician-led citrate/ultrasound notes and bladder AR link |
| Bones and muscles | ARED/T2/CEVIS load heatmap, perceived exertion and persistent fetal-tuck stretch timer |
| Radiation | Entered organ absorbed doses × quality factor, shielding comparisons, AstroRad/water-wall layout diagrams |

Medical self-checks include four camera or manual SVG alignment guides: ocular ultrasound, bladder ultrasound, pupil/nystagmus rings and pulse ROIs. Green confirms only geometric alignment with a training target. The camera cannot perform ultrasound, measure ONSD, or certify a safe clinical scan. Camera access is opt-in; streams stop on exit.

Emergency now preserves its original six protocols and adds ocular injury, renal colic, toxic atmosphere and dental emergencies. Each step includes equipment provenance, a **simulated drawer assignment**, persistent reminder timers where appropriate, vitals and priority-report support. Private rehearsals are separate from public active emergencies. The 110 BPM visual/audible CPR aid includes three zero-G positioning diagrams, a persistent code timer and timestamped observations. It does not select ACLS drugs or assess compression quality.

NASA's released kit list identifies red EMTP, white CMP, blue MDP, yellow PEP, pink MTP and **green MSP**. The requested Green CCPK association is explicitly a prototype grouping, not an official color claim. Medicines, Morgan Lens, dental interventions, LBNP and acoustic stone propulsion are presented as clinician-directed or research options, never automatic prescriptions.

The medical kit includes a four-drug storage/potency **scenario** calculator and pharmacokinetic review notes. Assumed radiation acceleration is off by default: the [2025 NASA-supported stability study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12085706/) did not establish accelerated degradation in the solid formulations tested. Model percentages do not replace assays, expiration guidance or a pharmacist's review.

The simulated Earth link transmits P1 512-byte emergency vital deltas, P2 clinical JSON and P3 media chunks in priority order. Deltas reference the last returned acknowledgement; media yields to urgent packets, and offline time does not accumulate bandwidth. The judge mode models a 40-minute roundtrip in 40 seconds (20 seconds each way after upload). No network transmission occurs. Photo delivery is tracked separately from clinical replies.

Users and CMO screens include a public Raw NASA-TLX/sleep-debt heatmap and a local **Fit-for-EVA proof demonstration**. Six Pedersen commitments and Schnorr opening proofs establish that all six committed prototype readiness bits equal one, bound to the public snapshot, profile and mission day. The verifier rejects stale or tampered transcripts and never reads sandbox logs. This is an educational, non-constant-time implementation with no trusted issuer; it cannot establish clinical truth or authorize an EVA. Missing workload/check-in evidence prevents proof generation.

Validation: **302 tests passing**, preserving the preceding 241 tests; production build passes. Browser checks cover private CBT/SANS records, AR alignment, emergency vitals/timer restoration, queue priority, pharmacy scenario restoration and local proof generation. Hardware ultrasound, scent cartridges, clinical wearables and a VR headset are not controlled by this prototype.

## Features

**Daily**
- **NASA Med crew lobby:** galaxy background, personal profile photos, live health percentages and checkup status; select a portrait to open that astronaut's dashboard. Checkups show as necessary when alerts, a daily check-in or scheduled medical checks need attention. The CMO view remains available for the whole crew.
- **Profile photos:** use the camera button to add a JPG, PNG, WebP or GIF (up to 5 MB). Photos are cropped to a 512px square and stored locally in IndexedDB, separately from medical photos. They also appear in the personal dashboard; use Remove photo to restore the default avatar.
- **Home:** health score, alerts with actions (notify CMO, send to flight surgeon), checks due, supplements, quests, environment focus.
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

**Help:** med guide (12 symptoms), shared med kit with stock and low-supply warnings, EVA/landing checklists, 10 emergency protocols.

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
