# Space App Med: tutorial and test run

> Generated from `src/data/tutorial.js` by `npm run docs:tutorial`. The same steps are in the app: **More → Tutorial and test run** (or the lobby link, or the end of the Judge tour), where you can mark each step **Works** or **Problem** and copy a test report.

**50 steps in 9 chapters.** Before a test run: Demo controls → Reset all data, so every expected result below matches.

Demo crew stories: **A. Chen** (commander) slowing reaction times, poor sleep and high workload · **T. Okafor** (flight engineer) near vision 2 lines worse and borderline blood pressure · **M. Rivera** (medical officer) the healthy control · **K. Sato** (mission specialist) body-mass loss and eating less.

## Where the data comes from

| Source tier | Steps | Meaning |
|---|---|---|
| Challenge resource (NASA HRP / CSA) | 34 | The NASA HRP and CSA pages listed as resources on the Space Apps challenge |
| NASA document | 9 | Other official NASA documents (standards, technical briefs, checklists) |
| Clinical reference | 0 | Published clinical ranges, used only where NASA gives no number |
| App model / simulated data | 7 | The app's own model or simulated demo data, labelled on screen |

See `docs/NASA-VALIDATION.md` for the line-by-line check of every NASA figure.

## Contents

1. [Getting started](#01-getting-started) (4 steps)
2. [Home](#02-home) (6 steps)
3. [Daily logging](#03-daily-logging) (4 steps)
4. [Medical self-checks](#04-medical-self-checks) (9 steps)
5. [Body](#05-body) (6 steps)
6. [Emergency](#06-emergency) (5 steps)
7. [Help and supplies](#07-help-and-supplies) (3 steps)
8. [Crew, ship and Earth](#08-crew-ship-and-earth) (6 steps)
9. [Mission tools and settings](#09-mission-tools-and-settings) (7 steps)

## 01 Getting started

Space App Med is a health companion for astronauts far from Earth. Everything runs on this device with simulated data for a 4-person Mars-transit crew on mission day 120.

### 01. Pick a crew member in the lobby

**Why:** Each astronaut has their own health record. The lobby shows the whole crew at a glance.

**Open:** the crew lobby

**Try it:**

1. Press “Open the lobby”.
2. Look at the 4 numbered crew cards and their health scores.
3. Click a name to open that person's app.

**You should see:** 4 cards: A. Chen 62% (Alert), T. Okafor 78% (Needs attention), M. Rivera 100% (All good), K. Sato 64% (Alert). Clicking a name opens their Home screen.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: 5 hazards of human spaceflight](https://www.nasa.gov/hrp/hazards/)

- [ ] Works  - [ ] Problem: ______

### 02. Move around with the bottom bar

**Why:** Four destinations keep the app simple: Home, Body, Emergency and Users.

**Open:** `#/<crew>/today`

**Try it:**

1. Tap each item in the floating bottom bar.
2. Press your browser's Back button.

**You should see:** Each tap opens that screen and highlights it in the bar. Back returns to the previous screen, and the address bar changes (for example #/okafor/body).

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

### 03. Take the 6-stop judge tour

**Why:** A one-minute guided path through the best features, for first-time visitors and judges.

**Open:** `#/<crew>/today`

**Try it:**

1. Press the “Judge tour” pill in the top bar.
2. Press Next through all 6 stops, then Finish tour.

**You should see:** A floating bar walks through Home → Body → Self-checks → Emergency → CMO & Earth link → 1,000-item catalog, jumping to each screen.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

### 04. Reset the demo data (do this before a test run)

**Why:** Puts every crew member back to the same starting story so tests are repeatable.

**Open:** `#/<crew>/mission`

**Try it:**

1. Open Demo controls.
2. Press “Reset all data” and confirm.

**You should see:** The app returns to mission day 120 with the original readings. All the expected results in this tutorial assume fresh data.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

## 02 Home

Home answers “Am I okay, and what should I do next?” in a few seconds.

### 05. Read the mission telemetry ribbon

**Why:** Mission day, gravity, Earth delay and cabin air in one line, with live status dots.

**Open:** `#/<crew>/today`

**Try it:**

1. Look at the row of pills under the page title.

**You should see:** Mars transit · Day 120 · Microgravity · Earth delay 14 min · CO₂, O₂, cabin pressure and dose, each with a green, amber or red dot.

**Data:** NASA document: [NASA OCHMO CO₂ technical brief (3 mmHg limit)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)

- [ ] Works  - [ ] Problem: ______

### 06. Check the health score and main action

**Why:** One score (0–100) that drops for each reading, symptom or check outside its range, plus the single most useful button.

**Open:** `#/<crew>/today`

**Try it:**

1. Open K. Sato or A. Chen.
2. Read the one-sentence summary next to the ring.
3. Press “Sync wearables”.

**You should see:** An animated ring with the score, a status badge, “Start 8-step daily check-in” as the main button, and a confirmation that wearables synced.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

### 07. Use the top 3 next steps

**Why:** Turns alerts into instructions, most urgent first, with how long each takes.

**Open:** `#/<crew>/today`

**Try it:**

1. Open T. Okafor.
2. Read “Do this next”.
3. Press Start on the first item.

**You should see:** Item 1 is “Recheck your blood pressure” with the reason “Blood pressure (systolic): 138 mmHg”. Start opens the related screen.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: cardiovascular adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/)

- [ ] Works  - [ ] Problem: ______

### 08. Switch Home sections

**Why:** Progressive disclosure: only one group of sections at a time.

**Open:** `#/<crew>/today`

**Try it:**

1. Tap Today's plan, Live vitals & wearables, Crew bio-dome & streaks, then All sections.

**You should see:** Each tab shows its own cards. All sections shows everything. The app remembers your last tab.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

### 09. Read live vitals with baseline change

**Why:** Compares every reading with your own first-week baseline, because NASA notes that effects vary between astronauts.

**Open:** `#/<crew>/today`

**Try it:**

1. Open the Live vitals & wearables tab.
2. Tap the Blood pressure card.

**You should see:** 8 cards with value, “+/− vs your baseline”, a status dot and a 7-day sparkline. Tapping a card opens its trend chart.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: cardiovascular adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/)

- [ ] Works  - [ ] Problem: ______

### 10. Log a 5-second Quick Pulse

**Why:** One tap each for mood, energy and sleep restfulness when there is no time for the full check-in.

**Open:** `#/<crew>/today`

**Try it:**

1. In Today's plan, tap one face in each row.

**You should see:** Each row shows your choice as recorded immediately.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: behavioral conditions](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/)

- [ ] Works  - [ ] Problem: ______

## 03 Daily logging

Small daily habits that NASA uses as countermeasures.

### 11. Complete the 8-step daily check-in

**Why:** Reviews all 12 health indicators and symptoms in one guided flow.

**Open:** `#/<crew>/checkin`

**Try it:**

1. Step through the questions with Next.
2. Enter systolic blood pressure 152 on the blood-pressure step.
3. Finish and save.

**You should see:** The check-in is marked done on Home. A systolic of 152 turns blood pressure red and notifies the medical officer (see the bell).

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

### 12. Log a workout, water and supplements

**Why:** NASA crews exercise 1.5 hours a day, 6–7 days a week, to fight bone and muscle loss.

**Open:** `#/<crew>/log`

**Try it:**

1. Log 30 minutes of resistance exercise.
2. Press +250 mL.
3. Mark a supplement as taken.

**You should see:** Exercise minutes and water rise, the supplement shows “Logged”, and the med kit stock drops by one.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: reduced fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/)

- [ ] Works  - [ ] Problem: ______

### 13. Rate a meal (NASA 9-point scale)

**Why:** NASA rates space food from 1 to 9 and replaces foods that don't average above 6. Eating less can lead to body-mass loss.

**Open:** `#/<crew>/log`

**Try it:**

1. In Meals, pick Lunch, “About half”, rating 4.
2. Save meal.

**You should see:** The 7-day summary updates. Open K. Sato to see the alert “Ate half or less at … meals this week”.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: food and nutrition](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/)

- [ ] Works  - [ ] Problem: ______

### 14. See streaks and quests

**Why:** Light gamification that rewards the daily routine without adding work.

**Open:** `#/<crew>/quests`

**Try it:**

1. Open the progress screen.

**You should see:** Today's routine, milestones (badges) and crew progress.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

## 04 Medical self-checks

Quick tests using the camera, screen, microphone-free audio and motion sensors. Each is compared with your own baseline.

### 15. Camera heart rate

**Why:** Measures pulse from tiny colour changes in the skin (remote photoplethysmography).

**Open:** `#/<crew>/checks`

**Try it:**

1. Allow the camera.
2. Choose face or fingertip and hold still for 20 seconds.

**You should see:** A heart rate in bpm with a signal-quality label. With a poor camera frame rate it refuses to guess instead of showing a wrong number.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: cardiovascular adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/)

- [ ] Works  - [ ] Problem: ______

### 16. 3-minute reaction self-test

**Why:** NASA's Reaction Self-Test has been used on the ISS since 2009 to show when fatigue slows astronauts down.

**Open:** `#/<crew>/checks`

**Try it:**

1. Press Start and tap as soon as the counter appears, for 3 minutes.

**You should see:** Mean and median reaction time, lapses (over 355 ms) and false starts. Chen's history already shows a slowdown.

**Data:** NASA document: [NASA Spinoff: Reaction Self-Test on the ISS](https://spinoff.nasa.gov/Spinoff2013/hm_1.html)

- [ ] Works  - [ ] Problem: ______

### 17. Amsler grid (drag to mark)

**Why:** A quick screen for wavy or missing lines, which can come from eye changes in weightlessness (SANS).

**Open:** `#/<crew>/checks`

**Try it:**

1. Hold the screen 30–35 cm away and cover one eye.
2. Hold the mouse button and drag across a few squares.
3. Finish both eyes.

**You should see:** Dragging marks a continuous line, and dragging from a marked square erases. Saving with marks shows “Needs attention” and notifies the medical officer.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: SANS (eyes)](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)

- [ ] Works  - [ ] Problem: ______

### 18. Near vision chart

**Why:** Losing near vision is the main symptom astronauts notice with SANS.

**Open:** `#/<crew>/checks`

**Try it:**

1. Calibrate with a bank card, hold the screen at 40 cm, and tell which way each E points.

**You should see:** A Snellen-style result for each eye compared with your first test. Okafor's history is already 2 lines worse.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: SANS (eyes)](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)

- [ ] Works  - [ ] Problem: ______

### 19. Hearing check

**Why:** Spacecraft are noisy (about 72 dBA on the ISS), and NASA checks crew hearing on long missions.

**Open:** `#/<crew>/checks`

**Try it:**

1. Wear headphones at your usual volume.
2. Tap “I heard it” until each tone disappears.

**You should see:** A table of the quietest tone heard at 1–6 kHz for each ear, compared with your baseline.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: hostile / closed environments](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/)

- [ ] Works  - [ ] Problem: ______

### 20. Workload rating (NASA-TLX)

**Why:** NASA's standard 6-scale workload rating. Work overload is a stressor behind the sleep and behavioural-health risks.

**Open:** `#/<crew>/checks`

**Try it:**

1. Move the six sliders and save.

**You should see:** An overall score out of 100. Scores of 70 or more, or 15+ above your usual, show “Needs attention”.

**Data:** NASA document: [NASA Task Load Index (TLX)](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)

- [ ] Works  - [ ] Problem: ______

### 21. Hydration colour check

**Why:** Dehydration plus calcium from bones raises kidney-stone risk in space.

**Open:** `#/<crew>/checks`

**Try it:**

1. Tap shade 6 and save.

**You should see:** “Colour 6 of 8: drink about 500 mL and recheck”, shown as Needs attention.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: gravity fields](https://www.nasa.gov/hrp/hazard-gravity-fields/)

- [ ] Works  - [ ] Problem: ______

### 22. Stand test and balance (gravity only)

**Why:** After landing, blood pools in the legs and balance is off. These checks only make sense in gravity.

**Open:** `#/<crew>/mission`

**Try it:**

1. In Demo controls, switch the environment to Mars base.
2. Open Medical checks and start the Stand test or Balance test.

**You should see:** In Mars transit both show “Needs gravity”. On the Moon or Mars they open. A systolic drop of 20+ mmHg on standing shows Needs attention.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: gravity fields](https://www.nasa.gov/hrp/hazard-gravity-fields/)

- [ ] Works  - [ ] Problem: ______

### 23. Photo log

**Why:** Weekly face photos show fluid shift; skin photos track rashes and cold sores.

**Open:** `#/<crew>/photos`

**Try it:**

1. Open the camera, take a face photo, rate puffiness and save.
2. Take a second photo and compare.

**You should see:** Photos appear in the gallery and can be compared side by side. Photos stay on this device.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: altered immune responses](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/)

- [ ] Works  - [ ] Problem: ______

## 05 Body

A body map and 10 body-system screens show what is changing and why.

### 24. Explore the body map

**Why:** Each badge shows one body system's status; tapping the body itself shows whole-body radiation.

**Open:** `#/<crew>/body`

**Try it:**

1. Hover or tab to each badge.
2. Switch the layer to “Microgravity Fluid Shift Map”, then “EVA Suit & Musculoskeletal Hotspots”.

**You should see:** A callout shows the system name, its score out of 100 and its status. Amber and red badges pulse. Each layer redraws the figure.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

### 25. Open a body-system screen

**Why:** Each system screen has its score, readings, checks, guidance and specialized tools.

**Open:** `#/<crew>/body-eyes`

**Try it:**

1. Open Eyes and vision (try it as T. Okafor).
2. Scroll through the checks, guidance and SANS hub.

**You should see:** A system score, primary issues with guidance links, its self-checks, and the specialized SANS tool.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: SANS (eyes)](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/)

- [ ] Works  - [ ] Problem: ______

### 26. Try the specialized tools (one per system)

**Why:** Tools modelled on NASA research topics, labelled as prototypes where they are simulated.

**Open:** `#/<crew>/body-heart`

**Try it:**

1. Open each system screen and try its tool: SANS hub (eyes), motion sickness log and acoustic dosimetry (ears), box-breathing pacer and Chibis LBNP planner (heart), dust and FeNO tracker (lungs), viral reactivation index and skin hotspots (immune), food analyzer (metabolism), stone risk index (kidneys), spinal stretch timer and ARED/T2/CEVIS heatmap (bones), dose calculator (radiation), CBT reframing and sensory launcher (head).

**You should see:** Each tool saves an entry for this crew member and links its source. Simulated models say so on screen.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: ongoing research](https://www.nasa.gov/hrp/ongoing-hrp-research/)

- [ ] Works  - [ ] Problem: ______

### 27. Trends, habitat overlay and patterns

**Why:** Shows readings over time against your baseline, and patterns in your own data.

**Open:** `#/<crew>/trends`

**Try it:**

1. Pick an indicator and a time range.
2. Choose the “Cabin CO₂” environmental overlay.
3. Scroll to the patterns section.

**You should see:** A chart with the healthy band and your baseline line. Patterns state how many days they compare and that a pattern is not proof.

**Data:** NASA document: [NASA OCHMO CO₂ technical brief (3 mmHg limit)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)

- [ ] Works  - [ ] Problem: ______

### 28. Digital twin 30-day forecast

**Why:** Shows how changing water, sleep and exercise might shift the next 30 days.

**Open:** `#/<crew>/body`

**Try it:**

1. Open the Digital Twin 30-Day Forecaster at the bottom of Body.
2. Move the water and sleep sliders.

**You should see:** The forecast updates. The model's assumptions are listed and labelled as illustrative.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

### 29. Radiation and the storm shelter

**Why:** Tracks career dose against NASA's 600 mSv limit and handles solar storms.

**Open:** `#/<crew>/mission`

**Try it:**

1. In Demo controls, press “Trigger storm” on the Solar storm row.
2. On the Radiation screen, tick the first shelter step to mark yourself sheltered.
3. Press “End event now (demo)” or wait 40 seconds.

**You should see:** A red storm banner appears on every screen. The modelled event dose for a sheltered crew member is about 90% lower than for one who isn't sheltered.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: radiation-induced cancers](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/)

- [ ] Works  - [ ] Problem: ______

## 06 Emergency

Built for high-stress moments: big buttons, no unnecessary questions.

### 30. Fast diagnosis: the CO₂ scenario

**Why:** Tap symptoms and get ranked possible causes using live data, with what to do now.

**Open:** `#/<crew>/habitat`

**Try it:**

1. Open T. Okafor. On the Ship / Habitat screen press “Simulate scrubber fault”.
2. Go to Emergency. Tap Headache and Blurry or changed vision.

**You should see:** #1 High cabin CO₂ (Emergency, strong match, “Cabin CO₂ … above NASA's 3 mmHg limit”) and #2 Eye changes (SANS). A red “Treat as an emergency now” banner appears.

**Data:** NASA document: [NASA OCHMO CO₂ technical brief (3 mmHg limit)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)

- [ ] Works  - [ ] Problem: ______

### 31. Fast diagnosis: other scenarios

**Why:** Each emergency type should come out on top for its own symptoms.

**Open:** `#/<crew>/emergency`

**Try it:**

1. Chest pain + Short of breath.
2. Joint pain + “During or after a spacewalk”.
3. Short of breath with SpO₂ 88 typed in.
4. Weak or numb on one side.

**You should see:** Heart problem, Decompression sickness, Low oxygen and Possible stroke respectively ranked #1, each with a red banner.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

### 32. Run a protocol step by step

**Why:** A cockpit-style checklist: the current step is big, with its medical-pack location.

**Open:** `#/<crew>/emergency`

**Try it:**

1. Start the Fainting protocol.
2. Press “Done: next step” twice.
3. Enter vitals, then End protocol and record.

**You should see:** “Do now · step 1 of 6” moves to step 2 and 3, the elapsed timer runs, and the step's pack badge (for example Red EMTP) is shown.

**Data:** NASA document: [NASA ISS medical kit checklist](https://www.nasa.gov/wp-content/uploads/2015/03/medical_kit_checklist_-_full_release.pdf)

- [ ] Works  - [ ] Problem: ______

### 33. Zero-G CPR metronome

**Why:** Keeps compression rhythm at 110 per minute and shows zero-g positions. Training aid only.

**Open:** `#/<crew>/emergency`

**Try it:**

1. Scroll to the CPR panel and press Start 110 BPM.
2. Switch between the positioning guides.

**You should see:** A visual beat at 110 per minute and an elapsed code timer. Sound is optional.

**Data:** NASA document: [NASA ISS medical kit checklist](https://www.nasa.gov/wp-content/uploads/2015/03/medical_kit_checklist_-_full_release.pdf)

- [ ] Works  - [ ] Problem: ______

### 34. Alert the crew and simulate an emergency

**Why:** Earth is too far away to help in real time, so the crew acts first.

**Open:** `#/<crew>/today`

**Try it:**

1. On Home, use the Emergency simulator with a scenario.
2. On Emergency, press “Alert the crew now”.

**You should see:** A global emergency banner, a red notification for the medical officer, and a priority report in the Earth queue.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: distance from Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/)

- [ ] Works  - [ ] Problem: ______

## 07 Help and supplies

Guidance for symptoms, the shared medical kit, and readiness checklists.

### 35. Symptom guides

**Why:** For one symptom: possible causes in space, what to do now, and when to escalate.

**Open:** `#/<crew>/medguide`

**Try it:**

1. Search “headache” and open it.
2. Press “Log this symptom”.

**You should see:** Causes, numbered self-care steps and a red “Escalate if” list. The logged symptom appears on Home and the body map.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: altered immune responses](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/)

- [ ] Works  - [ ] Problem: ______

### 36. Med kit and pharmacy stability

**Why:** No resupply in deep space: track stock and how storage might affect medicine potency.

**Open:** `#/<crew>/medkit`

**Try it:**

1. Review stock and low-stock warnings.
2. Open the pharmacy stability planner and compare sealed vs repacked.

**You should see:** Stock, days of supply and pack colours. The potency curve is labelled illustrative, not a decision tool.

**Data:** NASA document: [NASA ISS medical kit checklist](https://www.nasa.gov/wp-content/uploads/2015/03/medical_kit_checklist_-_full_release.pdf)

- [ ] Works  - [ ] Problem: ______

### 37. Spacewalk and landing checklists

**Why:** Readiness before and after a spacewalk and for gravity transitions.

**Open:** `#/<crew>/checklists`

**Try it:**

1. Tick a few items in “Before a spacewalk”.

**You should see:** Progress updates and stays saved for this crew member.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: gravity fields](https://www.nasa.gov/hrp/hazard-gravity-fields/)

- [ ] Works  - [ ] Problem: ______

## 08 Crew, ship and Earth

The medical officer's view, cabin air, and messages to Earth with a real delay.

### 38. Medical officer (CMO) view

**Why:** The whole crew's status and every notification in one place.

**Open:** `#/<crew>/crew`

**Try it:**

1. Open the crew readiness view and the notification list.

**You should see:** Each crew member's status and score, and red/amber notifications from checks, check-ins and emergencies.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: isolation and confinement](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/)

- [ ] Works  - [ ] Problem: ______

### 39. Crew workload and EVA readiness proof

**Why:** Shows fatigue across the crew and lets a crew member prove EVA readiness without revealing health details.

**Open:** the crew lobby

**Try it:**

1. In the lobby, scroll to “Crew workload & fatigue balance”.
2. On a crew card, press “Generate readiness proof”.

**You should see:** A heatmap of TLX and sleep debt per person, and a locally generated proof result (needs a secure browser context).

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: isolation and confinement](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/)

- [ ] Works  - [ ] Problem: ______

### 40. Send a report to Earth (with delay and outages)

**Why:** Messages to Earth take minutes. Vital signs are sent first.

**Open:** `#/<crew>/earth`

**Try it:**

1. Press “Send health report”.
2. In Demo controls press “Cut link”, send a message on the Earth link, then press “Restore link”.

**You should see:** Each message moves Queued → Travelling → Delivered → Reply (14 minutes is sped up to 14 seconds). Offline messages wait in the queue. The priority queue sends the 0.5 KB vitals delta first.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: distance from Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/)

- [ ] Works  - [ ] Problem: ______

### 41. Cabin air and the scrubber fault

**Why:** CO₂ above NASA's 3 mmHg limit causes headaches. One fault alerts the whole crew once.

**Open:** `#/<crew>/habitat`

**Try it:**

1. Press “Simulate scrubber fault”, then “Restore scrubber”.

**You should see:** CO₂ jumps above 3 mmHg, a red crew-wide banner appears, and the CO₂ chart shows the spike.

**Data:** NASA document: [NASA OCHMO CO₂ technical brief (3 mmHg limit)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)

- [ ] Works  - [ ] Problem: ______

### 42. Mind: journal and support

**Why:** Journaling, windows, plants and privacy are NASA's own coping suggestions.

**Open:** `#/<crew>/mind`

**Try it:**

1. Write a journal entry with a mood and save it.

**You should see:** The entry is saved privately on this device and the mood chart updates.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: behavioral conditions](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/)

- [ ] Works  - [ ] Problem: ______

### 43. Health summary for the flight surgeon

**Why:** One page with every reading, baseline, check and alert.

**Open:** `#/<crew>/summary`

**Try it:**

1. Press “Print or save as PDF”.
2. Press “Send to flight surgeon”.

**You should see:** A clean black-on-white printable page, and a report queued on the Earth link.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

## 09 Mission tools and settings

Tools that help in the real environment of a long mission.

### 44. 1,000-item spaceflight catalog

**Why:** Every tool, test and countermeasure, searchable, with links into the app.

**Open:** `#/<crew>/catalog`

**Try it:**

1. Search “sleep”, filter by body system, open an item and press Run Check.

**You should see:** Matching items with pack colour (demo), body system and type, and a jump to the related tool. Items are labelled as concepts, not NASA endorsements.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: ongoing research](https://www.nasa.gov/hrp/ongoing-hrp-research/)

- [ ] Works  - [ ] Problem: ______

### 45. Private sandbox

**Why:** Practise or log privately. Nothing is shared unless a reading crosses a critical threshold and you confirm it.

**Open:** `#/<crew>/today`

**Try it:**

1. Turn on “Private Sandbox” in the top strip.
2. Log something, then open “Private records”.

**You should see:** A sandbox indicator appears, entries go to private records only, and a critical value asks whether to share it.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: behavioral conditions](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/)

- [ ] Works  - [ ] Problem: ______

### 46. Hands-free mode

**Why:** Gloves, exercise or zero-g can make touch hard. Commands work by voice or big buttons.

**Open:** `#/<crew>/today`

**Try it:**

1. Turn on Hands-Free and use the command buttons.

**You should see:** The command panel opens and each command performs its action. Voice is simulated where the browser has no speech support.

**Data:** App model / simulated data: App model — simulated demo data, labelled in the app

- [ ] Works  - [ ] Problem: ______

### 47. Circadian display modes and larger text

**Why:** Light affects the body clock. Red-shift mode removes blue light for sleep periods.

**Open:** `#/<crew>/today`

**Try it:**

1. Choose “Circadian Red-Shift” in the display picker.
2. Turn on Larger text in the profile menu.

**You should see:** The whole app turns red and amber on black with no blue, and text gets bigger. Switch back to Standard Orbit Day.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP risk: sleep and irregular schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/)

- [ ] Works  - [ ] Problem: ______

### 48. Change mission environment

**Why:** ISS, Mars transit, Moon and Mars change radiation rate, gravity and Earth delay.

**Open:** `#/<crew>/mission`

**Try it:**

1. Switch between ISS, Mars transit, Moon base and Mars base.

**You should see:** The ribbon updates: e.g. ISS has no delay and ~0.5 mSv/day, Mars transit 1.84 mSv/day and 14 min, Moon 1.37 mSv/day and 1.3 s, Mars 0.64 mSv/day.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: 5 hazards of human spaceflight](https://www.nasa.gov/hrp/hazards/)

- [ ] Works  - [ ] Problem: ______

### 49. Learn: NASA hazards and risks

**Why:** Every NASA hazard and all 17 HRP risks, with which screens help, plus the challenge's guiding questions.

**Open:** `#/<crew>/learn`

**Try it:**

1. Open a hazard and follow a source link.

**You should see:** The 5 hazards, 17 risks with links to nasa.gov, the CSA radiation fact, and every source used.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP: risks of human spaceflight](https://www.nasa.gov/hrp/risks/)

- [ ] Works  - [ ] Problem: ______

### 50. Works offline

**Why:** The Earth link can drop; the app must keep working.

**Open:** `#/<crew>/today`

**Try it:**

1. On the published site, load the app once, turn off Wi-Fi and reload.

**You should see:** The app still opens and all local features work. Earth messages queue until the link returns.

**Data:** Challenge resource (NASA HRP / CSA): [NASA HRP hazard: distance from Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/)

- [ ] Works  - [ ] Problem: ______

