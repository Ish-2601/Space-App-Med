// Space Apps rules: original branding, no implied NASA endorsement, the app's name everywhere.
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, it, expect } from "vitest";
import * as api from "../src/backend/api.js";
import { Brand } from "../src/components/ConsoleUI.jsx";
import CrewSelect from "../src/components/CrewSelect.jsx";
import { ENVIRONMENTS } from "../src/backend/content.js";
import { gravityOf } from "../src/backend/trendModel.js";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
beforeEach(async () => {
  await api.resetAll();
});

describe("branding", () => {
  it("the brand shows the Space App Med name and its own mark", () => {
    const html = renderToStaticMarkup(<Brand />);
    expect(html).toContain("brand-mark");
    expect(html.replace(/<[^>]+>/g, "")).toContain("Space App Med");
  });
  it("the lobby says the app is not affiliated with or endorsed by NASA", () => {
    const html = renderToStaticMarkup(<CrewSelect onSelect={() => {}} onMedical={() => {}} />);
    expect(html).toMatch(/Not affiliated with\s+or endorsed by NASA/);
  });
  it("page title, install name and favicon use the new name and mark", () => {
    expect(read("index.html")).toContain("<title>Space App Med</title>");
    expect(JSON.parse(read("public/manifest.webmanifest")).name).toBe("Space App Med");
    expect(read("public/icon.svg")).toContain("Space App Med mark");
  });
  it("no user-facing text still uses the old name", () => {
    for (const f of ["index.html", "src/components/ConsoleUI.jsx", "src/components/GuidedTour.jsx", "src/pages/Learn.jsx", "src/data/tutorial.js"])
      expect(read(f)).not.toMatch(/NASA Med|AstroHealth/);
  });
  it("covers a rover as well as station, spacecraft and bases", () => {
    expect(Object.keys(ENVIRONMENTS)).toEqual(expect.arrayContaining(["iss", "transit", "moon", "mars", "rover"]));
    expect(gravityOf("rover")).toBe(0.38);
  });
});
