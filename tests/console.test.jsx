import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PAGES } from "../src/components/Dashboard.jsx";
import CrewSelect from "../src/components/CrewSelect.jsx";
import Body from "../src/pages/Body.jsx";
import Checks from "../src/pages/Checks.jsx";
import Emergency from "../src/pages/Emergency.jsx";
import Radiation from "../src/pages/Radiation.jsx";
import { bodyParts } from "../src/lib.js";
import * as api from "../src/backend/api.js";

beforeEach(async () => {
  await api.resetAll();
});
const props = (params = {}) => ({
  person: api.getState().crew.find((p) => p.id === "okafor"),
  params,
  go: () => {},
  onSwitch: () => {},
  onOpenPerson: () => {},
});

describe("console route integration", () => {
  it.each(PAGES.map((p) => [p.id, p.C]))(
    "renders %s with mission data",
    (_, Component) => {
      const html = renderToStaticMarkup(<Component {...props()} />);
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
      expect(html.length).toBeGreaterThan(100);
    },
  );
  it("renders the crew lobby with all four selectable profiles", () => {
    const html = renderToStaticMarkup(
      <CrewSelect onSelect={() => {}} onMedical={() => {}} />,
    );
    for (const p of api.getState().crew) expect(html).toContain(p.name);
    expect(html).toContain("Crew profiles");
  });
  it.each(Object.keys(bodyParts))("renders %s body details", (part) => {
    expect(renderToStaticMarkup(<Body {...props({ part })} />)).not.toContain(
      "NaN",
    );
  });
  it.each(["amsler", "hr", "acuity", "pvt", "balance"])(
    "renders the %s measurement workspace",
    (check) => {
      // The calibrated vision chart reads the browser's physical pixel ratio.
      vi.stubGlobal("window", { devicePixelRatio: 1 });
      try {
        expect(
          renderToStaticMarkup(<Checks {...props({ check })} />),
        ).toContain("Your results");
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );
  it("renders active emergency and solar event states", () => {
    api.startEmergency("okafor", "faint");
    expect(renderToStaticMarkup(<Emergency {...props()} />)).toContain(
      "Patient vitals",
    );
    api.startSolarEvent(40);
    expect(renderToStaticMarkup(<Radiation {...props()} />)).toContain(
      "Storm shelter",
    );
    api.endSolarEvent();
    expect(renderToStaticMarkup(<Radiation {...props()} />)).toContain(
      "All-clear",
    );
  });
});

describe("emergency records", () => {
  it("updates only the patient's readings and queues a priority update without completing their check-in", () => {
    const other = api.rowFor(api.getState(), "rivera").heartRate;
    api.startEmergency("okafor", "faint");
    const em = api.getState().emergencies[0];
    const checkin = api.getState().checkins.okafor[120];
    api.saveEmergencyVitals(em.id, {
      heartRate: "72",
      systolic: "118",
      diastolic: "76",
      spo2: "98",
    });
    expect(api.rowFor(api.getState(), "okafor").heartRate).toBe(72);
    expect(api.rowFor(api.getState(), "rivera").heartRate).toBe(other);
    expect(api.getState().checkins.okafor[120]).toEqual(checkin);
    expect(em.vitals.spo2).toBe(98);
    expect(api.getState().reports[0]).toMatchObject({
      pid: "okafor",
      priority: true,
      kind: "emergency",
    });
    expect(api.getState().reports[0].text).toContain("118/76");
  });
  it("rejects missing and invalid vitals without changing the record", () => {
    api.startEmergency("okafor", "faint");
    const em = api.getState().emergencies[0];
    const before = { ...api.rowFor(api.getState(), "okafor") };
    for (const bad of [
      { heartRate: "", systolic: 118, diastolic: 76, spo2: 98 },
      { heartRate: 70, systolic: 118, diastolic: 76, spo2: 120 },
    ]) {
      expect(() => api.saveEmergencyVitals(em.id, bad)).toThrow();
    }
    expect(api.rowFor(api.getState(), "okafor")).toEqual(before);
    expect(em.vitals).toBeUndefined();
  });
  it("does not create duplicate active protocols", () => {
    api.startEmergency("okafor", "faint");
    api.startEmergency("okafor", "faint");
    expect(api.activeEmergencies(api.getState(), "okafor")).toHaveLength(1);
    expect(api.getState().reports).toHaveLength(1);
  });
});

describe("storm checklist", () => {
  it("keeps individual event steps and blocks all-clear steps during a storm", () => {
    api.startSolarEvent(40);
    const ev = api.activeEvent(api.getState());
    api.toggleShelterStep(ev.id, "okafor", 1);
    api.toggleShelterStep(ev.id, "okafor", 2);
    api.toggleShelterStep(ev.id, "okafor", 3);
    expect(ev.checklists.okafor[1]).toBe(true);
    expect(ev.checklists.okafor[2]).toBeUndefined();
    expect(ev.checklists.okafor[3]).toBeUndefined();
    expect(ev.checklists.rivera).toBeUndefined();
    api.getState().crew.forEach((p) => api.setSheltered(p.id, true));
    api.toggleShelterStep(ev.id, "okafor", 2);
    expect(ev.checklists.okafor[2]).toBe(true);
    api.endSolarEvent();
    api.toggleShelterStep(ev.id, "okafor", 3);
    api.toggleShelterStep(ev.id, "okafor", 4);
    expect(ev.checklists.okafor[4]).toBe(true);
    api.startSolarEvent(40);
    expect(api.activeEvent(api.getState()).checklists).toBeUndefined();
  });
});
