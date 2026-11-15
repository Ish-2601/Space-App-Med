import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import * as api from "../src/backend/api.js";
import { SPACEFLIGHT_CATALOG_1000 } from "../src/data/spaceflightCatalog1000.ts";
import {
  catalogActionFor,
  catalogDisplayName,
  catalogHistory,
  catalogItem,
  catalogStock,
  filterCatalog,
  logCatalogAction,
  saveCatalogDraft,
} from "../src/backend/catalog.js";
import { latestClinicalRecord } from "../src/backend/clinicalStore.js";
import SpaceflightCatalog from "../src/pages/SpaceflightCatalog.jsx";
import CatalogItemCard from "../src/components/catalog/CatalogItemCard.jsx";
import More from "../src/pages/More.jsx";
import MedKit from "../src/pages/MedKit.jsx";
import { PAGES } from "../src/components/Dashboard.jsx";
import {
  CATALOG_MODULES,
  saveCatalogModule,
} from "../src/backend/catalogModules.js";

beforeEach(async () => {
  await api.resetAll();
});

describe("Complete catalog search and entry points", () => {
  it("resolves every focused launcher to a real element on its destination screen", () => {
    const person = api.getState().crew[0];
    for (const module of CATALOG_MODULES.filter(
      (entry) => !entry.standalone && entry.params.catalogFocus,
    )) {
      const Page = PAGES.find((page) => page.id === module.targetRoute).C;
      const html = renderToStaticMarkup(
        <Page
          person={person}
          go={() => {}}
          params={module.params}
          onSwitch={() => {}}
          onOpenPerson={() => {}}
        />,
      );
      expect(html, `Missing focus target for catalog #${module.id}`).toContain(
        `id="${module.params.catalogFocus}"`,
      );
    }
  });
  it("searches all 1,000 entries including the last item and normalizes LaTeX and accents", () => {
    expect(filterCatalog()).toHaveLength(1000);
    expect(
      filterCatalog({ query: "#1000" }).some((item) => item.id === 1000),
    ).toBe(true);
    expect(filterCatalog({ query: "#1000" }).map((item) => item.id)).toEqual([
      1000,
    ]);
    expect(
      filterCatalog({ query: "digital health passport" }).map(
        (item) => item.id,
      ),
    ).toContain(1000);
    expect(filterCatalog({ query: "Drager" }).map((item) => item.id)).toContain(
      727,
    );
    expect(
      filterCatalog({ query: "CO2 headache" }).map((item) => item.id),
    ).toContain(923);
    expect(catalogDisplayName(catalogItem(9).name)).toContain("SpO2");
  });
  it("combines category, system, type and color filters without dropping domain items", () => {
    for (let categoryId = 1; categoryId <= 10; categoryId++)
      expect(filterCatalog({ categoryId })).toHaveLength(100);
    const item = catalogItem(211);
    expect(
      filterCatalog({
        categoryId: 3,
        bodySystem: item.linkedBodySystem,
        itemType: item.itemType,
        packColor: item.nasaPackColor,
        query: "Ketorolac",
      }),
    ).toEqual([item]);
    expect(filterCatalog({ ids: [1, 1000] }).map((item) => item.id)).toEqual([
      1, 1000,
    ]);
    expect(filterCatalog({ ids: [] })).toEqual([]);
  });
  it("offers an executable action for every item and preserves the existing route set", () => {
    expect(new Set(SPACEFLIGHT_CATALOG_1000.map(catalogActionFor))).toEqual(
      new Set(["launch", "dispense", "log", "check"]),
    );
    expect(
      SPACEFLIGHT_CATALOG_1000.filter(
        (item) => catalogActionFor(item) === "launch",
      ),
    ).toHaveLength(100);
    for (const route of [
      "today",
      "body",
      "emergency",
      "more",
      "catalog",
      "medkit",
    ])
      expect(PAGES.some((page) => page.id === route)).toBe(true);
    expect(Object.keys(api.getState().crew)).toHaveLength(4);
  });
  it("renders the entire explorer's counts, filters, pagination and two directory entries", () => {
    const person = api.getState().crew[0];
    const markup = renderToStaticMarkup(
      <SpaceflightCatalog person={person} go={() => {}} />,
    );
    expect(markup.match(/data-catalog-id=/g) || []).toHaveLength(24);
    expect(markup).toContain("1,000 of 1,000 entries");
    expect(markup).toContain("All 10 body systems");
    expect(markup).toContain("Catalog result pages");
    expect(
      renderToStaticMarkup(<More go={() => {}} onSwitch={() => {}} />),
    ).toContain("1,000-Item Spaceflight Catalog");
    expect(
      renderToStaticMarkup(<MedKit person={person} go={() => {}} />),
    ).toContain("Open all 1,000 items");
    expect(
      renderToStaticMarkup(
        <CatalogItemCard
          item={catalogItem(1000)}
          person={person}
          go={() => {}}
        />,
      ),
    ).toContain("Launch Module");
  });
});

describe("Catalog stock and local usage workflows", () => {
  it("shows software evaluations in the catalog history without exposing private module records", () => {
    const values = {
      phase: "In-orbit",
      summary: "Demo mission overview",
      goals: "Scheduled review",
      clinician: "Not yet reviewed",
    };
    saveCatalogModule(1000, "chen", values);
    expect(
      catalogHistory(api.getState(), "chen", 1000)[0].payload,
    ).toMatchObject({
      itemId: 1000,
      action: "module",
      result: "Local passport entry",
    });
    api.setSandboxMode(true);
    saveCatalogModule(1000, "chen", { ...values, summary: "PRIVATE PASSPORT" });
    expect(catalogHistory(api.getState(), "chen", 1000)).toHaveLength(1);
    expect(catalogHistory(api.getState(), "okafor", 1000)).toHaveLength(0);
    api.setSandboxMode(false);
    expect(catalogHistory(api.getState(), "chen", 1000)).toHaveLength(1);
    expect(api.exportData()).not.toContain("PRIVATE PASSPORT");
  });
  it("shares public inventory consumption across crew without inventing medical readings", () => {
    const item = catalogItem(209),
      state = api.getState();
    const previousKit = JSON.stringify(state.medkit),
      score = api.healthScore(state, "chen");
    const saved = logCatalogAction("chen", item.id, {
      quantity: 2,
      authorized: true,
      note: "Inventory rehearsal",
    });
    expect(saved.payload).toMatchObject({
      action: "dispense",
      quantity: 2,
      itemId: 209,
      simulated: true,
    });
    expect(catalogStock(state, item.id, "okafor")).toBe(item.stockQty - 2);
    expect(JSON.stringify(state.medkit)).toBe(previousKit);
    expect(api.healthScore(state, "chen")).toBe(score);
    expect(state.reports).toHaveLength(0);
    expect(state.notifications).toHaveLength(0);
  });
  it("isolates private dispensing and drafts from public inventory and other users", () => {
    const item = catalogItem(209),
      state = api.getState();
    logCatalogAction("chen", item.id, { quantity: 1, authorized: true });
    api.setSandboxMode(true);
    logCatalogAction("chen", item.id, {
      quantity: 2,
      authorized: true,
      note: "PRIVATE CATALOG NOTE",
    });
    saveCatalogDraft("chen", item.id, { note: "PRIVATE DRAFT" });
    expect(catalogStock(state, item.id, "chen")).toBe(item.stockQty - 3);
    expect(catalogStock(state, item.id, "okafor")).toBe(item.stockQty - 1);
    expect(catalogHistory(state, "chen", item.id)).toHaveLength(1);
    expect(api.exportData()).not.toContain("PRIVATE CATALOG NOTE");
    expect(api.exportData()).not.toContain("PRIVATE DRAFT");
    api.setSandboxMode(false);
    expect(catalogStock(state, item.id, "chen")).toBe(item.stockQty - 1);
    expect(catalogHistory(state, "chen", item.id)[0].payload.quantity).toBe(1);
    expect(latestClinicalRecord(state, "chen", "catalog-draft-209")).toBeNull();
  });
  it("rejects invalid stock operations and medical use without approval acknowledgement", () => {
    expect(() => logCatalogAction("chen", 209, { quantity: 1 })).toThrow(
      /approved/,
    );
    for (const quantity of [-1, 0, 1.5, NaN, Infinity, 1001])
      expect(() =>
        logCatalogAction("chen", 209, { quantity, authorized: true }),
      ).toThrow();
    const item = catalogItem(209);
    logCatalogAction("chen", item.id, {
      quantity: item.stockQty,
      authorized: true,
    });
    expect(catalogStock(api.getState(), item.id, "chen")).toBe(0);
    expect(() =>
      logCatalogAction("chen", item.id, { quantity: 1, authorized: true }),
    ).toThrow(/stock/);
    expect(() => logCatalogAction("unknown", 1, {})).toThrow();
    expect(() => logCatalogAction("chen", 1001, {})).toThrow();
    expect(() => logCatalogAction("chen", 901, {})).toThrow();
  });
  it("records real checklist and recovery-session outcomes without consuming reusable tools", () => {
    const hardware = catalogItem(1),
      activity = SPACEFLIGHT_CATALOG_1000.find(
        (item) => catalogActionFor(item) === "log",
      );
    expect(() =>
      logCatalogAction("chen", hardware.id, { result: "ready" }),
    ).toThrow(/setup/);
    const check = logCatalogAction("chen", hardware.id, {
      setupConfirmed: true,
      result: "review",
      note: "Power connection needs inspection",
    });
    expect(check.payload.result).toBe("review");
    expect(catalogStock(api.getState(), hardware.id, "chen")).toBe(
      hardware.stockQty,
    );
    const session = logCatalogAction("chen", activity.id, {
      minutes: 15,
      result: "adapted",
    });
    expect(session.payload).toMatchObject({
      minutes: 15,
      result: "adapted",
      quantity: 0,
    });
    expect(() =>
      logCatalogAction("chen", activity.id, {
        minutes: 0,
        result: "completed",
      }),
    ).toThrow();
    expect(() =>
      logCatalogAction("chen", activity.id, {
        minutes: 0.5,
        result: "completed",
      }),
    ).toThrow();
    expect(() =>
      logCatalogAction("chen", hardware.id, {
        setupConfirmed: true,
        result: "fake",
      }),
    ).toThrow();
  });
  it("retains usage across a local-state reload and mission-day advance", () => {
    logCatalogAction("chen", 209, { quantity: 1, authorized: true });
    const restored = JSON.parse(JSON.stringify(api.getState()));
    restored.mission.day++;
    expect(catalogHistory(restored, "chen", 209)).toHaveLength(1);
    expect(catalogStock(restored, 209, "chen")).toBe(
      catalogItem(209).stockQty - 1,
    );
  });
});
