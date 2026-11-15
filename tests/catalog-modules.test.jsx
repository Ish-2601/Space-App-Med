import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/backend/api.js";
import {
  CATALOG_MODULES,
  getCatalogModule,
  catalogModuleDefaults,
  evaluateCatalogModule,
  saveCatalogModule,
  launchCatalogModule,
  savePrivateCatalogDraft,
} from "../src/backend/catalogModules.js";
import { setSandboxMode } from "../src/backend/sandbox.js";
import { clinicalRecords } from "../src/backend/clinicalStore.js";
import CatalogModuleModal, {
  catalogModuleFocusTargets,
} from "../src/components/catalog/CatalogModuleModal.jsx";
import Trends, { headacheTrendRows } from "../src/pages/Trends.jsx";
import Body from "../src/pages/Body.jsx";

beforeEach(() => api.resetAll());
function usable(module) {
  const values = catalogModuleDefaults(module);
  module.fields
    .filter((f) => f.type === "textarea" && values[f.key] === "")
    .forEach((f) => {
      values[f.key] = "Crew observation for review";
    });
  return values;
}
function publicState(state) {
  return JSON.stringify({
    history: state.history,
    notifications: state.notifications,
    reports: state.reports,
    clinicalRecords: state.clinicalRecords,
    checkins: state.checkins,
  });
}

describe("100 explicit catalog software launchers", () => {
  it("covers each exact ID once with a real route or a runnable standalone form", () => {
    expect(CATALOG_MODULES.map((m) => m.id)).toEqual(
      Array.from({ length: 100 }, (_, i) => 901 + i),
    );
    const routes = new Set([
      "body",
      "learn",
      "today",
      "trends",
      "medguide",
      "emergency",
      "checks",
      "catalog",
      "medkit",
      "body-gut",
      "body-kidneys",
      "body-heart",
      "quests",
      "body-brain",
      "earth",
      "crew",
      "body-vestibular",
      "body-bones",
      "body-immune",
      "checkin",
      "summary",
      "radiation",
      "checklists",
    ]);
    for (const module of CATALOG_MODULES) {
      expect(routes.has(module.targetRoute), String(module.id)).toBe(true);
      if (module.standalone) {
        expect(module.fields.length).toBeGreaterThan(0);
        expect(typeof module.calculate).toBe("function");
      }
      if (module.action) expect(module.launchNotice.length).toBeGreaterThan(20);
    }
    expect(getCatalogModule(899)).toBeNull();
  });
  it("launches direct tools with their specific selection and leaves standalone tools to the modal", () => {
    const go = vi.fn();
    for (const module of CATALOG_MODULES) {
      go.mockClear();
      const outcome = launchCatalogModule(module.id, { pid: "okafor", go });
      expect(outcome.standalone).toBe(module.standalone);
      if (module.standalone) expect(go).not.toHaveBeenCalled();
      else expect(go).toHaveBeenCalledWith(module.targetRoute, module.params);
    }
    expect(api.getState().emergencies).toHaveLength(0);
    expect(() => launchCatalogModule(901, { pid: "missing", go })).toThrow(
      "crew",
    );
  });
  it("changes real chart preferences, map layer, sandbox and judge-delay settings", () => {
    const go = vi.fn();
    launchCatalogModule(923, { pid: "okafor", go });
    expect(
      api.getState().settings.chartPreferences.okafor.headache,
    ).toMatchObject({ mode: "personal", overlay: "co2" });
    expect(go).toHaveBeenCalledWith(
      "trends",
      expect.objectContaining({ indicator: "headache" }),
    );
    launchCatalogModule(969, { pid: "okafor", go });
    expect(api.getState().settings.bodyMapLayer).toBe("eva");
    launchCatalogModule(906, { pid: "okafor", go });
    expect(api.getState().settings.privateSandbox).toBe(true);
    launchCatalogModule(999, { pid: "okafor", go });
    expect(api.getState().link.judgesDemo40).toBe(true);
  });
});

describe("standalone simulations and privacy", () => {
  it("keeps modal focus on visible controls when saved history is collapsed", () => {
    const close = { disabled: false, getClientRects: () => [{}] };
    const historySummary = { tagName: "SUMMARY", getClientRects: () => [{}] };
    historySummary.contains = (control) => control === historySummary;
    const history = {
      tagName: "DETAILS",
      open: false,
      children: [historySummary],
      parentElement: null,
    };
    historySummary.parentElement = history;
    const collapsedReview = {
      disabled: false,
      getClientRects: () => [{}],
      parentElement: history,
    };
    const nestedHistory = {
      tagName: "DETAILS",
      open: true,
      children: [],
      parentElement: history,
    };
    const nestedReview = {
      getClientRects: () => [{}],
      parentElement: nestedHistory,
    };
    const disabledAction = { disabled: true, getClientRects: () => [{}] };
    const element = {
      querySelectorAll: vi.fn(() => [
        close,
        disabledAction,
        historySummary,
        collapsedReview,
        nestedReview,
      ]),
    };
    expect(catalogModuleFocusTargets(element)).toEqual([close, historySummary]);
    expect(element.querySelectorAll).toHaveBeenCalledWith(
      expect.stringContaining("summary"),
    );
    history.open = true;
    expect(catalogModuleFocusTargets(element)).toEqual([
      close,
      historySummary,
      collapsedReview,
      nestedReview,
    ]);
  });
  for (const module of CATALOG_MODULES.filter((m) => m.standalone)) {
    it(`${module.id} calculates, renders and saves its own module-specific workflow`, () => {
      const values = usable(module);
      const evaluated = evaluateCatalogModule(module.id, values);
      expect(evaluated.result.headline.length).toBeGreaterThan(3);
      expect(evaluated.result.explanation.length).toBeGreaterThan(15);
      expect(JSON.stringify(evaluated)).not.toMatch(/NaN|Infinity|undefined/);
      saveCatalogModule(module.id, "okafor", values);
      const saved = clinicalRecords(
        api.getState(),
        "okafor",
        "catalog-" + module.id,
      );
      expect(saved).toHaveLength(1);
      expect(saved[0].payload.result).toEqual(evaluated.result);
      const html = renderToStaticMarkup(
        <CatalogModuleModal
          item={{ id: module.id }}
          person={api.getState().crew.find((p) => p.id === "okafor")}
          onClose={() => {}}
          go={() => {}}
        />,
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain("Evaluate &amp; save locally");
      expect(html).toContain("Module result");
      expect(html).toContain(module.title.replaceAll("&", "&amp;"));
    });
  }
  it("rejects nonfinite and out-of-bounds values, invalid options and physically impossible vessel traces", () => {
    const values = usable(getCatalogModule(913));
    for (const width of ["", NaN, Infinity, 0, 31])
      expect(() => evaluateCatalogModule(913, { ...values, width })).toThrow();
    expect(() =>
      evaluateCatalogModule(912, {
        ...usable(getCatalogModule(912)),
        eye: "Both",
      }),
    ).toThrow();
    expect(() =>
      evaluateCatalogModule(917, {
        ...usable(getCatalogModule(917)),
        path: 40,
        chord: 80,
      }),
    ).toThrow("shorter");
    expect(() => evaluateCatalogModule(983, { csv: "ARED,20,nope" })).toThrow(
      "Row 1",
    );
    expect(() =>
      evaluateCatalogModule(949, { packet: "not json", bandwidth: 64 }),
    ).toThrow("valid JSON");
    expect(() =>
      evaluateCatalogModule(996, {
        ...usable(getCatalogModule(996)),
        tasks: 8,
        planned: 7,
      }),
    ).toThrow("exceed");
  });
  it("computes dimensional estimates, consumption and posterior probability correctly", () => {
    const volume = evaluateCatalogModule(913, {
      width: 6,
      height: 5,
      depth: 7,
    });
    expect(volume.result.metrics[0].value).toBe("109.2 mL");
    const probability = evaluateCatalogModule(909, {
      prior: 10,
      sensitivity: 80,
      specificity: 90,
      test: "Positive",
    });
    expect(probability.result.metrics[0].value).toBe("47.06%");
    const supplies = evaluateCatalogModule(933, {
      item: "Bandage",
      stock: 10,
      usage: 2,
      lead: 8,
    });
    expect(supplies.result.metrics.map((m) => m.value)).toEqual([
      "5",
      "16",
      "6",
    ]);
    const fluids = evaluateCatalogModule(962, {
      head: 0,
      arms: 9,
      torso: 18,
      legs: 0,
      perineum: 0,
      rate: 120,
      hours: 2,
    });
    expect(fluids.result.metrics.map((m) => m.value)).toEqual([
      "27%",
      "240 mL",
    ]);
  });
  it("keeps all standalone outputs private and never changes public health, notifications or reports", () => {
    setSandboxMode(true);
    const before = publicState(api.getState());
    for (const module of CATALOG_MODULES.filter((m) => m.standalone))
      saveCatalogModule(module.id, "okafor", usable(module));
    expect(publicState(api.getState())).toBe(before);
    expect(
      api
        .getState()
        .privateSandboxRecords.filter((r) =>
          r.kind.startsWith("clinical:catalog-"),
        ),
    ).toHaveLength(CATALOG_MODULES.filter((m) => m.standalone).length);
    setSandboxMode(false);
    expect(
      clinicalRecords(api.getState(), "okafor", "catalog-913"),
    ).toHaveLength(0);
  });
  it("captured-private cleanup stays private after the global mode switches OFF and chest pain requests escalation", () => {
    setSandboxMode(true);
    const values = { ...usable(getCatalogModule(908)), symptom: "Chest pain" };
    saveCatalogModule(908, "okafor", values);
    expect(api.getState().privateSandboxRecords[0]).toMatchObject({
      escalationStatus: "pending",
      payload: { chestPain: true },
    });
    setSandboxMode(false);
    const before = publicState(api.getState());
    savePrivateCatalogDraft(908, "okafor", values);
    expect(publicState(api.getState())).toBe(before);
    expect(api.getState().privateSandboxRecords[0]).toMatchObject({
      draft: true,
      private: true,
      escalationStatus: "pending",
    });
  });
});

describe("precise chart and digital-twin entry points", () => {
  it("does not invent symptom-free observations for unreported days", () => {
    const state = api.getState(),
      pid = "okafor";
    state.checkins[pid] = {
      1: { auto: true, symptoms: [] },
      2: { auto: false, symptoms: [], ts: 100 },
      3: { auto: false, symptoms: ["headache"], ts: 200 },
    };
    state.symptomLog[pid] = [{ day: 5, symptom: "headache", ts: 300 }];
    state.bodyDiagnostics = {
      [pid]: [
        { day: 7, answers: { headache: false }, ts: 400 },
        { day: 8, answers: { rash: false }, ts: 500 },
      ],
    };
    expect(headacheTrendRows(state, pid)).toEqual([
      { day: 2, value: 0 },
      { day: 3, value: 1 },
      { day: 5, value: 1 },
      { day: 7, value: 0 },
    ]);
    const html = renderToStaticMarkup(
      <Trends
        person={state.crew.find((p) => p.id === pid)}
        params={{ indicator: "headache" }}
      />,
    );
    expect(html).toContain("Recorded headache observations");
    expect(html).toContain("health-trend-chart");
  });
  it("opens the digital-twin drawer directly from forecast launchers", () => {
    const state = api.getState();
    const html = renderToStaticMarkup(
      <Body person={state.crew[0]} params={{ openTwin: true }} go={() => {}} />,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Bone Mineral Density");
    expect(html).toContain('id="digital-twin"');
  });
});
