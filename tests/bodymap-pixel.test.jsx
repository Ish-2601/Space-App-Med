import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { PixelBodyMap as BodyMap } from "../src/components/BodyMap.jsx";
import { bodyParts } from "../src/lib.js";

const render = (statuses = {}, selected = "eyes") =>
  renderToStaticMarkup(<BodyMap partStatus={(k) => statuses[k] || "green"} selected={selected} onSelect={() => {}} />);

describe("detailed body map", () => {
  it("draws every health area on the figure (no symbols needed)", () => {
    const html = render();
    for (const p of Object.values(bodyParts)) expect(html).toContain(`aria-label="${p.name}: All good"`);
    expect(html).not.toMatch(/[✓!–]<\/text>/); // the old ✓ / ! / – markers are gone
  });

  it("colours each area by its status and marks the selected one", () => {
    const html = render({ heart: "yellow", kidneys: "red", vestibular: "unknown" }, "lungs");
    expect(html).toMatch(/class="bm-region bm-yellow"[^>]*aria-label="Heart and circulation: Needs attention"/);
    expect(html).toMatch(/class="bm-region bm-red"[^>]*aria-label="Kidneys: Alert"/);
    expect(html).toMatch(/class="bm-region bm-unknown"[^>]*aria-label="Ears, hearing and balance: Not checked"/);
    expect(html).toMatch(/class="bm-region bm-green bm-selected"[^>]*aria-label="Lungs and oxygen/);
  });

  it("shows a front and a back view, with the kidneys only on the back", () => {
    const html = render();
    expect(html).toContain(">Front<");
    expect(html).toContain(">Back<");
    expect(html.match(/aria-label="Kidneys:/g)).toHaveLength(1);
    expect(html.match(/aria-label="Heart and circulation:/g)).toHaveLength(1);
    expect(html.match(/aria-label="Lungs and oxygen:/g)).toHaveLength(2); // chest and upper back
  });

  it("gives each area exactly one keyboard stop on the figure", () => {
    const html = render();
    const stops = [...html.matchAll(/tabindex="0" aria-label="([^:]+):/g)].map((m) => m[1]);
    expect(stops.sort()).toEqual(Object.values(bodyParts).map((p) => p.name).sort());
  });

  it("names the selected area and where it is in the caption", () => {
    expect(render({}, "kidneys")).toMatch(/Kidneys<\/b><span class="muted">· lower back/);
  });
});
