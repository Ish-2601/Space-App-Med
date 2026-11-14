import React, { useId } from "react";
import { bodyParts, COLORS } from "../lib.js";
import { Icon, Status } from "./ConsoleUI.jsx";
const SPOTS = {
  brain: [100, 23],
  eyes: [102, 45],
  vestibular: [122, 41],
  lungs: [86, 106],
  heart: [113, 108],
  immune: [100, 83],
  gut: [100, 148],
  kidneys: [119, 164],
  bones: [116, 258],
};
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
export default function BodyMap({ partStatus, selected, onSelect }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="bodymap">
      <svg
        viewBox="0 0 200 360"
        className="figure"
        aria-label="Interactive body map"
      >
        <defs>
          <linearGradient id={id} x1="0" x2=".6" y2="1">
            <stop stopColor="#7e9bb5" stopOpacity=".65" />
            <stop offset=".55" stopColor="#354a5f" stopOpacity=".6" />
            <stop offset="1" stopColor="#152535" stopOpacity=".6" />
          </linearGradient>
        </defs>
        <ellipse
          cx="100"
          cy="345"
          rx="49"
          ry="5"
          fill="#7894ab"
          opacity=".18"
        />
        <g
          className="body-outline"
          role="button"
          tabIndex="0"
          aria-label="Whole body radiation"
          onClick={() => onSelect("wholeBody")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect("wholeBody");
            }
          }}
          style={{ fill: "url(#" + id + ")" }}
        >
          <ellipse cx="100" cy="40" rx="20" ry="25" />
          <path d="M92 66 87 76 64 82 54 91 47 159 32 222 37 230 43 225 55 169 65 109 69 171 64 196 69 272 76 328 70 338 73 345 89 345 93 328 95 215 100 209 105 215 107 328 111 345 127 345 130 338 124 328 131 272 136 196 131 171 135 109 145 169 157 225 163 230 168 222 153 159 146 91 136 82 113 76 108 66Z" />
          <path
            d="M100 78V207M75 123Q100 133 125 123M71 180Q100 195 129 180M58 158H142"
            fill="none"
            opacity=".4"
            strokeDasharray="3 4"
          />
        </g>
        {Object.entries(SPOTS).map(([key, [x, y]]) => {
          const status = partStatus(key);
          return (
            <g
              key={key}
              role="button"
              tabIndex="0"
              aria-label={bodyParts[key].name + ": " + status}
              aria-pressed={key === selected}
              className={"body-hotspot " + (selected === key ? "selected" : "")}
              onClick={() => onSelect(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(key);
                }
              }}
            >
              {selected === key && (
                <circle cx={x} cy={y} r="14" className="spot-halo" />
              )}
              <circle
                cx={x}
                cy={y}
                r="9"
                fill="#101c27"
                stroke={COLORS[status]}
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fill={COLORS[status]}
                fontSize="11"
              >
                {status === "green" ? "✓" : status === "unknown" ? "–" : "!"}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="part-list">
        {Object.entries(bodyParts).map(([key, p]) => (
          <button
            key={key}
            className={"part " + (selected === key ? "active" : "")}
            aria-pressed={selected === key}
            onClick={() => onSelect(key)}
          >
            <Icon name={PART_ICONS[key]} size={18} />
            <span>{p.name}</span>
            <Status status={partStatus(key)} />
          </button>
        ))}
        <p className="muted small body-map-hint">
          Select a point or a row. Your readings are compared with your own
          first-week baseline.
        </p>
      </div>
    </div>
  );
}
