import React, { useId, useMemo, useState } from "react";
import { bodyParts } from "../lib.js";
import { Icon, Status } from "./ConsoleUI.jsx";

// Glowing outline body map. Each health area has a status badge on the body:
// ✓ all good · ! needs attention (amber) · ! alert (red) · – not checked.
// Tapping the body itself selects whole-body radiation.

export const PART_ICONS = {
  brain: "brain",
  eyes: "eyes",
  vestibular: "body",
  heart: "heart",
  lungs: "air",
  immune: "shield",
  gut: "kit",
  kidneys: "water",
  bones: "exercise",
  wholeBody: "radiation",
};

const WHERE = {
  brain: "top of the head",
  eyes: "face",
  vestibular: "ear, beside the head",
  heart: "left side of the chest",
  lungs: "right side of the chest",
  immune: "base of the neck",
  gut: "belly",
  kidneys: "side, above the waist",
  bones: "thigh",
  wholeBody: "the whole body outline",
};

// Badge positions (viewBox 336 x 735). The heart is on the person's left (viewer's right).
const SPOTS = {
  brain: [168, 46],
  eyes: [168, 92],
  vestibular: [212, 84],
  immune: [168, 182],
  lungs: [146, 224],
  heart: [192, 224],
  gut: [168, 294],
  kidneys: [204, 322],
  bones: [204, 486],
};

const STATUS_WORD = { green: "All good", yellow: "Needs attention", red: "Alert", unknown: "Not checked" };

// Left half of the outline, from the top of the head down to the crotch (viewer's left).
const LEFT = [
  [168, 34], [147, 39], [134, 56], [131, 80], [135, 102], [146, 118], [155, 128], [154, 140], [150, 148],
  [128, 154], [104, 164], [90, 182], [84, 214], [80, 262], [72, 312], [64, 352], [58, 384],
  [46, 394], [40, 414], [44, 436], [56, 446], [68, 440], [72, 420], [74, 400],
  [84, 372], [94, 330], [102, 284], [110, 236],
  [114, 270], [118, 318], [114, 352], [108, 392], [108, 440], [112, 492], [116, 530],
  [114, 568], [116, 612], [122, 652], [116, 676], [104, 690], [104, 700], [130, 702], [150, 700],
  [152, 680], [150, 652], [148, 610], [148, 566], [152, 528], [156, 476], [160, 432], [168, 404],
];
const OUTLINE = [...LEFT, ...LEFT.slice(1, -1).reverse().map(([x, y]) => [336 - x, y])];

// Closed Catmull-Rom spline through the points, as smooth cubic Bézier curves.
function smoothPath(pts, t = 0.5) {
  const n = pts.length;
  const p = (i) => pts[(i + n) % n];
  let d = `M${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * t) / 3, p1[1] + ((p2[1] - p0[1]) * t) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * t) / 3, p2[1] - ((p3[1] - p1[1]) * t) / 3];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + "Z";
}
const BODY_PATH = smoothPath(OUTLINE);

// Faint anatomy lines inside the figure
const DETAIL = [
  "M128 160Q150 170 168 168Q186 170 208 160", // collarbones
  "M118 236Q142 258 166 250M218 236Q194 258 170 250", // chest
  "M126 334Q150 372 168 392Q186 372 210 334", // hips
  "M152 290Q160 296 168 296Q176 296 184 290", // ribs
  "M120 520Q132 530 146 520M190 520Q204 530 216 520", // knees
  "M78 300Q86 296 96 300M240 300Q250 296 258 300", // elbows
];

export default function BodyMap({ partStatus, selected, onSelect }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  const focus = hover || selected;
  const statuses = useMemo(
    () => Object.fromEntries(Object.keys(bodyParts).map((k) => [k, partStatus(k)])),
    [partStatus],
  );
  const press = (k) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(k);
    }
  };
  const wholeOn = selected === "wholeBody";

  return (
    <div className="bodymap bodymap-v3">
      <div className="bm-caption" aria-live="polite">
        <Icon name={PART_ICONS[focus]} size={18} />
        <b>{bodyParts[focus]?.name}</b>
        <span className="muted">· {WHERE[focus]}</span>
        <Status status={statuses[focus]}>{STATUS_WORD[statuses[focus]]}</Status>
      </div>
      <div className="bm-stage">
        <svg viewBox="0 0 336 735" className="bm-neon" role="group" aria-label="Body map. Each badge shows the status of one body area." onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b3f96" />
              <stop offset="0.38" stopColor="#4a3f9c" />
              <stop offset="0.47" stopColor="#6a62c4" />
              <stop offset="0.55" stopColor="#3e3486" />
              <stop offset="1" stopColor="#221d58" />
            </linearGradient>
            <radialGradient id={`${id}-chest`} cx="0.5" cy="0.3" r="0.35">
              <stop offset="0" stopColor="#8e9cff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#8e9cff" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* floor shadow */}
          <ellipse cx="168" cy="712" rx="104" ry="11" fill="#7b86ff" opacity="0.18" filter={`url(#${id}-soft)`} />
          <ellipse cx="168" cy="712" rx="86" ry="7" fill="none" stroke="#9aa6ff" strokeOpacity="0.35" strokeDasharray="4 5" />

          {/* the body: tap it for whole-body radiation */}
          <g
            className={"bm-body" + (wholeOn ? " selected" : "") + (hover === "wholeBody" ? " hover" : "")}
            role="button"
            tabIndex="0"
            aria-label={`${bodyParts.wholeBody.name}: ${STATUS_WORD[statuses.wholeBody]}`}
            aria-pressed={wholeOn}
            onClick={() => onSelect("wholeBody")}
            onKeyDown={press("wholeBody")}
            onMouseEnter={() => setHover("wholeBody")}
            onMouseLeave={() => setHover(null)}
          >
            <path d={BODY_PATH} fill={`url(#${id}-fill)`} opacity="0.92" />
            <path d={BODY_PATH} fill={`url(#${id}-chest)`} />
            <g className="bm-detail">
              {DETAIL.map((d) => <path key={d} d={d} />)}
              <path d="M168 252V330" strokeDasharray="3 6" />
            </g>
            <path d={BODY_PATH} className="bm-outline-glow" filter={`url(#${id}-glow)`} />
            <path d={BODY_PATH} className="bm-outline" />
          </g>

          {/* status badges */}
          {Object.entries(SPOTS).map(([key, [x, y]]) => {
            const st = statuses[key] || "unknown";
            const sel = selected === key;
            const r = sel ? 20 : 15;
            return (
              <g
                key={key}
                className={`bm-badge bm-${st}${sel ? " selected" : ""}${hover === key ? " hover" : ""}`}
                role="button"
                tabIndex="0"
                aria-label={`${bodyParts[key].name}: ${STATUS_WORD[st]}`}
                aria-pressed={sel}
                onClick={() => onSelect(key)}
                onKeyDown={press(key)}
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{bodyParts[key].name}</title>
                <circle cx={x} cy={y} r={r + 8} className="badge-glow" filter={`url(#${id}-soft)`} />
                {sel && <circle cx={x} cy={y} r={r + 6} className="badge-halo" />}
                <circle cx={x} cy={y} r={r} className="badge-disc" />
                {st === "green" ? (
                  <path d={`M${x - 6} ${y}l4 4.5 8-9`} className="badge-mark" />
                ) : st === "unknown" ? (
                  <path d={`M${x - 6} ${y}h12`} className="badge-mark" />
                ) : (
                  <text x={x} y={y + (sel ? 7 : 5.5)} textAnchor="middle" className="badge-text" fontSize={sel ? 20 : 16}>!</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="bm-legend" aria-label="Badge key">
        <li><i className="bm-key bm-green">✓</i>All good</li>
        <li><i className="bm-key bm-yellow">!</i>Needs attention</li>
        <li><i className="bm-key bm-red">!</i>Alert</li>
        <li><i className="bm-key bm-unknown">–</i>Not checked</li>
        <li><i className="bm-key bm-body-key" />Tap the body: whole-body radiation</li>
      </ul>
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
          Tap a badge, the body, or a row. Your readings are compared with your
          own first-week baseline.
        </p>
      </div>
    </div>
  );
}
