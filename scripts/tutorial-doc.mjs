// Builds docs/TUTORIAL.md from src/data/tutorial.js so the document and the in-app tutorial never drift.
// Usage: npm run docs:tutorial
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TUTORIAL, ALL_STEPS, SOURCE_TIERS } from "../src/data/tutorial.js";

export function tutorialMarkdown() {
  const L = [];
  L.push("# NASA Med: tutorial and test run", "");
  L.push("> Generated from `src/data/tutorial.js` by `npm run docs:tutorial`. The same steps are in the app: **More → Tutorial and test run** (or the lobby link, or the end of the Judge tour), where you can mark each step **Works** or **Problem** and copy a test report.", "");
  L.push(`**${ALL_STEPS.length} steps in ${TUTORIAL.length} chapters.** Before a test run: Demo controls → Reset all data, so every expected result below matches.`, "");
  L.push("Demo crew stories: **A. Chen** (commander) slowing reaction times, poor sleep and high workload · **T. Okafor** (flight engineer) near vision 2 lines worse and borderline blood pressure · **M. Rivera** (medical officer) the healthy control · **K. Sato** (mission specialist) body-mass loss and eating less.", "");
  const tiers = Object.fromEntries(Object.keys(SOURCE_TIERS).map((t) => [t, ALL_STEPS.filter((s) => s.source.tier === t).length]));
  L.push("## Where the data comes from", "");
  L.push("| Source tier | Steps | Meaning |", "|---|---|---|");
  for (const [t, label] of Object.entries(SOURCE_TIERS)) L.push(`| ${label} | ${tiers[t]} | ${{ challenge: "The NASA HRP and CSA pages listed as resources on the Space Apps challenge", nasa: "Other official NASA documents (standards, technical briefs, checklists)", clinical: "Published clinical ranges, used only where NASA gives no number", app: "The app's own model or simulated demo data, labelled on screen" }[t]} |`);
  L.push("", "See `docs/NASA-VALIDATION.md` for the line-by-line check of every NASA figure.", "");
  L.push("## Contents", "");
  TUTORIAL.forEach((c, i) => L.push(`${i + 1}. [${c.title}](#${String(i + 1).padStart(2, "0")}-${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}) (${c.steps.length} steps)`));
  L.push("");
  let n = 0;
  TUTORIAL.forEach((c, i) => {
    L.push(`## ${String(i + 1).padStart(2, "0")} ${c.title}`, "", c.intro, "");
    for (const s of c.steps) {
      n++;
      L.push(`### ${String(n).padStart(2, "0")}. ${s.title}`, "");
      L.push(`**Why:** ${s.why}`, "");
      L.push(`**Open:** ${s.go.lobby ? "the crew lobby" : "`#/<crew>/" + s.go.page + "`"}`, "");
      L.push("**Try it:**", "");
      s.try.forEach((t, k) => L.push(`${k + 1}. ${t}`));
      L.push("", `**You should see:** ${s.expect}`, "");
      L.push(`**Data:** ${SOURCE_TIERS[s.source.tier]}: ${s.source.url ? `[${s.source.label}](${s.source.url})` : s.source.label}`, "");
      L.push("- [ ] Works  - [ ] Problem: ______", "");
    }
  });
  return L.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "TUTORIAL.md");
  writeFileSync(out, tutorialMarkdown() + "\n");
  console.log("wrote", out);
}
