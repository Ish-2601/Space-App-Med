# What similar apps do well, and what users miss

Researched on 2026-11-14 through about 45 searches of review roundups, comparison articles, published studies, app-store analyses and user forums. **Honest scope:** this covers about 130 apps and tools, not 500. The same themes came up again and again across categories, so more sources would mostly repeat them.

## Apps and tools covered (≈130)

| Category | Apps |
|---|---|
| Wearables and health platforms | Apple Health, Google Fit / Health Connect, Google Health, Samsung Health, Fitbit, Garmin Connect, Oura, Whoop, Withings, Polar, Coros, Amazfit/Zepp, Ultrahuman, Huawei Health, Welltory, Hexoskin |
| Symptom and health diaries | Bearable, Daylio, CareClinic, Flaredown, Migraine Buddy, Guava, Visible, Symple, Manage My Pain, PainScale, Ouchless, GeoPain, PainTrek, Palina |
| Symptom checkers | Ada, Babylon, Buoy, K Health, Mediktor, Symptomate, WebMD, Your.MD/Healthily |
| Medication | Medisafe, MyTherapy, Dosecast, Round Health, Mango Health, CareZone, Pillo |
| Sleep and circadian | Sleep Cycle, Rise, SleepScore, Pillow, AutoSleep, SleepWatch, Timeshifter (jet lag), Timeshifter Shift Work |
| Mental health | Headspace, Calm, Wysa, Woebot, Sanvello, How We Feel, Finch, Moodfit, Insight Timer |
| First aid, emergency, remote medicine | American Red Cross First Aid, Red Cross Emergency, IFRC First Aid, Canadian Red Cross First Aid, PulsePoint, PulsePoint AED, GoodSAM, GOES Health, WildSOAP, Wilderness Medicine Reference, Wilderness First Aid Trainer, Deployed Medicine, Ship Doctor |
| Training | Strava, Fitbod, Hevy, Strong, JEFIT, TrainingPeaks, Nike Training Club, Boostcamp, Setgraph, Planfit |
| Nutrition | Cronometer, MyFitnessPal, MacroFactor, Lose It!, Yazio, Carb Manager, Fitia |
| Habits and gamification | Habitica, Streaks, Fabulous, Loop, Productive, HabitStreak, Habi |
| Vision and hearing | Peek Acuity, EyeQue, hearWHO, Mimi, EarQ and KUDUwave (NASA hearing system), ESA EveryWear |
| Air quality | Awair, Airthings, IQAir AirVisual |
| Records and sharing | Epic MyChart, Apple Health Records, MyHealthRelay, Health Auto Export, Health Record Export |
| Remote patient monitoring | Inhealthcare virtual wards, Patient Status Engine (NICE), Current Health, Biofourmis, Vivify |
| Space-specific tools | NASA Playbook (crew self-scheduling), NASA Cognition battery, Reaction Self-Test, NASA-TLX, On-Orbit Hearing Assessment, CSA Astroskin / Bio-Monitor, ESA EveryWear, NASA Exploration Medical Capability work (Earth-independent medical operations) |

## What people like (and what Space App Med now does)

| Pattern people like | Seen in | In Space App Med |
|---|---|---|
| One score plus **one thing to do next** | Oura "Today" (one big daily insight), Whoop, Apple Health Highlights | Today: health score and **Do this next**, written as an action ("Recheck your blood pressure") with the reading as the reason |
| **Patterns between your own habits and symptoms** | Bearable "Factor Effect" (needs about 3 days with and 3 without) | **Patterns in your data**: sleep vs reaction speed, exercise vs mood, sleep vs mood, CO₂ vs headaches. Needs 3+ days per group and says "not proof" |
| Comparing you with **your own baseline** | Oura, Whoop, Apple Trends | Every indicator and check uses a personal baseline |
| **Tap where it hurts** on a body diagram | Manage My Pain, GeoPain, Ouchless, Migraine Buddy | Clickable body map with per-part status, checks and guidance |
| Gentle streaks and quests that reduce friction | Streaks, Finch, Habitica | Daily routine, streak and points (small, not a game that adds work) |
| **Works offline**, step-by-step emergency help | Red Cross First Aid, GOES Health, WildSOAP | Offline app; Emergency opens with **Alert the crew now**, then checklists |
| A **one-page summary for the doctor** | MyTherapy PDF journal, MyHealthRelay | **Health summary**: print, save as PDF, or send to the flight surgeon |
| Threshold alerts and history for air | Airthings, Awair, IQAir | Habitat: CO₂ against NASA's 3 mmHg limit, 30-day chart, crew-wide alerts |
| Validated self-tests | Peek Acuity (best evidence), NASA Reaction Self-Test | Near-vision chart (logMAR, calibrated), Amsler grid, PVT-B, camera heart rate |
| Circadian advice | Timeshifter (built with a NASA adviser), Rise | Sleep guidance; a full light/sleep-shift planner is still a future idea |

## What people complain about or miss (and how Space App Med avoids it)

| Complaint | Evidence | Space App Med |
|---|---|---|
| **Inaccurate data**, e.g. sleep trackers counting awake time as sleep | Top category in review analyses (≈28% of negative reviews) | Every algorithm is tested; quality labels on camera heart rate; it refuses a reading when the frame rate would alias |
| Paywalls and upsell pop-ups | Fitbit, Welltory, CareClinic reviews | None |
| Feature bloat and confusing redesigns | Fitbit → Google Health backlash | 4 tabs + Emergency; extra tools sit in More |
| Data loss on sync or updates | Many app reviews | Data stays on the device, plus CSV export and a printable summary |
| Diet and exercise on separate screens; no "fuller picture" | Samsung Health requests | Body map and summary join readings, checks, meals and symptoms |
| No explanation of *why* | General | Every indicator and check has "why" and "what to do", with NASA sources |
| Alarm fatigue | Hospital alarms on ECRI's Top-10 hazards list, 2012–2020 | Three levels only; a red alert always comes with a next step; one crew-wide CO₂ alert instead of four |
| Privacy fears | Cycle-tracker concerns | No account, no server; photos stay in the browser |
| Symptom checkers that over- or under-triage | BMJ Open 2020: top-3 accuracy 23–71% vs GPs at 82% | The Help screen gives possible causes, self-care and **escalate if** rules; it doesn't diagnose |

## New astronaut features added from this research

1. **Hearing check.** NASA tests crew hearing on missions longer than 30 days because the ISS background is about 72 dBA. The app uses a descending tone screen per ear. It flags an OSHA standard threshold shift (average 10 dB or more at 2–4 kHz) and possible sudden hearing loss (30 dB or more at 3 consecutive tones). It is uncalibrated, so it only compares you with your own baseline.
2. **Stand test (landing readiness).** Uses NASA's landing-day protocol: 2 minutes lying down, then 3.5 minutes standing. It flags orthostatic hypotension (systolic drop of 20 mmHg or more, or diastolic drop of 10 or more) and a heart-rate rise of 30 bpm or more. It only appears in gravity.
3. **Workload rating (NASA-TLX).** The six raw-TLX scales. NASA has no official cut-off, so the app flags 70 or more, or 15 or more above your usual, and says so.
4. **Hydration colour check.** The Armstrong 8-shade chart used by the US military, tied to the kidney-stone risk in NASA's gravity hazard. It warns that B vitamins change urine colour.
5. **Meal ratings.** NASA's 9-point food scale (foods must average above 6) plus how much was eaten. Flags eating less, which ties into the crew's body-mass loss risk.
6. **Patterns in your data.** Bearable-style comparisons with sample sizes.
7. **Health summary for the flight surgeon.** One page to print, save as PDF or send.
8. **Night mode and larger text** (added earlier). Dim red light for sleep periods; bigger text for vibration or tired eyes.
9. **Address-bar routing** (added earlier). Refresh keeps your screen and the back button works.

## Ideas not built yet (future work)

- Light and sleep-shift planner (Timeshifter-style) for the 24.6-hour Mars sol.
- A fuller NASA Cognition-style battery, for example digit-symbol and emotion recognition.
- Medicine expiry tracking (evidence on faster degradation in space is mixed: Putcha 2011 vs Wotring 2015).
- Store-and-forward voice or video notes to the flight surgeon.
- Crew self-scheduling of health tasks (NASA Playbook).

## Main sources

- [BMJ Open 2020 symptom-checker study (via MobiHealthNews)](https://www.mobihealthnews.com/news/emea/study-reveals-disparities-coverage-and-accuracy-among-symptom-apps)
- [Bearable Factor Effect report](https://bearable.app/support/howto/the-factor-effect-report/)
- [Oura app redesign (9to5Google)](https://9to5google.com/2025/10/20/oura-app-redesign/?rand=7%2F)
- [Instrument: Oura case study](https://instrument.com/work/oura-app)
- [Health app review analysis (Unstar)](https://unstar.app/blog/health-fitness-app-reviews-what-users-really-want-2026)
- [NASA Playbook / SpaceCHI paper](https://hsi.arc.nasa.gov/publications/Zheng_etal_2023_SpaceCHI.pdf)
- [CSA Bio-Monitor (Astroskin)](https://asc-csa.gc.ca/eng/sciences/astroskin.asp)
- [Penn Cognition battery](https://www.med.upenn.edu/uep/cognition.html)
- [ISS hearing assessment (UTMB)](https://utmb-ir.tdl.org/items/fa32e916-0cfd-4673-9204-bd35962e7154/full)
- [ISS noise (Svantek)](https://svantek.com/academy/noise-at-the-international-space-station/)
- [NASA-TLX](https://en.wikipedia.org/wiki/NASA-TLX)
- [NASA food acceptability (Frontiers 2025)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1562044/full)
- [Urine colour chart research (Springer)](https://link.springer.com/article/10.1007/s00394-015-1010-2/fulltext.html)
- [Landing stand test (Frontiers 2020)](https://www.frontiersin.org/article/10.3389/fphys.2020.00784)
- [Basner 2011 PVT-B](https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786)
- [Stahn 2017 core temperature](https://pmc.ncbi.nlm.nih.gov/articles/PMC5701078)
- [Medicines in space (Wotring 2015)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4706284)
- [Peek Acuity validation](https://pubmed.ncbi.nlm.nih.gov/33222600/)
- [Medical alarm fatigue (APSF)](https://www.apsf.org/article/alarm-fatigue-and-patient-safety/)
