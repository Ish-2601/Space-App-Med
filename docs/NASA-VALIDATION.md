# NASA data validation

Checked on 2026-11-14 against the live challenge resources. Every number below is locked by `tests/nasa-data.test.js`.

**Result:** the app matches NASA's published data. 9 statements went beyond what the sources say and were reworded or re-sourced (listed at the end). The clinical ranges (heart rate, blood pressure and so on) are **not from NASA**: the challenge sources give no numbers for them, so they come from Earth clinical guidelines and are labeled as prototype thresholds.

## 1. The six challenge sources

| Source | What the app uses | Status |
|---|---|---|
| [NASA HRP: 5 Hazards](https://www.nasa.gov/hrp/hazards/) | 5 hazards; Mars about 140 million miles away; about 3-year mission; Mars gravity 3/8 g | ✅ Exact |
| [Distance from Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/) | Up to 20 min one-way delay; crews must be self-sufficient | ✅ Exact (Mars transit demo uses 14 min) |
| [Gravity Fields](https://www.nasa.gov/hrp/hazard-gravity-fields/) | Bone loss 1–1.5%/month; fluids shift to the head; kidney stones from dehydration + bone calcium; time to adapt before critical tasks | ✅ Exact |
| [Isolation and Confinement](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/) | Behavioral health monitoring; HERA 45 days; CHAPEA year-long; journaling; gardening | ✅ Exact |
| [Hostile/Closed Environments](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/) | Microbes change and transfer more easily; stress hormones and immune changes | ✅ Exact (wording tightened) |
| [Space Radiation](https://www.nasa.gov/hrp/hazard-space-radiation/) | Invisible and unfelt; cancer, CNS, cognitive and motor effects | ✅ Exact (wording tightened) |
| [NASA HRP: Risks](https://www.nasa.gov/hrp/risks/) | All 17 risks, same names and same URLs | ✅ 17 of 17 |
| [Ongoing HRP research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | B-Complex and Thigh Cuff (SANS, "under study"); Standard Measures; Space Gardening; enhanced diet | ✅ Exact (Tempus Pro is now a past study; label fixed) |
| [CSA: Monitoring radiation](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Neutrons are about 30% of ISS radiation | ✅ Exact |
| [CSA: Why science in space](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | More weightlessness, radiation, isolation and delay; less help from Earth | ✅ Consistent |

## 2. Numbers from the 17 NASA risk pages

| App figure | NASA page says | Status |
|---|---|---|
| Strength and aerobic loss 10–12% | "average losses … are 10-12% of pre-mission levels" | ✅ |
| 12–38% of crew lose over 20% | "between 12-38% … lose more than 20%" | ✅ |
| Exercise 1.5 h/day, 6–7 days/week (90-min goal) | Same | ✅ |
| Bone loss 1–1.5%/month; fracture and osteoporosis risk; bisphosphonates | Same | ✅ |
| Height up to 3% taller | "height … can increase as much as 3%" | ✅ |
| About 70% of ISS astronauts have eye swelling (SANS) | "Approximately 70 percent" | ✅ |
| 16 sunrises a day; LED lighting; caffeine | Same | ✅ |
| Heart becomes more spherical; clots; arrhythmias; fainting at landing; compression garments and fluids | Same | ✅ |
| Dormant viruses (cold sores, shingles); rashes; allergies | Same | ✅ |
| Majority of astronauts get motion sickness | "The majority of astronauts experience motion sickness" | ✅ |
| Mild hypoxia: confusion, headaches, vision problems, poor sleep | Same | ✅ |
| Prebreathe protocols; suit biomedical monitoring | Same | ✅ |
| Self-egress after Moon and Mars landings | Same | ✅ |
| Radiation can affect heart, blood vessels and eyes; CNS effects | Same | ✅ |
| Journaling, windows, privacy, family contact | Same | ✅ |

## 3. Figures from other NASA documents (not on the challenge pages)

| App figure | Source | Status |
|---|---|---|
| Career radiation limit 600 mSv | NASA-STD-3001 Vol. 1 ([OCHMO radiation brief](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf)) | ✅ |
| 250 mSv per solar particle event | NASA-STD-3001 Vol. 1 | ✅ (added to the Learn screen) |
| CO₂ limit 3 mmHg, 1-hour average | NASA-STD-3001 Vol. 2 ([OCHMO CO₂ brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)) | ✅ |
| Each +1 mmHg CO₂ doubles headache odds | Law et al. (NASA), *J Occup Environ Med* 2014 | ✅ |
| CO₂ 2.5 mmHg "yellow" line | Recommended by the Law et al. NASA study (7-day average), **not** a NASA standard | ⚠️ Relabeled "recommended" |
| Reaction Self-Test: 3 minutes, on the ISS since 2009 | [NASA Spinoff 2013](https://spinoff.nasa.gov/Spinoff2013/hm_1.html) | ✅ |
| Dose rates: Mars transit 1.84, Mars surface 0.64 mSv/day | Curiosity RAD (Zeitlin 2013, Hassler 2014) | ✅ |
| Moon surface 1.37 mSv/day | Chang'e-4 LND (1,369 µSv/day, 2020) | ✅ |
| ISS about 0.5 mSv/day | Typical published range is about 0.3–0.8 | ✅ Approximate |
| Exploration atmosphere 56.5 kPa / 34% O₂ | NASA Exploration Atmospheres Working Group; **team assumption** for Moon/Mars bases | ⚠️ Assumption, documented |

## 4. Not from NASA (labeled as prototype thresholds)

Resting heart rate, blood pressure, SpO₂, glucose, temperature, sleep hours, mood scale, 2 L/day water and ±3%/±6% body mass. These come from AHA, ADA and CDC guidance or are team choices. The app compares each person with their own baseline, which follows NASA's point that effects vary between astronauts.

## 5. What was changed

1. "Reaction Self-Test … ISS crews took it every 4 days": **no NASA source**. Now says NASA scheduled it periodically and around sleep shifts, and that every 4 days is the app's choice.
2. Mars transit note "Earth delay 4–24 min": changed to NASA's "up to 20 min".
3. CO₂ 2.5 mmHg "NASA target": relabeled as the level a NASA study recommends. The Habitat chart now shows "Recommended 2.5" and "NASA limit 3 (1-h avg)".
4. Radiation hazard facts: "doses several times higher" and "crews shelter…" are not on NASA's page. Replaced with NASA's own statements.
5. Radiation-cancer countermeasures: "storm shelters" replaced with NASA's "shielding for Artemis and Gateway"; added the 250 mSv solar event limit.
6. Microbes: "pre-flight quarantine" is not on NASA's page. Now "disinfectants, anti-inflammatories and antibiotics (under study)".
7. Decompression sickness: "end the spacewalk" replaced with NASA's "variable-pressure suits (in development)".
8. Teamwork: "shared activities" replaced with NASA's crew selection and recovering after conflicts.
9. SANS wording now matches NASA ("folds in the retina, flattening of the back of the eye"). The near-vision claim is credited to the SANS review.
