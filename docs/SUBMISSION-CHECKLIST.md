# Space App Med: submission checklist

Checked on 2026-11-15 against the three official pages:

- Challenge: [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) (dated November 13, 2026)
- [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide) (dated November 13, 2026)

**Deadline: Sunday, November 15, 11:59 PM, in your Local Event's time zone.** Work saved or submitted after that is not judged.

Status key: ✅ done · 🟡 partly done · ⬜ the team must do this on the Space Apps website · ❓ needs a team answer

---

## 1. Eligibility (fail any of these and the project is not judged globally)

| Rule | Status | Notes |
| --- | --- | --- |
| Answers an official challenge | ✅ | "Create Health Monitoring Software for Astronauts on Space Missions" |
| Every member registered, on the **same Local Event**, not waitlisted, listed on the team's Members tab | ⬜ | Check the Members tab now. New members can't be added after submission closes. 1–6 members. |
| All required project fields filled in | ⬜ | See section 2 |
| Demo: **video of 30 seconds or less** or **at most 7 slides** (title and intro slides count) | ⬜ | Going over either limit removes the project from global judging |
| Everything in English (page and linked material) | ✅ app · ⬜ page | The app, README and docs are in English. A video in another language needs English subtitles. |
| Both boxes ticked: Terms & Conditions, and "all work is original / all external resources listed" | ⬜ | Second box: every outside resource must be in the References field (section 2) |
| Press **Submit for Judging** before the deadline | ⬜ | A banner confirms success. You can resubmit until the deadline; the last saved version is judged. |
| No images, video, audio or likeness of anyone **under 18** | ✅ app · ⬜ demo | The app ships no photos of people (crew photos start empty; the avatars are silhouettes). Keep under-18s out of the demo video too. |
| At least one NASA data source or resource (for a Global Award) | ✅ | 44 NASA links: the 21 challenge resources plus 23 other NASA documents. See `docs/NASA-VALIDATION.md` §6. |

## 2. Project page fields

| Field | Status | What to use |
| --- | --- | --- |
| Project name | ⬜ | **Space App Med** |
| High-level summary | ⬜ | What it is, how it answers the challenge, why it matters |
| Link to project demo | ⬜ | Public link (YouTube, Google Drive, GitHub…) with no login. Test it in a private window. |
| Link to final project | ✅ ready · ⬜ paste | Live app: `https://ish-2601.github.io/space-app-med/` once the repo is renamed (section 6); until then `https://ish-2601.github.io/astro-health/`. Code: the GitHub repository. |
| Detailed description | ⬜ | What it does, how it works, benefits, goals, tools (React 18, Vite 5, Recharts, Vitest, browser camera API, IndexedDB, service worker for offline use) |
| Use of SI (AI) | ⬜ | Not shown to judges, but answer truthfully: name the AI tools used and what for (code, text). Early lobby mockups were AI-generated and have been removed from the project. |
| NASA data | ✅ ready · ⬜ paste | NASA Human Research Program: the 5 hazards, the 17 risk pages and evidence, OCHMO technical briefs, ISS research results. Full list in `docs/NASA-VALIDATION.md`. |
| Space agency partner data and other references | ✅ ready · ⬜ paste | CSA (a 2026 partner agency) health resources, the non-NASA clinical references in `docs/NASA-VALIDATION.md` §4, and the libraries: React, React DOM, Recharts, Vite, Vitest (all MIT). Also the starfield background image (see ❓ below). |

## 3. Content rules

| Rule | Status | Notes |
| --- | --- | --- |
| No NASA logos, insignia, flags or mission identifiers; nothing that implies NASA endorsement | ✅ | New original Space App Med mark (cross plus orbit). The name has no "NASA" in it. The lobby, Learn page and README say "Built for the NASA Space Apps Challenge 2026. Not affiliated with or endorsed by NASA." |
| AI-generated content may not contain NASA branding | ✅ | The two AI lobby mockups showed the old "NASA Med" title, so they were deleted from `public/` and `docs/`. The app never displayed them. |
| AI images and video carry a **visible watermark**; AI code, data or audio is acknowledged in text and metadata | 🟡 | No AI images remain in the app. If the demo video uses AI visuals or voice, watermark or label them. Mention AI-assisted code in the description. |
| Starfield background `public/space-app-med-galaxy.png` | ❓ | Who made it? If it's **AI-generated**, it needs a visible "AI-generated" label (or replace it). If it's a **stock or downloaded image**, credit it in References and confirm the license allows this use. |
| Copyrighted material only with permission | ✅ | No third-party media besides the starfield (above). Text is the team's own; facts are cited. |
| SI must not have produced the core idea | ⬜ | Explain in the description how the team chose the idea |

## 4. The challenge's objectives

| Objective (challenge page) | Status | Where in the app |
| --- | --- | --- |
| A visual tool for astronauts to assess their own health | ✅ | Home: health score, status hero, next steps; colour-coded vitals |
| Gives guidance on treatment and improving health | ✅ | Next steps, Emergency protocols with step-by-step runner, medication guide, countermeasures on every body system |
| Input of any kind: keyboard, mouse, camera images | ✅ | Typed readings, tap and drag tests (Amsler grid, reaction time), camera pulse (rPPG) and photo log |
| Indicators: blood pressure, heart rate, blood sugar (mg/dL), temperature, sleep hours, mood | ✅ | All six are recorded, charted and colour-coded. Mood stays in the daily check-in but is left out of the emergency diagnosis, as playtesting asked. |
| Use HRP and other agency resources to pick useful indicators | ✅ | Each indicator links to its source; Learn page maps the 5 hazards and 17 HRP risks |
| Clear metric display; animation and interactivity | ✅ | Glass cards, animated rings, live vitals tab, guided tour |
| A clickable human figure showing each body part's function and status | ✅ | Body screen: glowing body with coloured status badges; each opens a system page |

## 5. "Potential considerations" (optional hints)

| Hint | Status | Where |
| --- | --- | --- |
| Different environments: spacecraft, station, rover, base | ✅ | Mission Control → environment: ISS, Mars transit, Moon base, Mars base and (new) **Mars rover traverse**. Each changes radiation dose, gravity, Earth delay and which body systems to watch. |
| Prompt measurements and actions as part of the routine | ✅ | Daily check-in, scheduled checks by interval (`dueChecks`), medication timing, "Today's checks" on the lobby |
| Gamification | ✅ | Quests page, check-in streaks and achievements |
| Dynamic charts over time | ✅ | Trends page and sparklines on every vital card |
| Colour coding at a glance | ✅ | Green, amber and red status everywhere, with text labels too (not colour alone) |
| Simple instructions; don't assume medical knowledge | ✅ | "How to measure" steps on each check, Learn page, guided tour and a 50-step tutorial |

## 6. The challenge's guiding questions

| Question | Status | Answered in |
| --- | --- | --- |
| Which measurements can be done in space? | ✅ | Learn page "Guiding questions"; Checks lists only space-feasible checks and skips ones that don't apply in microgravity |
| Why is an exam needed? | ✅ | Every check has a "why" line linked to its HRP risk |
| How do the hazards affect the indicators? | ✅ | Learn page hazard → risk → indicator map |
| When does a result need the crew or flight surgeons? | ✅ | Thresholds raise alerts; red flags tell the user to call the CMO or the flight surgeon; Earth-link page with message delay |
| What actions prevent a critical condition? | ✅ | Countermeasures on each body system and Emergency protocols |

## 7. Judging criteria (each scored 1–5)

| Criterion | Strength | What would raise it |
| --- | --- | --- |
| **Impact** | Self-care when Earth is 20 minutes away; also useful for remote medicine on Earth | Say the Earth use case (Antarctic stations, ships, remote clinics) in the demo |
| **Creativity** | Fast-diagnosis triage, glowing body map, camera pulse, environment switching, private crew mode | Show the 10-second emergency diagnosis in the demo |
| **Validity** | 438 automated tests, every threshold cited, works offline, playtested and fixed | Mention testing and sources on one slide |
| **Relevance** | Built on NASA HRP hazards and risks; 44 NASA sources; covers every objective above | Name the NASA data on screen in the demo, as the guide asks |
| **Presentation** | Polished UI, guided tour and tutorial | ⬜ **This depends on the demo.** The guide says to give it equal attention to the other four. |

## 8. Left to do, in order

1. ❓ **Settle the starfield background** (section 3): credit it, label it, or let us swap in a generated one.
2. ⬜ **Rename the GitHub repository** to `space-app-med` (Settings → General → Repository name), then update your local remote:
   `git remote set-url origin https://github.com/Ish-2601/space-app-med.git`
   GitHub Pages moves to `https://ish-2601.github.io/space-app-med/`. Open it once and check it loads. (Optional: the submission guide suggests asking FortiGuard to classify a new website so judges' networks don't block it.)
3. ⬜ **Record the demo**: 30 seconds or less, or at most 7 slides, in English, with team name, members and challenge. Suggested 30 s: who you are (0–2 s) → the problem (2–5 s) → "Space App Med" (5–10 s) → live fast diagnosis plus body map, naming the NASA HRP data (10–20 s) → the future (20–30 s).
4. ⬜ Upload the demo with a **public** link and test it in a private window.
5. ⬜ Fill in every field in section 2 and save often.
6. ⬜ Check every teammate is on the Members tab at the same Local Event.
7. ⬜ Tick both boxes and press **Submit for Judging** well before 11:59 PM.
