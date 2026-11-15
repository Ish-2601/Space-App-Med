# UI research and the rules NASA Med now follows

Researched on 2026-11-14. **Honest scope:** about 15 design systems and guides plus the interfaces of the apps in RESEARCH-APPS.md, not 100+ separate sites. The implementation is `src/clean.css`, which loads after the team's `console.css` and replaces its decorative parts.

## Sources

- [Material Design dark theme](https://m2.material.io/design/color/dark-theme): use dark grey rather than black; show elevation with lighter surfaces; AA contrast of 4.5:1; lighter, desaturated tones for colour.
- [NHS spacing](https://service-manual.nhs.uk/design-system/styles/spacing) and [typography](https://service-manual.nhs.uk/design-system/styles/typography): responsive spacing and type scales.
- [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale): text at 14 px and below is bad for accessibility, so it is avoided.
- IBM Carbon, Atlassian, HSE and Queensland Health: an 8 px base unit with 4 px half-steps ([8-point grid](https://spec.fm/specifics/8-pt-grid)).
- Apple Health: a Summary tab of favourites and highlights; the iOS 13 redesign cut navigation to two tabs.
- Oura 2025 redesign: five tabs became three; the scores sit at the top with one daily insight below; it moved to a more open layout.
- Dashboard guidance: size and white space show priority; group with space rather than boxes; reveal detail step by step.
- Medical alarm human factors ([APSF](https://www.apsf.org/article/alarm-fatigue-and-patient-safety/)): a few clearly different urgency levels; show priority in several ways at once (word, icon, position, colour).
- [NASA Ames colour usage guidelines](https://colorusage.arc.nasa.gov/guidelines_specific.php): luminance contrast and colour used sparingly in displays.

## Rules applied (the brief: white space, hierarchy, few fonts and colours, simple navigation)

| Rule | How |
|---|---|
| **White space and consistent spacing** | One 8-point scale (4, 8, 12, 16, 24, 32, 48). 24 px between cards and 24 px inside them everywhere; no more mixed 30, 32, 35 and 40 px gaps |
| **Visual hierarchy** | Page title 32 → card heading 20 → body 15 → labels 13; one primary (filled) button per area; the most urgent item ("Do this next") sits top right next to the score |
| **One typeface** | Inter / Segoe UI / system font everywhere; the monospace capital-letter labels are gone |
| **No text under 12 px** | More than 70 rules at 8–11 px raised to 12–14 px, including the phone layouts |
| **60-30-10 colour** | 60% deep background `#0b1118`, 30% surfaces `#121a24`/`#19232f`, 10% one accent `#8ec9ff` for actions, links, selection and the active tab |
| **Status colour only means status** | Green, amber and coral are brighter than before so they are easy to tell apart, and always come with an icon and a word |
| **Remove decoration that does nothing** | Removed bracket corners, floating badge titles, grid-line background, glows, gradients, the "ONBOARD SYSTEMS" dock caption and duplicate titles |
| **Familiar navigation** | 4 bottom tabs with plain labels (Today, Body, Help, Crew) plus More, and a red Emergency button always in the same place; address-bar routing so Back works |
| **Accessible** | Same 3 px focus ring everywhere, 44 px minimum touch targets, reduced-motion support, night mode (dim red) and larger text |
| **Print** | The health summary prints as plain black on white |
