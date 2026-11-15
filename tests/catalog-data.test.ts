import { describe, expect, it } from "vitest";
import sourceItems from "./fixtures/spaceflight-catalog-source.json";
import {
  SPACEFLIGHT_CATALOG_1000,
  CATALOG_CATEGORIES,
  CATALOG_ITEM_TYPES,
  CATALOG_PACK_COLORS,
  CATALOG_SOFTWARE_ROUTES,
  CATALOG_PROVENANCE,
} from "../src/data/spaceflightCatalog1000.ts";

const byId = (id: number) => SPACEFLIGHT_CATALOG_1000[id - 1];

describe("Complete user-supplied 1,000-item catalog", () => {
  it("contains exactly 1,000 sequential, uniquely identified items", () => {
    expect(SPACEFLIGHT_CATALOG_1000.length).toBe(1000);
    expect(SPACEFLIGHT_CATALOG_1000.map((item) => item.id)).toEqual(
      Array.from({ length: 1000 }, (_, i) => i + 1),
    );
    expect(new Set(SPACEFLIGHT_CATALOG_1000.map((item) => item.id)).size).toBe(
      1000,
    );
    expect(
      new Set(SPACEFLIGHT_CATALOG_1000.map((item) => item.code)).size,
    ).toBe(1000);
    expect(byId(1).code).toBe("001");
    expect(byId(99).code).toBe("099");
    expect(byId(1000).code).toBe("1000");
  });
  it("preserves EVERY title and category exactly against the independent extracted source fixture", () => {
    expect(sourceItems).toHaveLength(1000);
    expect(
      SPACEFLIGHT_CATALOG_1000.map(({ id, name, categoryId, category }) => ({
        id,
        name,
        categoryId,
        category,
      })),
    ).toEqual(sourceItems);
  });
  it("retains LaTeX, apostrophes, numeric forms and punctuation instead of rewriting names", () => {
    expect(byId(9).name).toBe(
      String.raw`Finger Pulse Oximeter ($\text{SpO}_2$)`,
    );
    expect(byId(923).name).toBe(
      String.raw`Environmental $\text{CO}_2$ + Headache Cross-Correlation Engine`,
    );
    expect(byId(88).name).toBe("Wood's Lamp UV Skin/Corneal Inspector");
    expect(byId(674).name).toContain('"Superfocus"');
    expect(byId(687).name).toBe(
      "UWMS Airflow Suction Filter Replacement Cartridges",
    );
    expect(byId(1000).name).toContain(
      "Pre-Flight → In-Orbit → Post-Flight Recovery",
    );
  });
  it("has all ten exact categories and exactly 100 items within each category", () => {
    expect(CATALOG_CATEGORIES).toHaveLength(10);
    CATALOG_CATEGORIES.forEach((category) => {
      const entries = SPACEFLIGHT_CATALOG_1000.filter(
        (item) => item.categoryId === category.id,
      );
      expect(entries).toHaveLength(100);
      expect(entries.every((item) => item.category === category.name)).toBe(
        true,
      );
      expect(entries[0].id).toBe((category.id - 1) * 100 + 1);
      expect(entries[99].id).toBe(category.id * 100);
    });
  });
  it("enriches all 1,000 entries with usable metadata and known body-system keys", () => {
    const systems = [
      "brain",
      "eyes",
      "vestibular",
      "heart",
      "lungs",
      "immune",
      "gut",
      "kidneys",
      "bones",
      "wholeBody",
    ];
    const routes = [
      "body",
      "today",
      "trends",
      "medguide",
      "emergency",
      "checks",
      "catalog",
      "learn",
      "medkit",
      "quests",
      "crew",
      "earth",
      "checkin",
      "summary",
      "radiation",
      "habitat",
      "log",
      "checklists",
      "mission",
      ...systems.map((s) => "body-" + s),
    ];
    SPACEFLIGHT_CATALOG_1000.forEach((item) => {
      expect(systems).toContain(item.linkedBodySystem);
      expect(CATALOG_ITEM_TYPES).toContain(item.itemType);
      expect(CATALOG_PACK_COLORS).toContain(item.nasaPackColor);
      expect(routes).toContain(item.targetRoute);
      expect(Number.isInteger(item.stockQty)).toBe(true);
      expect(item.stockQty).toBeGreaterThanOrEqual(0);
      for (const key of [
        "radiationSensitivity",
        "microgravityNote",
        "whyNeeded",
      ] as const)
        expect(item[key].length).toBeGreaterThan(30);
      expect(item.name).not.toMatch(/^\s|\s$/);
    });
    systems.forEach((system) =>
      expect(
        SPACEFLIGHT_CATALOG_1000.some(
          (item) => item.linkedBodySystem === system,
        ),
      ).toBe(true),
    );
    CATALOG_ITEM_TYPES.forEach((type) =>
      expect(
        SPACEFLIGHT_CATALOG_1000.some((item) => item.itemType === type),
      ).toBe(true),
    );
  });
  it("classifies medications outside the medication category without assigning doses", () => {
    for (const id of [
      127, 185, 352, 368, 369, 370, 560, 621, 622, 641, 658, 696, 706, 707, 708,
      709,
    ]) {
      expect(byId(id).itemType).toBe("Medication");
      expect(byId(id).microgravityNote).toContain("authorized route and dose");
      expect(byId(id).radiationSensitivity).toContain("no potency is inferred");
    }
    expect(byId(290).itemType).toBe("Hardware");
    expect(byId(546).itemType).toBe("Nutrition");
    expect(byId(710).itemType).toBe("Radiation/Safety");
    expect(byId(565).itemType).toBe("Hardware");
    expect(byId(391).itemType).toBe("Hardware");
  });
  it("routes diagnostic hardware to relevant systems instead of the radiation screen", () => {
    const expectedSystems: Record<number, string> = {
      5: "eyes",
      6: "eyes",
      15: "gut",
      16: "kidneys",
      17: "lungs",
      18: "heart",
      19: "gut",
      20: "heart",
      22: "eyes",
      23: "eyes",
      40: "bones",
      49: "kidneys",
      53: "immune",
      58: "immune",
      71: "lungs",
      73: "lungs",
      75: "brain",
      76: "gut",
      100: "brain",
    };
    Object.entries(expectedSystems).forEach(([id, system]) => {
      const item = byId(Number(id));
      expect(item.linkedBodySystem).toBe(system);
      expect(item.targetRoute).toBe(`body-${system}`);
      expect(item.whyNeeded).not.toContain("radiation awareness");
    });
    expect(
      SPACEFLIGHT_CATALOG_1000.slice(0, 100)
        .filter((item) => item.linkedBodySystem === "wholeBody")
        .map((item) => item.id),
    ).toEqual([61, 62, 63, 64]);
  });
  it("retains explicitly named pack colors and declares other assignments as demo metadata", () => {
    expect(byId(197).nasaPackColor).toBe("Red");
    expect(byId(198).nasaPackColor).toBe("Pink");
    expect(byId(199).nasaPackColor).toBe("Yellow");
    expect(byId(200).nasaPackColor).toBe("Green");
    expect(CATALOG_PACK_COLORS).toEqual([
      "Red",
      "White",
      "Blue",
      "Yellow",
      "Pink",
      "Green",
    ]);
    expect(CATALOG_PROVENANCE).toContain(
      "not an official NASA-certified inventory",
    );
    expect(CATALOG_PROVENANCE).toContain("preserved verbatim");
  });
  it("provides complete launcher destinations for all 100 software modules", () => {
    expect(Object.keys(CATALOG_SOFTWARE_ROUTES)).toHaveLength(100);
    SPACEFLIGHT_CATALOG_1000.slice(900).forEach((item) => {
      expect(item.itemType).toBe("Smart Software Module");
      expect(item.targetRoute).toBe(CATALOG_SOFTWARE_ROUTES[item.id]);
      expect(item.stockQty).toBe(0);
    });
    expect(byId(901).targetRoute).toBe("body");
    expect(byId(906).targetRoute).toBe("medguide");
    expect(byId(911).targetRoute).toBe("checks");
    expect(byId(923).targetRoute).toBe("trends");
    expect(byId(936).targetRoute).toBe("body-kidneys");
    expect(byId(960).targetRoute).toBe("emergency");
    expect(byId(999).targetRoute).toBe("earth");
  });
  it("prevents accidental inventory mutations of the shared catalog definition", () => {
    expect(Object.isFrozen(SPACEFLIGHT_CATALOG_1000)).toBe(true);
    expect(Object.isFrozen(byId(1))).toBe(true);
  });
});
