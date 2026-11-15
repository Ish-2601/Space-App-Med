import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import BodyMap from "../src/components/BodyMap.jsx";
import { bodyParts } from "../src/lib.js";

const render = (statuses = {}, selected = "eyes") =>
  renderToStaticMarkup(<BodyMap partStatus={(k) => statuses[k] || "green"} selected={selected} onSelect={() => {}} />);

describe("glowing outline body map", () => {
  it("has one control for every health area, named for screen readers", () => {
    const html = render();
    for (const p of Object.values(bodyParts)) expect(html).toContain(`aria-label="${p.name}: All good"`);
  });

  it("colours each badge by status and shows the matching mark", () => {
    const html = render({ heart: "yellow", kidneys: "red", vestibular: "unknown" }, "lungs");
    expect(html).toMatch(/class="bm-badge bm-yellow"[^>]*aria-label="Heart and circulation: Needs attention"/);
    expect(html).toMatch(/class="bm-badge bm-red"[^>]*aria-label="Kidneys: Alert"/);
    expect(html).toMatch(/class="bm-badge bm-unknown"[^>]*aria-label="Ears, hearing and balance: Not checked"/);
    expect(html).toMatch(/class="bm-badge bm-green selected"[^>]*aria-label="Lungs and oxygen/);
    expect(html).toContain("badge-halo"); // the selected badge gets the big ring
  });

  it("makes the body itself the whole-body radiation control", () => {
    expect(render({}, "wholeBody")).toMatch(/class="bm-body selected"[^>]*aria-label="Radiation \(whole body\)/);
  });

  it("gives each area exactly one keyboard stop", () => {
    const stops = [...render().matchAll(/tabindex="0" aria-label="([^:]+):/g)].map((m) => m[1]);
    expect(stops.sort()).toEqual(Object.values(bodyParts).map((p) => p.name).sort());
  });

  it("names the selected area and where it is in the caption, with a key for the badges", () => {
    const html = render({}, "kidneys");
    expect(html).toMatch(/Kidneys<\/b><span class="muted">· side, above the waist/);
    expect(html).toContain("Needs attention</li>");
    expect(html).toContain("Not checked</li>");
  });
});
