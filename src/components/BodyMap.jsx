import React from "react";
import { bodyParts, COLORS } from "../lib.js";

// Hotspot positions on the figure (viewBox 0 0 200 340)
const SPOTS = {
  brain: [88, 26], eyes: [116, 44], lungs: [80, 105], heart: [114, 108],
  immune: [52, 150], gut: [100, 150], kidneys: [124, 162], bones: [82, 260],
};

export default function BodyMap({ partStatus, selected, onSelect }) {
  return (
    <div className="bodymap">
      <svg viewBox="0 0 200 340" className="figure" role="img" aria-label="Body map">
        <g
          className={"outline" + (selected === "wholeBody" ? " active" : "")}
          onClick={() => onSelect("wholeBody")}
          style={{ stroke: COLORS[partStatus("wholeBody")] }}
        >
          <circle cx="100" cy="38" r="26" />
          <path d="M66 74 Q100 64 134 74 L146 180 L124 186 L120 330 L104 330 L100 214 L96 330 L80 330 L76 186 L54 180 Z" />
          <path d="M66 78 L36 170 L48 174 L74 104" />
          <path d="M134 78 L164 170 L152 174 L126 104" />
        </g>
        {Object.entries(SPOTS).map(([key, [x, y]]) => (
          <g key={key} className="spot" onClick={() => onSelect(key)}>
            {selected === key && <circle cx={x} cy={y} r="15" fill="none" stroke="#ffffff" strokeWidth="2" />}
            <circle cx={x} cy={y} r="10" fill={COLORS[partStatus(key)]} />
            <title>{bodyParts[key].name}</title>
          </g>
        ))}
      </svg>
      <div className="part-list">
        {Object.entries(bodyParts).map(([key, p]) => (
          <button
            key={key}
            className={"part" + (selected === key ? " active" : "")}
            onClick={() => onSelect(key)}
          >
            <span className="dot" style={{ background: COLORS[partStatus(key)] }} />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
