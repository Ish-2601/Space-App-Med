import React, { useMemo, useState } from "react";
import { bodyParts } from "../lib.js";
import { Icon, Status } from "./ConsoleUI.jsx";
import { gravityOf } from "../backend/trendModel.js";
import { update, getState } from "../backend/store.js";
import GlowingBodyMap, { PART_ICONS } from "./GlowingBodyMap.jsx";

// Detailed pixel-art body map (front and back), generated from simple shapes.
// Every muscle group / organ is a shape that belongs to one health area (region).
// The whole region is coloured by its status, so the figure itself shows what's wrong:
// blue = all good, amber = needs attention, coral = alert, grey = not checked, white = selected.

export { PART_ICONS };

// Where each area is drawn, in plain words (shown in the caption)
const WHERE = {
  brain: "head",
  eyes: "eyes",
  vestibular: "ears",
  heart: "left side of the chest",
  lungs: "chest and upper back",
  immune: "throat and neck lymph nodes",
  gut: "belly",
  kidneys: "lower back",
  bones: "arms, legs, shoulders and spine",
  wholeBody: "dosimeter badge on the chest",
};

// ---------- Shapes (grid units; each view is 56 x 96 "pixels") ----------
const W = 56;
const H = 96;
const mirror = (pts) => pts.map(([x, y]) => [W - x, y]);
const poly = (region, pts) => ({ region, kind: "poly", pts });
const ell = (region, cx, cy, rx, ry, clip = {}) => ({
  region,
  kind: "ell",
  cx,
  cy,
  rx,
  ry,
  clip,
});
const both = (region, pts) => [poly(region, pts), poly(region, mirror(pts))];
const bothEll = (region, cx, cy, rx, ry) => [
  ell(region, cx, cy, rx, ry),
  ell(region, W - cx, cy, rx, ry),
];

// Limbs, shared by front and back (later shapes are drawn on top of earlier ones)
// Muscle groups overlap slightly so joints don't leave gaps.
const limbs = [
  // upper arms (biceps / triceps bulge)
  ...both("bones", [
    [12, 26.5],
    [15, 26],
    [18.4, 27.5],
    [18.8, 31.5],
    [18.2, 37],
    [16.8, 38.8],
    [13.4, 38.8],
    [12.2, 35],
    [11.8, 30.5],
  ]),
  // forearms, tapering to the wrist
  ...both("bones", [
    [12.2, 37.6],
    [17.6, 37.6],
    [18, 41],
    [16.8, 49.8],
    [14, 50.6],
    [12.8, 49.6],
    [11.8, 42],
  ]),
  // hands
  ...bothEll("bones", 14.8, 53.2, 2.4, 3.4),
  // shoulders (deltoids), on top of the upper arm
  ...bothEll("bones", 16.2, 24.6, 4.6, 4.4),
  // thighs: outer and inner muscle
  ...both("bones", [
    [19.8, 46.6],
    [24.4, 49.2],
    [24.2, 67.6],
    [21.8, 68.4],
    [20.4, 62],
    [19.4, 54],
  ]),
  ...both("bones", [
    [24.4, 49.2],
    [27.8, 52],
    [27.4, 60],
    [26.8, 68.2],
    [24.2, 68.4],
  ]),
  // lower legs (shin in front, calf behind)
  ...both("bones", [
    [21.4, 71.2],
    [26.8, 71.2],
    [27.2, 76],
    [26.4, 87.8],
    [23.2, 88.8],
    [22.2, 84],
    [21, 76],
  ]),
  // knees, on top of thigh and shin
  ...bothEll("bones", 24.2, 69.8, 3, 2.4),
  // feet
  ...both("bones", [
    [21.6, 87.8],
    [26.8, 87.8],
    [27.8, 92.6],
    [26.6, 93.6],
    [20.6, 93.6],
    [20.4, 92],
  ]),
];

const head = (withEyes) => [
  ell("brain", 28, 8.6, 6.4, 7.6),
  ...(withEyes ? [ell("eyes", 28, 8.6, 6.4, 7.6, { y0: 7.4, y1: 10.4 })] : []),
  ...bothEll("vestibular", 21.4, 9.6, 1.3, 2.2),
];

const FRONT = [
  ...limbs,
  // neck (throat, lymph nodes)
  poly("immune", [
    [24.8, 14.4],
    [31.2, 14.4],
    [32.2, 19.8],
    [23.8, 19.8],
  ]),
  // collar / upper trapezius
  poly("bones", [
    [23.4, 18.4],
    [32.6, 18.4],
    [39.6, 21.6],
    [16.4, 21.6],
  ]),
  // sides of the ribcage and belly (obliques), tapering to the waist
  ...both("gut", [
    [19.4, 28],
    [23.4, 30.4],
    [23.6, 43.8],
    [21.4, 44.2],
    [20.6, 39],
    [19.8, 34],
  ]),
  // chest muscles (lungs underneath)
  ...both("lungs", [
    [19.6, 21.6],
    [27.9, 21.6],
    [27.9, 30.4],
    [23.4, 31],
    [20.6, 29.4],
    [19, 25.6],
  ]),
  // heart, on the person's left (viewer's right)
  ell("heart", 31.2, 26.8, 2.8, 2.6),
  // dosimeter badge (whole-body radiation) on the person's right chest
  poly("wholeBody", [
    [21.8, 22.6],
    [25, 22.6],
    [25, 25.6],
    [21.8, 25.6],
  ]),
  // abdominal muscles: 3 rows x 2
  ...[31, 35.2, 39.4].flatMap((y) => [
    poly("gut", [
      [23.4, y],
      [27.9, y],
      [27.9, y + 4.3],
      [23.6, y + 4.3],
    ]),
    poly("gut", [
      [28.1, y],
      [32.6, y],
      [32.4, y + 4.3],
      [28.1, y + 4.3],
    ]),
  ]),
  // hips / pelvis
  poly("bones", [
    [21.2, 43.6],
    [34.8, 43.6],
    [36, 48],
    [32, 51],
    [28, 52.4],
    [24, 51],
    [20, 48],
  ]),
  ...head(true),
];

const BACK = [
  ...limbs,
  // neck (cervical spine)
  poly("bones", [
    [24.8, 14.4],
    [31.2, 14.4],
    [32.2, 19.8],
    [23.8, 19.8],
  ]),
  // upper back (lungs behind the ribs)
  ...both("lungs", [
    [19, 22.4],
    [27.3, 26.6],
    [27.3, 36.6],
    [22, 37],
    [19.6, 32],
    [18.8, 26.4],
  ]),
  // mid back (lats), tapering to the waist
  ...both("bones", [
    [19.8, 31.4],
    [22, 37],
    [27.3, 36.6],
    [27.3, 43.8],
    [22.4, 44.2],
    [20.8, 39.5],
  ]),
  // trapezius (diamond from neck to mid back)
  poly("bones", [
    [23.8, 18.2],
    [32.2, 18.2],
    [39.6, 21.8],
    [32, 29],
    [28, 30.4],
    [24, 29],
    [16.4, 21.8],
  ]),
  // kidneys sit just above the waist, either side of the spine
  ...bothEll("kidneys", 24.4, 40.4, 2.4, 3.1),
  // lower back
  poly("bones", [
    [21.4, 43.6],
    [34.6, 43.6],
    [35.4, 47.8],
    [20.6, 47.8],
  ]),
  // spine
  poly("bones", [
    [27.3, 19],
    [28.7, 19],
    [28.7, 47.6],
    [27.3, 47.6],
  ]),
  // glutes
  ...bothEll("bones", 24.4, 51.4, 4.4, 4.4),
  ...head(false),
];

// ---------- Rasteriser ----------
function inside(s, x, y) {
  if (s.kind === "ell") {
    const { y0 = -Infinity, y1 = Infinity } = s.clip;
    if (y < y0 || y > y1) return false;
    return ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1;
  }
  let hit = false;
  const p = s.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
}

function bounds(s) {
  if (s.kind === "ell")
    return {
      x0: s.cx - s.rx,
      x1: s.cx + s.rx,
      y0: Math.max(s.cy - s.ry, s.clip.y0 ?? -Infinity),
      y1: Math.min(s.cy + s.ry, s.clip.y1 ?? Infinity),
    };
  const xs = s.pts.map((p) => p[0]);
  const ys = s.pts.map((p) => p[1]);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

// Turns a list of shapes into pixel runs grouped by region. Each cell gets a class:
// e = outline (next to empty space or a different area), s = seam between muscles of the same area,
// f0..f3 = fill shades (lighter at the edge of each muscle, darker in the middle).
function rasterise(shapes) {
  const owner = Array.from({ length: H }, () => new Int16Array(W).fill(-1));
  const bb = shapes.map(bounds);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (inside(shapes[i], x + 0.5, y + 0.5)) {
          owner[y][x] = i;
          break;
        }
      }
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : owner[y][x]);
  const cls = (x, y) => {
    const i = owner[y][x];
    const r = shapes[i].region;
    const nb = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
    if (nb.some((n) => n === -1)) return "e";
    // a border between two areas is drawn once (on the right/bottom neighbour's side)
    const right = at(x + 1, y);
    const down = at(x, y + 1);
    if ([right, down].some((n) => shapes[n].region !== r)) return "e";
    if ([right, down].some((n) => n !== i)) return "s";
    const b = bb[i];
    const dx = ((x + 0.5 - (b.x0 + b.x1) / 2) / ((b.x1 - b.x0) / 2 || 1)) ** 2;
    const dy = ((y + 0.5 - (b.y0 + b.y1) / 2) / ((b.y1 - b.y0) / 2 || 1)) ** 2;
    const d = Math.sqrt(dx + dy);
    return d > 0.8 ? "f0" : d > 0.55 ? "f1" : d > 0.3 ? "f2" : "f3";
  };
  const regions = {};
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const i = owner[y][x];
      if (i < 0) {
        x++;
        continue;
      }
      const r = shapes[i].region;
      const c = cls(x, y);
      let x2 = x + 1;
      while (
        x2 < W &&
        owner[y][x2] >= 0 &&
        shapes[owner[y][x2]].region === r &&
        cls(x2, y) === c
      )
        x2++;
      (regions[r] ||= []).push({ x, y, w: x2 - x, c });
      x = x2;
    }
  }
  return regions;
}

const VIEWS = [
  { id: "front", label: "Front", dx: -7, regions: rasterise(FRONT) },
  { id: "back", label: "Back", dx: 33, regions: rasterise(BACK) },
];
const LEGEND = [
  ["green", "All good"],
  ["yellow", "Needs attention"],
  ["red", "Alert"],
  ["unknown", "Not checked"],
  ["selected", "Selected"],
];
const STATUS_WORD = {
  green: "All good",
  yellow: "Needs attention",
  red: "Alert",
  unknown: "Not checked",
};

export function PixelBodyMap({
  partStatus,
  selected,
  onSelect,
  figureOnly = false,
  activeLayer = "organs",
  environment = "transit",
}) {
  const [hover, setHover] = useState(null);
  const gravity = gravityOf(environment);
  const focus = hover || selected;
  const statuses = useMemo(
    () =>
      Object.fromEntries(Object.keys(bodyParts).map((k) => [k, partStatus(k)])),
    [partStatus],
  );
  const firstView = {}; // only the first drawing of each area is a keyboard stop
  const activate = (k) => onSelect(k);

  return (
    <div className={`bodymap bodymap-v2 layer-${activeLayer}`}>
      <div className="bm-caption" aria-live="polite">
        <Icon name={PART_ICONS[focus]} size={18} />
        <b>{bodyParts[focus]?.name || "Select a body system"}</b>
        {focus && <><span className="muted">· {WHERE[focus]}</span>
        <Status status={statuses[focus]}>{STATUS_WORD[statuses[focus]]}</Status></>}
      </div>
      <div className="bm-screen">
        <svg
          viewBox="0 0 82 101"
          className={
            "bm-figure" + (selected === "wholeBody" ? " whole-selected" : "")
          }
          shapeRendering="crispEdges"
          role="group"
          aria-label="Body map, front and back. Each area is coloured by its health status."
          onMouseLeave={() => setHover(null)}
        >
          {VIEWS.map((v) => (
            <g key={v.id} transform={`translate(${v.dx} 2)`}>
              {Object.entries(v.regions).map(([region, runs]) => {
                const tab = firstView[region] ? -1 : 0;
                firstView[region] = true;
                const st = statuses[region] || "unknown";
                return (
                  <g
                    key={region}
                    className={`bm-region bm-${st}${selected === region ? " bm-selected" : ""}${hover === region ? " bm-hover" : ""}`}
                    role="button"
                    tabIndex={tab}
                    aria-label={`${bodyParts[region].name}: ${STATUS_WORD[st]}`}
                    aria-pressed={selected === region}
                    onClick={() => activate(region)}
                    onMouseEnter={() => setHover(region)}
                    onFocus={() => setHover(region)}
                    onBlur={() => setHover(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        activate(region);
                      }
                    }}
                  >
                    {runs.map((r, i) => (
                      <rect
                        key={i}
                        className={r.c}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height="1"
                      />
                    ))}
                  </g>
                );
              })}
              <text
                x={W / 2}
                y={99}
                textAnchor="middle"
                className="bm-view-label"
              >
                {v.label}
              </text>
            </g>
          ))}
          {activeLayer === "fluid" && (
            <g
              className="fluid-layer"
              pointerEvents="none"
              shapeRendering="geometricPrecision"
            >
              {[21, 61].map((cx) => (
                <g key={cx} opacity={1 - gravity * 0.9}>
                  <ellipse
                    cx={cx}
                    cy="11"
                    rx="8.5"
                    ry="10"
                    className="fluid-head"
                  />
                  <ellipse
                    cx={cx}
                    cy="30"
                    rx="10"
                    ry="7"
                    className="fluid-chest"
                  />
                  <path
                    d={`M${cx - 7} 80Q${cx - 10} 49 ${cx - 5} 23M${cx + 7} 80Q${cx + 10} 49 ${cx + 5} 23`}
                    className="fluid-flow"
                  />
                  <path
                    d={`M${cx - 8} 27L${cx - 5} 22L${cx - 3} 28M${cx + 3} 28L${cx + 5} 22L${cx + 8} 27`}
                    className="fluid-flow"
                  />
                </g>
              ))}
            </g>
          )}
          {activeLayer === "eva" && (
            <g className="eva-layer" shapeRendering="geometricPrecision">
              {[
                [9, 27, "Rotator cuff", "bones"],
                [61, 46, "Lumbar spine", "bones"],
                [8, 57, "Fingertip delamination", "immune"],
                [17, 93, "Top-of-foot restraint calluses", "bones"],
              ].map(([cx, cy, text, part]) => (
                <g
                  key={text}
                  role="button"
                  tabIndex="0"
                  aria-label={text + " — open " + bodyParts[part].name}
                  onClick={() => onSelect(part)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(part);
                    }
                  }}
                >
                  <circle cx={cx} cy={cy} r="4.5" />
                  <text x={cx} y={cy + 1.8} textAnchor="middle">
                    !
                  </text>
                  <title>{text}</title>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>
      {activeLayer === "fluid" && (
        <div className="body-layer-info">
          <b>
            {gravity}G ·{" "}
            {environment === "iss"
              ? "ISS"
              : environment === "moon"
                ? "Moon"
                : environment === "mars"
                  ? "Mars"
                  : "Mars transit"}
          </b>
          <p>
            Arrows illustrate fluid moving toward the head and eyes as gravity
            falls. Overlay intensity scales with mission gravity; it is not a
            measurement of swelling.
          </p>
          <div className="row">
            <button className="btn small" onClick={() => onSelect("eyes")}>
              Review eyes
            </button>
            <button className="btn small" onClick={() => onSelect("brain")}>
              Review head health
            </button>
          </div>
        </div>
      )}
      {activeLayer === "eva" && (
        <div className="body-layer-info">
          <b>EVA suit contact and loading points</b>
          <p>
            Highlighted areas are locations to review, not diagnosed injuries.
          </p>
          <div className="eva-hotspot-list">
            {[
              ["Rotator cuff", "bones"],
              ["Lumbar spine", "bones"],
              ["Fingertip delamination", "immune"],
              ["Top-of-foot restraint calluses", "bones"],
            ].map(([text, part]) => (
              <button
                className="btn small"
                key={text}
                onClick={() => onSelect(part)}
              >
                {text}
                <Icon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="bm-legend" aria-label="Colour key">
        {LEGEND.map(([k, label]) => (
          <li key={k}>
            <i
              className={`bm-swatch bm-${k}${k === "selected" ? " bm-selected" : ""}`}
            />
            {label}
          </li>
        ))}
      </ul>
      {!figureOnly && (
        <div className="part-list">
          {Object.entries(bodyParts).map(([key, p]) => (
            <button
              key={key}
              className={"part " + (selected === key ? "active" : "")}
              aria-pressed={selected === key}
              onClick={() => onSelect(key)}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
            >
              <Icon name={PART_ICONS[key]} size={18} />
              <span>{p.name}</span>
              <Status status={statuses[key]} />
            </button>
          ))}
          <p className="muted small body-map-hint">
            Tap any part of the body or a row. Your readings are compared with
            your own first-week baseline.
          </p>
        </div>
      )}
    </div>
  );
}

export default function BodyMap({ layers = false, ...props }) {
  const [layer, setLayer] = useState(
    () => getState().settings?.bodyMapLayer || "organs",
  );
  if (!layers) return <GlowingBodyMap {...props} />;

  return (
    <>
      <div className="body-layer-controls" role="group" aria-label="Body map layers">
        {[
          ["organs", "Organ Systems (Default)"],
          ["fluid", "Microgravity Fluid Shift Map"],
          ["eva", "EVA Suit & Musculoskeletal Hotspots"],
        ].map(([key, text]) => (
          <button
            key={key}
            className={"btn small" + (layer === key ? " active" : "")}
            aria-pressed={layer === key}
            onClick={() => {
              setLayer(key);
              update((s) => {
                s.settings.bodyMapLayer = key;
              });
            }}
          >
            {text}
          </button>
        ))}
      </div>
      {layer === "organs"
        ? <GlowingBodyMap {...props} />
        : <PixelBodyMap {...props} activeLayer={layer} />}
    </>
  );
}
