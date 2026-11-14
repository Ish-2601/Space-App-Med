import React from "react";

// Simple crewmate figure (bean body, visor, backpack) in the astronaut's color
export default function Crewmate({ color, size = 90 }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true">
      <rect x="10" y="38" width="18" height="40" rx="8" fill={color} stroke="#0b1020" strokeWidth="4" />
      <path
        d="M28 30 Q28 8 52 8 Q78 8 78 32 L78 92 Q78 100 70 100 L62 100 L62 86 L46 86 L46 100 L36 100 Q28 100 28 92 Z"
        fill={color} stroke="#0b1020" strokeWidth="4" strokeLinejoin="round"
      />
      <rect x="48" y="22" width="38" height="22" rx="11" fill="#9fd8f5" stroke="#0b1020" strokeWidth="4" />
      <rect x="58" y="27" width="16" height="6" rx="3" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}
