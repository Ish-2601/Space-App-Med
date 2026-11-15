import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, it, expect } from "vitest";
import * as api from "../src/backend/api.js";
import { indicators } from "../src/lib.js";
import { HEALTH_AREAS } from "../src/data/healthAreas.js";
import { GROUPS, activeGroup } from "../src/components/navigation.js";
import ConsoleShell from "../src/components/ConsoleShell.jsx";
import BodyHealth from "../src/pages/BodyHealth.jsx";
import Today from "../src/pages/Today.jsx";

beforeEach(async () => {
  await api.resetAll();
});
const person = () => api.getState().crew.find((p) => p.id === "okafor");
const review = (part, overrides = {}) => ({
  values: Object.fromEntries(
    indicators
      .filter((i) => i.bodyPart === part)
      .map((i) => [i.id, api.rowFor(api.getState(), "okafor")[i.id]]),
  ),
  answers: Object.fromEntries(
    HEALTH_AREAS[part].symptoms.map((s) => [s, false]),
  ),
  sleepQuality: "Good",
  stress: 3,
  ...overrides,
});
const shell = () =>
  renderToStaticMarkup(
    <ConsoleShell
      person={person()}
      page="today"
      go={() => {}}
      onSwitch={() => {}}
      onOpenPerson={() => {}}
    >
      <div>Home</div>
    </ConsoleShell>,
  );

describe("Home and navigation", () => {
  it("has exactly the requested four destinations in order", () => {
    expect(GROUPS.map((g) => g.label)).toEqual([
      "Home",
      "Body",
      "Emergency",
      "Users",
    ]);
    expect(activeGroup("body-brain")).toBe("body");
    expect(activeGroup("review-lungs")).toBe("body");
  });
  it("shows the mission, explicit score denominator, daily tasks and diagnostics", () => {
    const html = renderToStaticMarkup(
      <Today person={person()} go={() => {}} />,
    );
    for (const text of [
      "Current mission",
      api.getState().mission.name,
      " / 100",
      "Today&#x27;s routine",
      "Daily diagnostics",
      "Simulate emergency",
    ])
      expect(html).toContain(text);
  });
  it("shows the global banner only for an active emergency and clears it after ending", () => {
    expect(shell()).not.toContain('class="console-banner"');
    api.startEmergency("chen", "faint", { simulated: true });
    expect(shell()).toContain("Emergency simulation");
    expect(shell()).toContain("A. Chen");
    api.resolveEmergency(api.getState().emergencies[0].id, {
      endedEarly: true,
    });
    expect(shell()).not.toContain('class="console-banner"');
  });
  it("preserves storm and cabin-fault banners", () => {
    api.startSolarEvent(40);
    expect(shell()).toContain("Solar storm.");
    api.endSolarEvent();
    api.setCo2Fault(true);
    expect(shell()).toContain("scrubber fault");
    api.setCo2Fault(false);
    expect(shell()).not.toContain('class="console-banner"');
  });
});

describe("Focused body diagnostics", () => {
  it("reflects today's journal completion on the head screen", () => {
    api.addJournal("okafor", "A quiet moment after the day's tasks.");
    const html = renderToStaticMarkup(<BodyHealth person={person()} go={() => {}} partKey="brain" />);
    expect(html).toContain("Complete");
    expect(html).toContain("Open journal");
    expect(html).not.toContain("Incomplete");
  });
  it("saves head wellbeing and readings without completing the daily check-in or changing anyone else", () => {
    const other = JSON.stringify(api.rowFor(api.getState(), "chen"));
    const checkin = JSON.stringify(api.getState().checkins.okafor);
    api.saveBodyDiagnostic(
      "okafor",
      "brain",
      review("brain", {
        values: { sleep: 8, mood: 7 },
        stress: 4,
        sleepQuality: "Restful",
      }),
    );
    expect(
      api.latestBodyDiagnostic(api.getState(), "okafor", "brain"),
    ).toMatchObject({ stress: 4, sleepQuality: "Restful" });
    expect(api.rowFor(api.getState(), "okafor")).toMatchObject({
      sleep: 8,
      mood: 7,
    });
    expect(JSON.stringify(api.getState().checkins.okafor)).toBe(checkin);
    expect(JSON.stringify(api.rowFor(api.getState(), "chen"))).toBe(other);
    expect(api.buildHealthSummary(api.getState(), "okafor")).toContain(
      "Sleep quality: Restful",
    );
    expect(api.buildHealthSummary(api.getState(), "okafor")).toContain(
      "Stress: 4/10",
    );
  });
  it.each(Object.keys(HEALTH_AREAS))(
    "supports an independent %s review and summary",
    (part) => {
      api.saveBodyDiagnostic("okafor", part, review(part));
      const html = renderToStaticMarkup(
        <BodyHealth person={person()} go={() => {}} partKey={part} />,
      );
      expect(html).toContain(HEALTH_AREAS[part].title);
      expect(html).toContain("Take diagnostic check");
      expect(
        api.latestBodyDiagnostic(api.getState(), "okafor", part)?.part,
      ).toBe(part);
    },
  );
  it("uses the latest symptom answer while preserving unrelated symptoms", () => {
    api.logSymptom("okafor", "rash");
    api.saveBodyDiagnostic(
      "okafor",
      "brain",
      review("brain", {
        answers: {
          headache: true,
          nausea: false,
          dizzy: false,
          lowmood: false,
        },
      }),
    );
    expect(
      api.symptomsToday(api.getState(), "okafor").map((s) => s.id),
    ).toEqual(expect.arrayContaining(["rash", "headache"]));
    // Ensure ordering when two reviews share the same timestamp.
    api.saveBodyDiagnostic("okafor", "brain", review("brain"));
    expect(
      api.symptomsToday(api.getState(), "okafor").map((s) => s.id),
    ).not.toContain("headache");
    expect(
      api.symptomsToday(api.getState(), "okafor").map((s) => s.id),
    ).toContain("rash");
    api.logSymptom("okafor", "headache");
    expect(
      api.symptomsToday(api.getState(), "okafor").map((s) => s.id),
    ).toContain("headache");
    api.submitCheckIn("okafor", { symptoms: ["rash"] });
    expect(
      api.symptomsToday(api.getState(), "okafor").map((s) => s.id),
    ).not.toContain("headache");
  });
  it("rejects incomplete answers and invalid measurements before making changes", () => {
    const original = JSON.stringify(api.getState());
    expect(() =>
      api.saveBodyDiagnostic(
        "okafor",
        "brain",
        review("brain", { answers: {} }),
      ),
    ).toThrow(/Yes or No/);
    expect(() =>
      api.saveBodyDiagnostic(
        "okafor",
        "brain",
        review("brain", { stress: 15 }),
      ),
    ).toThrow(/stress/);
    expect(() =>
      api.saveBodyDiagnostic(
        "okafor",
        "lungs",
        review("lungs", { values: { spo2: 101 } }),
      ),
    ).toThrow(/valid/);
    expect(JSON.stringify(api.getState())).toBe(original);
  });
  it("keeps older saved state compatible and does not fabricate missing scores", () => {
    delete api.getState().bodyDiagnostics;
    api.getState().tests.okafor = [];
    expect(
      api.latestBodyDiagnostic(api.getState(), "okafor", "brain"),
    ).toBeNull();
    expect(api.bodyHealthScore(api.getState(), "okafor", "eyes")).toBeNull();
  });
});
