import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { parseHash } from "../src/router.js";
import { nextStepTitle } from "../src/pages/Today.jsx";
import Today from "../src/pages/Today.jsx";
import Emergency from "../src/pages/Emergency.jsx";
import * as api from "../src/backend/api.js";

beforeEach(async () => {
  await api.resetAll();
});
const okafor = () => api.getState().crew.find((p) => p.id === "okafor");

describe("address-bar routes", () => {
  it("reads the lobby, a crew member's page and the CMO view", () => {
    expect(parseHash("")).toEqual({ who: "", page: "" });
    expect(parseHash("#/")).toEqual({ who: "", page: "" });
    expect(parseHash("#/okafor/body")).toEqual({ who: "okafor", page: "body" });
    expect(parseHash("#/cmo/crew")).toEqual({ who: "cmo", page: "crew" });
  });
});

describe("Do this next wording", () => {
  it("turns readings into instructions and keeps others readable", () => {
    expect(nextStepTitle({ id: "ind-systolic", indicator: "systolic", title: "Blood pressure (systolic): 138 mmHg" })).toBe("Recheck your blood pressure");
    expect(nextStepTitle({ id: "check-acuity", title: "Near vision chart: worse" })).toMatch(/vision change/);
    expect(nextStepTitle({ id: "sym-headache", title: "Symptom reported: Headache" })).toBe("See what to do: headache");
    expect(nextStepTitle({ id: "spe", title: "Solar storm: go to the storm shelter now" })).toBe("Solar storm: go to the storm shelter now");
    expect(nextStepTitle(undefined)).toBeNull();
  });

  it("every alert for every crew member gets a non-empty next step", () => {
    const s = api.getState();
    for (const p of s.crew) {
      for (const a of api.alertsFor(s, p.id)) expect(nextStepTitle(a)).toBeTruthy();
    }
  });

  it("Today leads with an action and shows the reading as the reason", () => {
    const html = renderToStaticMarkup(<Today person={okafor()} go={() => {}} />);
    expect(html).toContain("Recheck your blood pressure");
    expect(html).toContain("priority-reason");
  });
});

describe("Emergency screen", () => {
  it("offers a one-tap crew alert before the protocol list", () => {
    const html = renderToStaticMarkup(<Emergency person={okafor()} go={() => {}} params={{}} />);
    const alertAt = html.indexOf("Alert the crew now");
    expect(alertAt).toBeGreaterThan(-1);
    expect(alertAt).toBeLessThan(html.indexOf("Start protocol"));
  });
});
