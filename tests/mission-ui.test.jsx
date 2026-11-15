// Mission UI overhaul: Home hero + tabs, next steps, vitals, judge tour, emergency step runner.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, it, expect } from "vitest";
import * as api from "../src/backend/api.js";
import Today, { nextStepTitle } from "../src/pages/Today.jsx";
import Emergency from "../src/pages/Emergency.jsx";
import { nextSteps, VitalsGrid, HOME_TABS } from "../src/components/HomeHero.jsx";
import { TOUR } from "../src/components/JudgeTour.jsx";
import { PAGES } from "../src/components/Dashboard.jsx";

beforeEach(async () => {
  await api.resetAll();
});
const person = (id = "chen") => api.getState().crew.find((p) => p.id === id);
const home = (id) => renderToStaticMarkup(<Today person={person(id)} go={() => {}} />);

describe("Home hero and progressive disclosure", () => {
  it("leads with the telemetry ribbon, health ring hero and next steps", () => {
    const html = home("chen");
    expect(html).toContain("telemetry-ribbon");
    expect(html).toContain('id="health-summary"');
    expect(html).toContain("Health score");
    expect(html).toContain("Start 8-step daily check-in"); // not checked in yet
    expect(html).toContain("Do this next");
  });
  it("keeps every section in the page; tabs only hide the inactive ones", () => {
    const html = home("chen");
    for (const text of ["Today&#x27;s routine", "Live vitals", "Connected biometric wearables", "Consistency", "Simulate emergency"]) expect(html).toContain(text);
    expect(html.match(/class="home-tab-panel[^"]*"[^>]*hidden=""/g)).toHaveLength(2); // plan tab open by default
    expect(HOME_TABS.map((t) => t[0])).toEqual(["plan", "vitals", "crew", "all"]);
  });
  it("shows at most 3 next steps, most urgent first", () => {
    const s = api.getState();
    const alerts = api.alertsFor(s, "chen").filter((a) => a.level !== "info");
    const steps = nextSteps(s, "chen", alerts, nextStepTitle, () => {}, () => {});
    expect(steps.length).toBeLessThanOrEqual(3);
    expect(steps[0].title).toBe(nextStepTitle(alerts[0]));
    expect(steps[0].pill).toBe("Priority 1");
  });
  it("vitals cards show value, baseline delta and a sparkline", () => {
    const html = renderToStaticMarkup(<VitalsGrid person={person("okafor")} go={() => {}} />);
    expect(html.match(/class="vital-card/g)).toHaveLength(8);
    expect(html).toContain("vs your baseline");
    expect(html).toContain("% of career limit");
    expect(html).toContain("sparkline");
  });
});

describe("Judge tour", () => {
  it("every stop opens a real screen", () => {
    const ids = new Set(PAGES.map((p) => p.id));
    expect(TOUR.length).toBe(6);
    for (const stop of TOUR) expect(ids.has(stop.page)).toBe(true);
  });
});

describe("Emergency cockpit runner", () => {
  it("shows tactical protocol cards with severity", () => {
    const html = renderToStaticMarkup(<Emergency person={person("okafor")} go={() => {}} params={{}} />);
    expect(html).toContain("sev-pill sev-critical");
    expect(html).toContain("Equipment and countermeasures");
  });
  it("puts the first unfinished step in a large focus card", () => {
    api.startEmergency("okafor", "faint");
    let html = renderToStaticMarkup(<Emergency person={person("okafor")} go={() => {}} params={{}} />);
    expect(html).toMatch(/Do now · step 1 of 6/);
    const em = api.getState().emergencies[0];
    api.toggleEmergencyStep(em.id, 0);
    html = renderToStaticMarkup(<Emergency person={person("okafor")} go={() => {}} params={{}} />);
    expect(html).toMatch(/Do now · step 2 of 6/);
    expect(html).toContain("protocol-step  current");
  });
});
