// The first-visit guided tour must keep pointing at real elements on each screen.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import * as api from "../src/backend/api.js";
import GuidedTour, { TOUR_STEPS } from "../src/components/GuidedTour.jsx";
import Today from "../src/pages/Today.jsx";
import Body from "../src/pages/Body.jsx";
import BodyHealth from "../src/pages/BodyHealth.jsx";
import Emergency from "../src/pages/Emergency.jsx";
import CrewSelect from "../src/components/CrewSelect.jsx";
import ConsoleShell from "../src/components/ConsoleShell.jsx";

const realStorage = globalThis.localStorage;
const fakeStorage = (data) => ({ getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v), removeItem: (k) => delete data[k] });
beforeEach(async () => {
  await api.resetAll();
});
afterEach(() => {
  globalThis.localStorage = realStorage;
});
const okafor = () => api.getState().crew.find((p) => p.id === "okafor");
const noop = () => {};

describe("guided tour", () => {
  it("shows the welcome popup on a first visit", () => {
    globalThis.localStorage = fakeStorage({});
    const html = renderToStaticMarkup(<GuidedTour />);
    expect(html).toContain("Welcome to NASA Med");
    expect(html).toContain("Start the guided tour");
    expect(html).toContain("Skip for now");
  });
  it("after the first visit, only a Tutorial button stays at the bottom", () => {
    globalThis.localStorage = fakeStorage({ "nasa-med-onboarding": "done" });
    const html = renderToStaticMarkup(<GuidedTour />);
    expect(html).not.toContain("Welcome to NASA Med");
    expect(html).toContain("gt-pill");
    expect(html).toContain("Tutorial");
  });
  it("every step has a screen, a target, a title and plain instructions", () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(12);
    for (const s of TOUR_STEPS) {
      expect(s.hash).toMatch(/^#\//);
      expect(s.target && s.title && s.text).toBeTruthy();
      if (s.click) expect(s.text).toMatch(/Click/);
    }
  });
  it("the elements it points at exist on each screen", () => {
    const p = okafor();
    const screens = {
      lobby: renderToStaticMarkup(<CrewSelect onSelect={noop} onMedical={noop} />),
      today: renderToStaticMarkup(<Today person={p} go={noop} />),
      body: renderToStaticMarkup(<Body person={p} go={noop} />),
      eyes: renderToStaticMarkup(<BodyHealth person={p} go={noop} partKey="eyes" />),
      emergency: renderToStaticMarkup(<Emergency person={p} go={noop} params={{}} />),
      shell: renderToStaticMarkup(<ConsoleShell person={p} page="today" go={noop} onSwitch={noop} onOpenPerson={noop}><div /></ConsoleShell>),
    };
    expect(screens.lobby).toContain("crew-grid");
    expect(screens.lobby).toContain('id="crew-name-okafor"');
    for (const c of ["telemetry-ribbon", "hero-card", "next-steps", "segmented", "vitals-grid"]) expect(screens.today).toContain(c);
    expect(screens.body).toContain("bm-stage");
    expect(screens.body).toMatch(/aria-label="Eyes/);
    expect(screens.eyes).toContain("page-title");
    for (const c of ["tile-grid", "triage-results", "triage-alert"]) expect(screens.emergency).toContain(c);
    for (const c of ["dock-pages", "dock-item", "tour-pill"]) expect(screens.shell).toContain(c);
  });
});
