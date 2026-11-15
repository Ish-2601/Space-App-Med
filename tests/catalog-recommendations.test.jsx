import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { SPACEFLIGHT_CATALOG_1000 } from "../src/data/spaceflightCatalog1000.ts";
import {
  BODY_RECOMMENDATIONS,
  EMERGENCY_RECOMMENDATIONS,
  getRecommendationIds,
  recommendationContext,
  recommendedCatalogItems,
} from "../src/backend/catalogRecommendations.js";
import { HEALTH_AREAS } from "../src/data/healthAreas.js";
import * as api from "../src/backend/api.js";
import RecommendedCountermeasures from "../src/components/catalog/RecommendedCountermeasures.jsx";
import BodyHealth from "../src/pages/BodyHealth.jsx";
import Emergency from "../src/pages/Emergency.jsx";
import { beginPrivateRehearsal } from "../src/components/emergency/rehearsal.js";

beforeEach(async () => {
  await api.resetAll();
});
const person = () => api.getState().crew.find((p) => p.id === "okafor");
const catalogById = new Map(
  SPACEFLIGHT_CATALOG_1000.map((item) => [item.id, item]),
);

describe("Curated physical countermeasure mappings", () => {
  it("covers every body screen and emergency protocol with complete real catalog references", () => {
    expect(Object.keys(BODY_RECOMMENDATIONS).sort()).toEqual(
      Object.keys(HEALTH_AREAS).sort(),
    );
    expect(Object.keys(EMERGENCY_RECOMMENDATIONS).sort()).toEqual(
      api.EMERGENCIES.map((def) => def.id).sort(),
    );
    for (const collection of [BODY_RECOMMENDATIONS, EMERGENCY_RECOMMENDATIONS])
      for (const recommendation of Object.values(collection)) {
        expect(recommendation.ids.length).toBeGreaterThanOrEqual(6);
        expect(new Set(recommendation.ids).size).toBe(
          recommendation.ids.length,
        );
        expect(recommendation.reason.length).toBeGreaterThan(40);
        for (const id of recommendation.ids) {
          const item = catalogById.get(id);
          expect(item, `Missing recommended item #${id}`).toBeTruthy();
          expect(item.categoryId).toBeGreaterThanOrEqual(1);
          expect(item.categoryId).toBeLessThanOrEqual(9);
          expect(item.itemType).not.toBe("Smart Software Module");
        }
      }
  });
  it("selects clinically relevant hardware for specialized workflows", () => {
    expect(getRecommendationIds({ emergencyType: "ocular" })).toEqual(
      expect.arrayContaining([176, 177, 29]),
    );
    expect(getRecommendationIds({ emergencyType: "renal" })).toEqual(
      expect.arrayContaining([89, 191, 300]),
    );
    expect(getRecommendationIds({ emergencyType: "toxic" })).toEqual(
      expect.arrayContaining([711, 712, 727]),
    );
    expect(getRecommendationIds({ emergencyType: "dental" })).toEqual(
      expect.arrayContaining([184, 185, 186]),
    );
    expect(getRecommendationIds({ partKey: "wholeBody" })).toEqual(
      expect.arrayContaining([61, 701, 702]),
    );
    expect(getRecommendationIds({ bodySystem: "eyes" })).toEqual(
      expect.arrayContaining([21, 22, 674]),
    );
    expect(getRecommendationIds({ partKey: "bones" })).toEqual(
      expect.arrayContaining([301, 304, 306]),
    );
  });
  it("limits the featured view without truncating the complete recommendation set", () => {
    const featured = recommendedCatalogItems({ emergencyType: "toxic" });
    const all = recommendedCatalogItems({
      emergencyType: "toxic",
      limit: null,
    });
    expect(featured).toHaveLength(6);
    expect(all.map((item) => item.id)).toEqual(
      getRecommendationIds({ emergencyType: "toxic" }),
    );
    expect(recommendedCatalogItems({ partKey: "eyes", limit: 0 })).toHaveLength(
      0,
    );
    expect(recommendedCatalogItems({ partKey: "invalid" })).toHaveLength(0);
    expect(getRecommendationIds({ emergencyType: "invalid" })).toEqual([]);
    expect(recommendationContext({})).toBeNull();
    const ids = getRecommendationIds({ partKey: "eyes" });
    ids.pop();
    expect(getRecommendationIds({ partKey: "eyes" }).length).toBe(
      ids.length + 1,
    );
  });
});

describe("Recommended countermeasures screen integration", () => {
  it.each(Object.keys(HEALTH_AREAS))(
    "shows the recommended section on %s",
    (partKey) => {
      const html = renderToStaticMarkup(
        <BodyHealth person={person()} partKey={partKey} go={() => {}} />,
      );
      expect(html).toContain(
        "Recommended Spaceflight Countermeasures &amp; Hardware",
      );
      expect(html).toContain("View all matching countermeasures");
      expect(html).toContain("6 featured");
    },
  );
  it.each(api.EMERGENCIES.map((def) => def.id))(
    "previews %s equipment without starting an emergency",
    (type) => {
      const html = renderToStaticMarkup(
        <Emergency person={person()} params={{ type }} go={() => {}} />,
      );
      expect(html).toContain(
        "Recommended Spaceflight Countermeasures &amp; Hardware",
      );
      expect(html).toContain("Preview countermeasures");
      expect(html).toContain("6 featured");
      expect(api.activeEmergencies(api.getState(), "okafor")).toHaveLength(0);
    },
  );
  it("keeps active-protocol recommendations tied to the selected patient's workflow", () => {
    api.startEmergency("chen", "ocular");
    const emergency = api.activeEmergencies(api.getState(), "chen")[0];
    const html = renderToStaticMarkup(
      <Emergency
        person={person()}
        params={{ emergencyId: emergency.id }}
        go={() => {}}
      />,
    );
    expect(html).toContain(
      "Recommended Spaceflight Countermeasures &amp; Hardware",
    );
    expect(html).toContain("Morgan Lens");
    expect(html).toContain("authorized clinical plan");
  });
  it("can preview a different protocol from a catalog launcher while another protocol is active", () => {
    api.startEmergency("okafor", "faint");
    const html = renderToStaticMarkup(
      <Emergency person={person()} params={{ type: "dental" }} go={() => {}} />,
    );
    expect(html).toContain('id="emergency-protocol-preview"');
    expect(html).toContain('data-catalog-id="184"');
    expect(api.activeEmergencies(api.getState(), "okafor")).toHaveLength(1);
    expect(api.activeEmergencies(api.getState(), "okafor")[0].type).toBe(
      "faint",
    );
  });
  it.each(api.EMERGENCIES.map((def) => def.id))(
    "shows the correct six supplies in an active %s protocol",
    (type) => {
      api.startEmergency("okafor", type);
      const emergency = api.activeEmergencies(api.getState(), "okafor")[0];
      const html = renderToStaticMarkup(
        <Emergency
          person={person()}
          params={{ emergencyId: emergency.id }}
          go={() => {}}
        />,
      );
      for (const item of recommendedCatalogItems({ emergencyType: type }))
        expect(html).toContain(`data-catalog-id="${item.id}"`);
      expect(html).toContain('id="cpr-metronome"');
    },
  );
  it("shows private rehearsal supplies without creating public reports or protocols", () => {
    api.setSandboxMode(true);
    const rehearsal = beginPrivateRehearsal("okafor", "renal");
    const html = renderToStaticMarkup(
      <Emergency
        person={person()}
        params={{ emergencyId: rehearsal.id }}
        go={() => {}}
      />,
    );
    expect(html).toContain(
      "Recommended Spaceflight Countermeasures &amp; Hardware",
    );
    expect(html).toContain("Private emergency rehearsal");
    expect(api.getState().emergencies).toHaveLength(0);
    expect(api.getState().reports).toHaveLength(0);
    expect(api.getState().notifications).toHaveLength(0);
  });
  it("does not render or mutate state for an unknown context", () => {
    const before = JSON.stringify(api.getState());
    expect(
      renderToStaticMarkup(
        <RecommendedCountermeasures
          person={person()}
          partKey="unknown"
          go={() => {}}
        />,
      ),
    ).toBe("");
    expect(JSON.stringify(api.getState())).toBe(before);
  });
});
