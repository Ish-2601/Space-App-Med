# Research: Astronaut Health Monitoring

Research base for Space App Med. Everything here is summarized from the challenge's official resources plus a small number of clinical references (marked **[clinical]**). Every number used in the app should trace back to a line in this document.

> Last researched: 2026-11-14. Sources were read directly; links at the bottom of each section.

---

## 1. The challenge in one paragraph

Long missions expose crews to radiation, isolation, altered gravity and a hostile closed environment. These cause immune changes, bone loss, cardiovascular events and behavioral health problems. On long missions **astronauts must spot these changes in themselves**. We are building a **visual tool** that gathers health indicators, helps astronauts **assess** their status, and gives **guidance on treatments and health improvements**. Suggested features: a clickable human body figure, color coding, dynamic charts, prompts to measure, gamification, and simple explanations. Assume the user is *not* a medical expert.

Source: [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)

---

## 2. The 5 hazards (NASA Human Research Program)

| Hazard | Key facts from NASA | What it means for our app |
|---|---|---|
| **Space radiation** | Invisible, can't be felt. Galactic cosmic rays plus solar particle events. Raises cancer risk, damages the central nervous system, can alter cognitive and motor function and behavior. ISS crews get >10× Earth's natural dose; beyond the magnetosphere (Moon, Mars) it's worse. Crews shelter in shielded areas during solar particle events. | Track cumulative dose against the career limit; give a "shelter now" alert for solar events; link radiation to cognition, mood, eyes and heart. |
| **Isolation & confinement** | Sleep loss, circadian desynchronization and work overload compound and lead to decreased performance and adverse health. NASA is developing behavioral health monitoring to *detect and treat early risk factors*. Light therapy, journaling and space gardening help. | Mood and stress check-ins, sleep tracking, journaling prompt, self-care quests. |
| **Distance from Earth** | Mars averages 140 million miles away; a trip takes about 3 years; **communication delay is up to 20 minutes one way**. Crews must handle medical emergencies with minimal Earth support. | Core justification for self-assessment. The app must work **offline** and tell the crew when to escalate to the flight surgeon, accepting that the reply is delayed. |
| **Gravity fields** | Weight-bearing bones lose **1–1.5% mineral density per month**. Fluids shift headward and pressure the eyes (vision problems). **Kidney stone** risk rises from dehydration plus calcium released from bone. Gravity transitions cause dizziness, motion sickness, fainting, and balance and coordination problems. | Exercise and hydration tracking; vision self-check; dizziness and motion-sickness check after gravity transitions (landing on the Moon or Mars). |
| **Hostile/closed environment** | Temperature, pressure, lighting, noise and CO₂ matter. Microbes transfer easily and can become more virulent. Stress hormones rise and the **immune system alters**, raising susceptibility to illness and allergies. | Temperature and symptom tracking (rash, cold sores, infection); cabin environment panel. |

Sources: [5 Hazards](https://www.nasa.gov/hrp/hazards/) · [Radiation](https://www.nasa.gov/hrp/hazard-space-radiation/) · [Isolation](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/) · [Distance](https://www.nasa.gov/hrp/hazard-distance-from-earth/) · [Gravity](https://www.nasa.gov/hrp/hazard-gravity-fields/) · [Hostile/Closed](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/) · [Radiation won't stop exploration](https://www.nasa.gov/humans-in-space/space-radiation-wont-stop-nasas-human-exploration/)

---

## 3. The HRP risks, mapped to body systems

This drives the clickable body map. Each body region lists the NASA risk(s) it relates to, what NASA says, and what an astronaut can self-monitor.

| Body region | NASA risk | Key facts | Self-monitorable indicators | Countermeasures (NASA) |
|---|---|---|---|---|
| **Heart & blood vessels** | Cardiovascular Adaptations | Can cause blood clots, arrhythmias, cardiovascular disease, and **low blood pressure that raises fainting risk at landing**. The heart becomes more spherical. Risk grows with mission length. | Heart rate, blood pressure, dizziness on standing | Regular exercise, healthy diet, **lower-body compression garments and fluid loading before landing**, emergency training |
| **Bones** | Spaceflight-Induced Bone Changes | **1–1.5% density loss per month** (spine, hips). Raises fracture and premature osteoporosis risk. Spine elongates; height can increase up to **3%**. | Exercise minutes, calcium/vitamin D intake, hydration (kidney stones), back pain | Resistive exercise, **bisphosphonate** medication, diet |
| **Muscles & fitness** | Reduced Cardiorespiratory & Musculoskeletal Fitness | Average strength and aerobic losses of **10–12%**; **12–38% of ISS crew lose >20%** of preflight fitness. Raises fall and trip risk during gravity transitions. | Exercise minutes, periodic fitness self-test | ISS crews exercise **1.5 h/day, 6–7 days/week** (resistance plus aerobic) |
| **Eyes & brain (SANS)** | Spaceflight Associated Neuro-ocular Syndrome | Headward fluid causes optic nerve swelling, retinal folds and flattening of the eye. **~70% of ISS astronauts** show some swelling at the back of the eye. Higher risk on long missions. | Vision self-check (blurriness, near-vision changes), headache | B-vitamin supplement (B-Complex study), **thigh cuffs** to keep fluid in the legs (Thigh Cuff study) |
| **Inner ear & balance** | Altered Sensorimotor & Vestibular Function | **Most astronauts get space motion sickness.** Earth motion sickness doesn't predict it. Disorientation and hand-eye/gait problems after gravity changes. | Nausea/dizziness rating, balance self-test after landing | Medication, training, orientation aids |
| **Immune system** | Altered Immune System Responses; Host-Microorganism Interactions | Dormant viruses reactivate (**cold sores, shingles**), rashes, atypical allergies, infections. Skin and gut microbiome changes; some microbes become more virulent. | Body temperature, symptom checklist (rash, cold sore, sore throat) | Pre-launch quarantine (2 weeks), disinfectants, antibiotics, anti-inflammatories |
| **Lungs / oxygen** | Hypoxia; Decompression Sickness; EVA | Future habitats run at lower pressure, so there is **mild hypoxia** risk (confusion, headache, vision impairment, poor sleep, like altitude sickness). DCS ("the bends") from moving to a low-pressure suit. Current protocol: **end the spacewalk and return to pressure if DCS symptoms appear.** | SpO₂ (pulse oximeter), headache, joint pain after EVA | Oxygen prebreathe protocols, variable-pressure suits |
| **Gut & nutrition** | Inadequate Food & Nutrition | Menu fatigue; food must last years; nutrition is essential to health and performance. 200+ foods on ISS. | Meals logged, calories, water intake, blood glucose, body weight | Enhanced diet, crew-selected menus |
| **Mind / mood** | Behavioral Conditions & Psychiatric Disorders; Inadequate Teamwork | Anxiety, depression; affects sleep, morale and decisions. Comms delays limit family and psych support. Windows, privacy, journaling and gardening help. | Mood, stress, loneliness, conflict ratings; journal | Self-care time, journaling, plants, private family calls, team training |
| **Sleep / circadian** | Inadequate Sleep & Irregular Schedules | ISS crews see **16 sunrises and sunsets per day**; work overload and irregular light disrupt sleep. | Sleep hours, sleep quality, caffeine | LED lighting that simulates Earth's day, managing caffeine, scheduled relaxation |
| **Whole body: radiation** | Radiation-Induced Cancers (+ CNS, cardiovascular, eye degeneration) | Higher cancer risk; also CNS and cognitive impairment. Missions beyond Earth's magnetosphere are more exposed. | Cumulative dose from dosimeter; cognitive self-test | Shielding, storm shelter, dosimeters, space-weather forecasting |
| **Whole body: landing** | Injury from Dynamic Loads | Landing injuries made worse by bone loss and disorientation; on the Moon or Mars crews must **self-egress** without help. | Post-landing readiness checklist | Seat and restraint design, fitness |
| **Systems support** | Inadequate Systems Operations Support | Without real-time Mission Control, crews need user-friendly tools they can operate independently. | — | **Justifies our UX focus**: simple, self-explanatory interface |

Sources: [HRP Risks overview](https://www.nasa.gov/hrp/risks/) and each risk page: [Immune](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/) · [Sensorimotor](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/) · [Cardiovascular](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/) · [Decompression](https://www.nasa.gov/reference/risk-of-decompression-sickness/) · [Microorganisms](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/) · [Hypoxia](https://www.nasa.gov/reference/risk-of-hypoxia/) · [Nutrition](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) · [EVA](https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/) · [Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/) · [SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) · [Bone](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) · [Behavioral](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) · [Teamwork](https://www.nasa.gov/reference/risk-of-inadequate-teamwork/) · [Sleep](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) · [Systems support](https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/) · [Dynamic loads](https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/) · [Radiation cancer](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/)

---

## 4. What NASA actually measures (and how)

From the HRP "Ongoing Research" page. These show which measurements are **realistic in space**, which is one of the challenge's guiding questions.

| Study | What's measured | How | Relevance |
|---|---|---|---|
| **Spaceflight Standard Measures** (since 2018, 30+ astronauts) | Activity and light exposure, sleep reports, diet/nutrition (fluid samples), immune function (saliva), cognition tests, balance/inner-ear tests, total body strength, microbiome | **Wrist sensor**, surveys, samples, tests: before, during and after flight | Our indicator set mirrors this "standard measures" approach |
| **Artemis II Standard Measures** | Blood, saliva, urine (nutrition, cardiovascular, immune), MRI (eyes and brain), balance, motion sickness, muscle performance, microbiome; capsule egress and moonwalk tests on return | Mix of in-flight and pre/post | Deep-space version of the same idea |
| **ARCHeR** (Artemis II) | Well-being, activity, sleep, crew interactions | **Actigraphy** (wrist activity monitor) plus behavioral surveys | Mood and sleep surveys are legitimate in-flight tools |
| **Immune Biomarkers** (Artemis II) | Stress hormones, viruses, immune cells | **Dry saliva blotted on paper** in pocket booklets, in flight | Simple self-collection is feasible |
| **CIPHER** (14 studies) | Eye/vision exams, cognitive and spatial tests, cardiovascular imaging, exercise and sensorimotor tests, MRI, blood/urine calcium (bone loss marker) | In-flight and pre/post | Calcium as a bone-loss marker |
| **Tempus Pro** | Vital signs plus medical imaging in one device; telemedicine; crew medical officer diagnoses a simulated case | Commercial telemedicine device | **Closest real analog to our app**: integrated vitals and crew-led diagnosis under comms delay |
| **Thigh Cuff** | Vision and blood flow while wearing cuffs | **Ultrasound** of leg and neck veins | Ultrasound is crew-operated in flight |
| **B-Complex** | Eye swelling vs. daily B-vitamin supplement | Eye exams, blood, genetics | SANS countermeasure we can recommend |
| **Zero T2** | Strength, fitness, bone, balance without a treadmill | Fitness testing | Future spacecraft have smaller exercise gear |

Equipment confirmed onboard by these sources: wrist actigraphy sensor, ultrasound, telemedicine vitals device, dosimeters (personal badges), saliva/blood/urine collection, cognitive test software.

Sources: [Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) · [Standard Measures](https://www.nasa.gov/reference/standard-measures/) · [Artemis II Standard Measures](https://www.nasa.gov/reference/artemis-ii-standard-measures/) · [ARCHeR](https://www.nasa.gov/reference/archer/) · [Immune Biomarkers](https://www.nasa.gov/reference/immune-biomarkers/) · [CIPHER](https://www.nasa.gov/reference/cipher/) · [Tempus Pro](https://www.nasa.gov/reference/tempus-pro/) · [Thigh Cuff](https://www.nasa.gov/reference/thigh-cuff/) · [B-Complex](https://www.nasa.gov/reference/b-complex/) · [Zero T2](https://www.nasa.gov/reference/zero-t2/)

---

## 5. Radiation monitoring (NASA plus CSA)

- NASA's **Space Radiation Analysis Group** (JSC) monitors solar radiation **24/7** and keeps crews within acceptable risk.
- Crews wear **personal dosimeter badges** (TLD, OSLD, PNTD) analyzed on the ground; the ISS also has real-time instruments (TEPC, CPDS). Orion carries the **Hybrid Electronic Radiation Assessor**.
- **CSA**: **neutrons are about 30% of total radiation on the ISS** and are especially biologically damaging. CSA is funding **CANS** (Canadian Active Neutron Spectrometer), a compact instrument that measures neutron exposure **continuously and autonomously**. It follows earlier Canadian detectors: bubble detectors, MOSFET, EVARM, Radi-N, Radi-N2.
- **Numbers:**
  - ISS dose is about **0.2–0.5 mSv/day**, roughly **80–160 mSv per 6-month mission**. It is higher at solar minimum.
  - **NASA career limit: 600 mSv effective dose** (NASA-STD-3001 Vol. 1 Rev B, 2022), regardless of age or sex.
  - Short-term limit cited for a solar particle event: **250 mSv**.
  - Background on Earth is about 2 mSv/year.

Sources: [NASA SRAG / Monitoring Space Radiation](https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/) · [CSA: Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) · [NASA OCHMO Radiation Protection Technical Brief](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf) · [NASA-STD-3001 Vol 1 Rev B](https://www.nasa.gov/wp-content/uploads/2020/10/2022-01-05_nasa-std-3001_vol.1_rev._b_final_draft_with_signature_010522.pdf) · [NTRS: Simonsen (ISS dose rates)](https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf)

---

## 6. Why space health research matters (CSA)

- Moon and Mars missions mean longer isolation, **bigger comms delays**, and **less ability to rely on Earth for food, materials and emergency medical help**.
- Weightlessness effects resemble **accelerated aging and a sedentary lifestyle**. Six months in space gives data that would take years on Earth. The findings help with osteoporosis, balance problems, cardiovascular disease and Type 2 diabetes.
- About **200 experiments** run on the ISS at any time.

Use this for our "Benefits on Earth" pitch slide: the same tool could serve remote or elderly patients.

Source: [CSA: Why do we conduct science experiments in space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)

---

## 7. Indicator thresholds used in the app

The NASA resources describe **risks and trends**, not per-reading cutoffs. For green/yellow/red bands we use standard adult clinical references **[clinical]**, then add space-specific notes. These are for a prototype; **not medical advice**.

| Indicator | Green | Yellow | Red | Basis |
|---|---|---|---|---|
| Resting heart rate | 60–100 bpm | 50–59 or 101–110 | <50 or >110 | AHA normal resting range 60–100 [clinical]. Fit astronauts may sit lower, so personal baseline matters. |
| Systolic BP | 90–119 | 120–139 (elevated/stage 1) or 85–89 | ≥140 or <85 | AHA BP categories [clinical]; low BP matters in space (fainting at landing, NASA CV risk). |
| Diastolic BP | 60–79 | 80–89 | ≥90 or <55 | AHA BP categories [clinical]. |
| Blood glucose (fasting) | 70–99 mg/dL | 100–125 or 60–69 | ≥126 or <60 | ADA: 100–125 prediabetes range, <70 hypoglycemia [clinical]. |
| Body temperature | 36.1–37.4 °C | 37.5–37.9 or 35.5–36.0 | ≥38.0 (fever) or <35.5 | CDC fever definition 38.0 °C / 100.4 °F [clinical]; immune risk (NASA). |
| SpO₂ | 95–100% | 92–94% | <92% | Clinical normal ≥95% [clinical]; hypoxia risk in low-pressure habitats (NASA). |
| Sleep | 7–9 h | 6–6.9 h or 9.1–10 h | <6 or >10 h | AASM/CDC adults ≥7 h [clinical]; NASA sleep risk. |
| Mood (1–10 self-rating) | 6–10 | 4–5 | 1–3 | Team-defined screening scale; NASA behavioral risk. Not a diagnostic. |
| Exercise | ≥90 min/day | 45–89 | <45 | NASA: ISS crews exercise 1.5 h/day, 6–7 days/week. |
| Water intake | ≥2.0 L/day | 1.5–1.9 L | <1.5 L | Team default; NASA links dehydration to kidney stones and fainting at landing. |
| Cumulative radiation | <50% of career limit (<300 mSv) | 50–80% (300–480) | >80% (>480) | NASA career limit 600 mSv (NASA-STD-3001). Bands are our design choice. |
| Body mass | within ±3% of personal baseline | ±3–6% | beyond ±6% | Team-defined; NASA nutrition risk. Relative to the astronaut's own first-week average. |
| Cabin CO₂ | ≤2.5 mmHg | 2.5–3.0 | >3.0 | NASA-STD-3001 Vol 2: ≤3 mmHg (1-h avg); OCHMO: ~2.5 keeps headache risk ~1%. |
| Reaction self-test | within 10% of baseline speed, <3 lapses | ≥10% slower or 3–7 lapses | ≥20% slower or ≥8 lapses | Lapse = response >355 ms (3-min PVT-B). Speed/lapse bands team-defined. |
| Near vision chart | same as baseline | 2–3 lines worse | 4+ lines worse | Change from own first test; SANS near-vision loss. Team-defined bands. |
| Amsler grid | no marks | any distortion marked | — | Any distortion → CMO review (retinal/choroidal folds in SANS). |
| Balance (one leg, eyes open) | ≥20 s | 10–19 s | <10 s | Team-defined screening; only in gravity (Moon/Mars/Earth). |

## 7b. Numbers added in the full build (verified 2026-11-14)

| Fact | Value | Source |
|---|---|---|
| Mars cruise dose (Curiosity RAD) | 1.84 mSv/day | [Space.com](https://www.space.com/23875-mars-radiation-life-manned-mission.html) |
| Mars surface dose (Curiosity RAD) | 0.64 mSv/day | same |
| Moon surface dose (Chang'e-4 LND) | 1.37 mSv/day (ISS at the same time: 0.73) | [ScienceDaily](https://www.sciencedaily.com/releases/2020/09/200926145212.htm) |
| ISS dose used in the app | 0.5 mSv/day (range 0.2–0.7) | NTRS / LND comparison |
| CO₂ limit | ≤3 mmHg, 1-hour average; each +1 mmHg doubled headache odds on ISS | [NASA OCHMO CO₂ brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) |
| Reaction Self-Test | 3-min PVT used on ISS since 2009; taken every 4 days in-flight; response speed is the most sleep-loss-sensitive measure | [NASA Spinoff](https://spinoff.nasa.gov/Spinoff2013/hm_1.html) · [Penn](https://www.med.upenn.edu/uep/cognition.html) |
| SANS symptom | Decreased near vision (hyperopic shift +0.5 to +1.75 D); choroidal folds | [SANS review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7005826/) |
| Exploration atmosphere | 56.5 kPa (8.2 psia), 34% O₂ for surface habitats (team assumption based on NASA's reduced-pressure plans in the HRP hypoxia risk) | [HRP hypoxia risk](https://www.nasa.gov/reference/risk-of-hypoxia/) |
| Near vision optotype | 5 arcmin at 40 cm = 0.58 mm for 20/20 | standard logMAR geometry |

Clinical reference links **[clinical]**:
[AHA blood pressure categories](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings) · [AHA resting heart rate](https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates) · [ADA diabetes diagnosis](https://diabetes.org/about-diabetes/diagnosis) · [CDC fever definition](https://www.cdc.gov/quarantine/maritime/definitions-signs-symptoms-conditions-ill-travelers.html) · [CDC sleep](https://www.cdc.gov/sleep/about/index.html)

> **Team TODO:** a researcher should open each clinical link and confirm the exact numbers before the final submission.

---

## 8. Answers to the challenge's guiding questions (draft for the write-up)

1. **Which measurements can be performed in space?** Heart rate, BP, SpO₂ and temperature (Tempus Pro-type devices); activity and sleep (wrist actigraphy); blood glucose (fingerstick); saliva, blood and urine sampling; **ultrasound** (crew-operated); vision checks; cognitive and balance tests; personal dosimeters; mood and behavioral surveys. All appear in NASA HRP studies above.
2. **Why is an exam needed?** Each maps to a NASA HRP risk (Section 3). Example: BP and HR for cardiovascular adaptation and landing fainting; vision for SANS (~70% of ISS crew affected); temperature and symptoms for immune changes and viral reactivation.
3. **How do hazards affect indicators?** See the hazard and risk tables (Sections 2–3). Example: gravity leads to fluid shift, which causes eye swelling, vision changes and BP changes; isolation leads to worse sleep and mood.
4. **When does a result warrant attention?** Yellow means self-care action plus recheck. Red means notify the crew medical officer and the flight surgeon, flagging the up-to-20-minute one-way delay. Some events are **immediate**: DCS symptoms during EVA mean ending the EVA (NASA protocol); a solar particle event means going to the storm shelter.
5. **What actions prevent a critical condition?** NASA countermeasures: exercise 1.5 h/day, hydration, compression garments and fluid loading before landing, B vitamins and thigh cuffs (SANS research), bisphosphonates (bone), LED lighting and caffeine management (sleep), journaling, plants and family contact (mood), shielding and shelter (radiation), prebreathe (DCS).

---

## 9. Design implications (what research tells us to build)

1. **Personal baselines over population norms.** NASA says effects "vary substantially between individual astronauts". Show the trend versus the astronaut's own preflight baseline, not only fixed ranges.
2. **Offline-first, delay-aware.** Up to a 20-minute one-way delay means the app decides locally and queues messages to Earth.
3. **Explain everything.** The challenge explicitly says not to assume expertise, and NASA's "Systems Operations Support" risk calls for tools crews can use independently.
4. **Body map grouped by HRP risk.** It maps naturally onto NASA's own risk list, and judges will recognize it.
5. **Countermeasures as gamified quests.** Exercise, hydration, sleep routine and journaling are real NASA countermeasures, so gamifying them is defensible.
6. **Environment selector.** The challenge suggests it, and the risks differ between ISS (inside the magnetosphere), transit (weightless and high radiation) and the Moon or Mars (partial gravity, self-egress, gravity transitions).
