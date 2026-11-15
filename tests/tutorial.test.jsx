// The tutorial must stay accurate: real screens, complete steps, honest sources, and docs in sync.
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, it, expect } from "vitest";
import * as api from "../src/backend/api.js";
import { TUTORIAL, ALL_STEPS, SOURCE_TIERS } from "../src/data/tutorial.js";
import Tutorial, { testReport } from "../src/pages/Tutorial.jsx";
import { PAGES } from "../src/components/Dashboard.jsx";
import { tutorialMarkdown } from "../scripts/tutorial-doc.mjs";

beforeEach(async () => {
  await api.resetAll();
});
const CHALLENGE = /^https:\/\/(www\.nasa\.gov\/(hrp\/|reference\/risk)|www\.asc-csa\.gc\.ca\/)/;

describe("tutorial content", () => {
  it("covers every chapter with complete, uniquely named steps", () => {
    expect(TUTORIAL.length).toBe(9);
    expect(ALL_STEPS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(ALL_STEPS.map((s) => s.id)).size).toBe(ALL_STEPS.length);
    for (const s of ALL_STEPS) {
      expect(s.title && s.why && s.expect, s.id).toBeTruthy();
      expect(s.try.length, s.id).toBeGreaterThan(0);
    }
  });
  it("every Open button goes to a real screen (or the lobby)", () => {
    const ids = new Set(PAGES.map((p) => p.id));
    for (const s of ALL_STEPS) {
      if (s.go.lobby) continue;
      expect(ids.has(s.go.page), `${s.id} → ${s.go.page}`).toBe(true);
    }
  });
  it("labels every source honestly", () => {
    for (const s of ALL_STEPS) {
      expect(Object.keys(SOURCE_TIERS)).toContain(s.source.tier);
      if (s.source.tier === "challenge") expect(s.source.url, s.id).toMatch(CHALLENGE);
      if (s.source.tier === "nasa") expect(s.source.url, s.id).toMatch(/nasa\.gov/);
      if (s.source.tier === "app") expect(s.source.url).toBeNull();
    }
  });
  it("rests mostly on the challenge's required NASA/CSA resources", () => {
    const challenge = ALL_STEPS.filter((s) => s.source.tier === "challenge").length;
    expect(challenge / ALL_STEPS.length).toBeGreaterThan(0.6);
  });
});

describe("expected results match the demo data", () => {
  it("lobby scores", () => {
    const o = Object.fromEntries(api.crewOverview(api.getState()).map((r) => [r.person.id, r.score]));
    expect(ALL_STEPS.find((s) => s.id === "lobby").expect).toContain(`A. Chen ${o.chen}%`);
    expect(ALL_STEPS.find((s) => s.id === "lobby").expect).toContain(`T. Okafor ${o.okafor}%`);
    expect(o.rivera).toBe(100);
  });
  it("Okafor's first next step is the blood pressure recheck", () => {
    const a = api.alertsFor(api.getState(), "okafor").filter((x) => x.level !== "info")[0];
    expect(a.title).toBe("Blood pressure (systolic): 138 mmHg");
  });
  it("Sato's eating-less alert and the urine shade 6 wording", () => {
    expect(api.alertsFor(api.getState(), "sato").some((x) => x.id === "trend-meals")).toBe(true);
    expect(api.evaluateUrine(6).summary).toBe("colour 6 of 8: drink about 500 mL and recheck");
  });
});

describe("tutorial screen", () => {
  it("renders the first chapter with Open, Works and Problem controls", () => {
    const person = api.getState().crew.find((p) => p.id === "okafor");
    const html = renderToStaticMarkup(<Tutorial person={person} go={() => {}} onSwitch={() => {}} />);
    expect(html).toContain("Learn and test every feature");
    expect(html).toContain("Open the lobby");
    expect(html).toContain("Works");
    expect(html).toContain("Problem");
    expect(html).toContain("0</b> of " + ALL_STEPS.length + " tested");
  });
  it("builds a shareable test report", () => {
    const report = testReport({ lobby: { result: "pass" }, nav: { result: "fail", note: "Back button" } }, "T. Okafor");
    expect(report).toContain("Works: 1 · Problems: 1");
    expect(report).toContain("[BUG]  Move around with the bottom bar — Back button");
  });
  it("docs/TUTORIAL.md is up to date (run npm run docs:tutorial)", () => {
    // Git on Windows may check the file out with CRLF line endings; compare the text, not the line endings.
    const norm = (t) => t.replace(/\r\n/g, "\n").trim();
    expect(norm(readFileSync("docs/TUTORIAL.md", "utf8"))).toBe(norm(tutorialMarkdown()));
  });
});
