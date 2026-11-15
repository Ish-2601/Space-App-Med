import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import * as api from "../src/backend/api.js";
import { AR_GUIDES, guideAlignment } from "../src/backend/arGuides.js";
import {
  createEvaProof,
  verifyEvaProof,
  generateAndSaveEvaProof,
  evaReadiness,
  workloadFor,
} from "../src/backend/crewReadiness.js";
import {
  saveClinicalRecord,
  latestClinicalRecord,
} from "../src/backend/clinicalStore.js";
import { TLX_SCALES } from "../src/backend/assess.js";
import ARCameraGuides, {
  PulseROIOverlay,
} from "../src/components/ARCameraGuides.jsx";
import {
  CrewWorkloadHeatmap,
  EvaBadge,
} from "../src/components/CrewReadiness.jsx";
import Checks from "../src/pages/Checks.jsx";

beforeEach(async () => {
  await api.resetAll();
  vi.stubGlobal("crypto", webcrypto);
});
function readyCrew(pid = "rivera") {
  const state = api.getState(),
    person = state.crew.find((p) => p.id === pid),
    day = state.mission.day;
  Object.assign(api.rowFor(state, pid), person.baseline, {
    sleep: 8,
    spo2: 98,
    radiation: 100,
  });
  state.checkins[pid][day] = {
    auto: false,
    ts: Date.now(),
    symptoms: [],
    values: {},
  };
  state.tests[pid] = [
    {
      id: "tlx-today",
      type: "tlx",
      day,
      result: Object.fromEntries(TLX_SCALES.map((scale) => [scale.id, 30])),
    },
  ];
  state.symptomLog[pid] = [];
  state.bodyDiagnostics = { [pid]: [] };
  state.events = [];
  state.emergencies = [];
  return state;
}

describe("AR positioning guides", () => {
  it("requires both position and angle alignment and rejects invalid coordinates", () => {
    for (const [id, guide] of Object.entries(AR_GUIDES)) {
      expect(
        guideAlignment(id, {
          x: guide.targetX,
          y: guide.targetY,
          angle: guide.angle,
        }).aligned,
      ).toBe(true);
      expect(
        guideAlignment(id, {
          x: guide.targetX + 7,
          y: guide.targetY,
          angle: guide.angle,
        }).aligned,
      ).toBe(false);
      expect(
        guideAlignment(id, {
          x: guide.targetX,
          y: guide.targetY,
          angle: guide.angle + 6,
        }).aligned,
      ).toBe(false);
    }
    expect(() => guideAlignment("onsd", { x: NaN, y: 50, angle: 0 })).toThrow();
    expect(() => guideAlignment("onsd", { x: 0, y: 101, angle: 0 })).toThrow();
    expect(() =>
      guideAlignment("invalid", { x: 50, y: 50, angle: 0 }),
    ).toThrow();
  });
  it("restores saved manual positions separately in public and sandbox histories", () => {
    const publicPosition = {
      guide: "onsd",
      x: 50,
      y: 42,
      angle: 0,
      overlay: true,
    };
    saveClinicalRecord("rivera", "ar-guides", publicPosition);
    api.setSandboxMode(true);
    expect(
      latestClinicalRecord(api.getState(), "rivera", "ar-guides"),
    ).toBeNull();
    saveClinicalRecord(
      "rivera",
      "ar-guides",
      { ...publicPosition, x: 30 },
      { draft: true },
    );
    expect(
      latestClinicalRecord(api.getState(), "rivera", "ar-guides", {
        includeDrafts: true,
      }).payload.x,
    ).toBe(30);
    api.setSandboxMode(false);
    expect(
      latestClinicalRecord(api.getState(), "rivera", "ar-guides").payload.x,
    ).toBe(50);
  });
  it("renders opt-in camera, manual fallback, four guides and distinct active pulse ROI", () => {
    const person = api.getState().crew[0];
    const html = renderToStaticMarkup(<ARCameraGuides person={person} />);
    for (const text of [
      "Ocular ONSD",
      "Bladder self-ultrasound",
      "Pupillometry",
      "Contactless rPPG",
      "Enable camera",
      "Horizontal position",
      "Save positioning rehearsal",
      "camera off",
    ])
      expect(html).toContain(text);
    expect(html).not.toContain("autoplay");
    expect(renderToStaticMarkup(<PulseROIOverlay />)).toContain(
      "FOREHEAD · ACTIVE ROI",
    );
    expect(renderToStaticMarkup(<PulseROIOverlay visible={false} />)).toBe("");
  });
  it("opens the bladder guide through existing medical-check navigation", () => {
    const html = renderToStaticMarkup(
      <Checks
        person={api.getState().crew[0]}
        go={() => {}}
        params={{ check: "ar-bladder" }}
      />,
    );
    expect(html).toContain('aria-pressed="true">Bladder');
    expect(html).toContain("Heart rate");
  });
});

describe("Public workload and privacy-preserving proof demo", () => {
  it("does not turn missing or incomplete TLX into a low-workload result", () => {
    const state = readyCrew();
    state.tests.rivera = [];
    expect(workloadFor(state, "rivera")).toMatchObject({
      tlx: null,
      sleepDebt: 0,
      fatigue: null,
    });
    state.tests.rivera.push({
      type: "tlx",
      day: state.mission.day,
      result: { mental: 20 },
    });
    expect(workloadFor(state, "rivera").tlx).toBeNull();
    state.tests.rivera[0].day--;
    expect(evaReadiness(state, "rivera").eligible).toBe(false);
  });
  it("combines today's six TLX dimensions and sleep debt transparently", () => {
    const state = readyCrew();
    api.rowFor(state, "rivera").sleep = 5;
    expect(workloadFor(state, "rivera")).toMatchObject({
      tlx: 30,
      sleepDebt: 3,
      fatigue: 42,
    });
    const html = renderToStaticMarkup(<CrewWorkloadHeatmap />);
    expect(html).toContain("Raw TLX");
    expect(html).toContain("42 / 100");
    expect(html).toContain("Awaiting data");
  });
  it("creates a real verifiable transcript with no persisted secret or exact readings", async () => {
    const state = readyCrew();
    expect(evaReadiness(state, "rivera").eligible).toBe(true);
    const proof = await generateAndSaveEvaProof("rivera");
    expect(await verifyEvaProof(state, "rivera", proof)).toBe(true);
    expect(state.evaProofs.rivera).toEqual(proof);
    expect(Object.keys(proof).sort()).toEqual([
      "announcements",
      "commitments",
      "createdAt",
      "responses",
      "statement",
    ]);
    expect(JSON.stringify(proof)).not.toMatch(
      /sleep|spo2|secret|witness|heartRate/,
    );
  });
  it("rejects changed responses, altered claims, wrong identities and stale days", async () => {
    const state = readyCrew(),
      proof = await createEvaProof(state, "rivera");
    expect(
      await verifyEvaProof(state, "rivera", {
        ...proof,
        responses: ["0", ...proof.responses.slice(1)],
      }),
    ).toBe(false);
    expect(await verifyEvaProof(state, "chen", proof)).toBe(false);
    expect(
      await verifyEvaProof(state, "rivera", {
        ...proof,
        commitments: ["1", ...proof.commitments.slice(1)],
      }),
    ).toBe(false);
    const altered = JSON.parse(JSON.stringify(proof));
    altered.statement.purpose = "Clearance";
    expect(await verifyEvaProof(state, "rivera", altered)).toBe(false);
    state.mission.day++;
    expect(await verifyEvaProof(state, "rivera", proof)).toBe(false);
  });
  it("invalidates the proof when public readings change, even while remaining above criteria", async () => {
    const state = readyCrew(),
      proof = await createEvaProof(state, "rivera");
    api.rowFor(state, "rivera").sleep = 7.9;
    expect(evaReadiness(state, "rivera").eligible).toBe(true);
    expect(await verifyEvaProof(state, "rivera", proof)).toBe(false);
  });
  it("verifies every true-bit opening and rejects missing or reordered proofs", async () => {
    const state = readyCrew(),
      proof = await createEvaProof(state, "rivera");
    expect(proof.commitments).toHaveLength(6);
    const changedLast = {
      ...proof,
      responses: [...proof.responses.slice(0, 5), "0"],
    };
    expect(await verifyEvaProof(state, "rivera", changedLast)).toBe(false);
    expect(
      await verifyEvaProof(state, "rivera", {
        ...proof,
        commitments: proof.commitments.slice(0, 5),
      }),
    ).toBe(false);
    expect(
      await verifyEvaProof(state, "rivera", {
        ...proof,
        announcements: proof.announcements.slice().reverse(),
      }),
    ).toBe(false);
  });
  it("never reads private logs when calculating, generating or verifying public readiness", async () => {
    const state = readyCrew();
    Object.defineProperty(state, "privateSandboxRecords", {
      configurable: true,
      get() {
        throw new Error("Private log accessed");
      },
    });
    const proof = await createEvaProof(state, "rivera");
    expect(await verifyEvaProof(state, "rivera", proof)).toBe(true);
    expect(workloadFor(state, "rivera").tlx).toBe(30);
    const html = renderToStaticMarkup(
      <EvaBadge person={state.crew.find((p) => p.id === "rivera")} />,
    );
    expect(html).toContain("This local demo proves the committed bits");
    expect(html).toContain("Fit-for-EVA demo proof available");
    delete state.privateSandboxRecords;
  });
  it("refuses to issue a fit badge for incomplete checks or active emergencies", async () => {
    const state = readyCrew();
    state.emergencies.push({ id: "current", pid: "rivera", resolvedAt: null });
    await expect(createEvaProof(state, "rivera")).rejects.toThrow("readiness");
    state.emergencies = [];
    state.checkins.rivera[state.mission.day].auto = true;
    await expect(createEvaProof(state, "rivera")).rejects.toThrow("readiness");
  });
});
