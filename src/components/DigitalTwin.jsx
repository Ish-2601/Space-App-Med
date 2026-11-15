import React, { useId, useState } from "react";
import { useStore } from "../backend/store.js";
import {
  twinSettings,
  saveTwinSettings,
  forecastTwin,
  TWIN_DEFAULTS,
} from "../backend/trendModel.js";
import { Icon } from "./ConsoleUI.jsx";

const METRICS = [
  ["bmd", "Bone Mineral Density", "Relative density index · today = 100"],
  ["vo2", "VO₂ Max", "Relative aerobic-capacity index · today = 100"],
  [
    "renal",
    "Renal Stone Risk",
    "Illustrative risk index · lower is better, not a probability",
  ],
  [
    "vigilance",
    "Cognitive Vigilance",
    "Relative vigilance index · today = 100",
  ],
];
export default function DigitalTwin({ pid, defaultOpen = false }) {
  const state = useStore(),
    [open, setOpen] = useState(defaultOpen),
    uid = useId();
  const settings = twinSettings(state, pid),
    data = forecastTwin(settings, state.mission.environment),
    reference = forecastTwin(TWIN_DEFAULTS, state.mission.environment);
  return (
    <section className="twin-section" id="digital-twin">
      <button
        className="btn twin-launch"
        aria-expanded={open}
        aria-controls={uid}
        onClick={() => setOpen(!open)}
      >
        <Icon name="body" />
        Digital Twin 30-Day Forecaster
        <Icon name={open ? "down" : "arrow"} />
      </button>
      {open && (
        <aside
          className="twin-drawer"
          id={uid}
          aria-label="Digital twin scenario drawer"
        >
          <div className="row spread">
            <div>
              <p className="eyebrow">
                Countermeasure scenario · Saved on this device
              </p>
              <h2>Your next 30 mission days</h2>
            </div>
            <button className="btn small" onClick={() => setOpen(false)}>
              Close forecaster
            </button>
          </div>
          <p className="small muted">
            An illustrative digital twin for exploring tradeoffs. These curves
            are a transparent prototype model, not measured bone density, VO₂, a
            clinical risk estimate, or a forecast validated for this astronaut.
            Your health score and prescribed tasks stay unchanged.
          </p>
          <div className="twin-sliders">
            {[
              ["workout", "ARED Workout", 0, 150, 5, "min/day"],
              ["water", "Water Intake", 0.5, 4, 0.1, "L/day"],
              ["sleep", "Sleep", 3, 10, 0.5, "hrs/night"],
              ["shielding", "Storm Shielding", 0, 100, 5, "% coverage"],
            ].map(([key, label, min, max, step, unit]) => (
              <label key={key} htmlFor={`${uid}-${key}`}>
                <span>
                  {label}
                  <b>
                    {settings[key]} {unit}
                  </b>
                </span>
                <input
                  id={`${uid}-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={settings[key]}
                  onChange={(e) =>
                    saveTwinSettings(pid, { [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <div className="twin-curves">
            {METRICS.map(([key, title, caption]) => {
              const values = [...data, ...reference].map((r) => r[key]),
                low = Math.min(...values) - 0.5,
                high = Math.max(...values) + 0.5;
              const points = (rows) =>
                rows
                  .map(
                    (r) =>
                      `${12 + r.day * 9.2},${102 - ((r[key] - low) / (high - low)) * 78}`,
                  )
                  .join(" ");
              return (
                <section key={key} className="twin-metric">
                  <h3>{title}</h3>
                  <p className="small muted">{caption}</p>
                  <svg
                    viewBox="0 0 300 130"
                    role="img"
                    aria-label={`${title}: ${data[0][key]} today to ${data[30][key]} on day 30`}
                  >
                    <path
                      className="trend-gridline"
                      d="M12 24H288M12 63H288M12 102H288"
                    />
                    <polyline
                      className="twin-reference"
                      points={points(reference)}
                    />
                    <polyline className="trend-primary" points={points(data)} />
                    <text x="12" y="123">
                      Today
                    </text>
                    <text x="288" y="123" textAnchor="end">
                      +30 days
                    </text>
                  </svg>
                  <p className="twin-endpoint">
                    {data[0][key]} → <b>{data[30][key]}</b> <small>index</small>
                  </p>
                </section>
              );
            })}
          </div>
          <p className="small muted">
            Solid: your scenario. Dashed: reference scenario (60 min ARED, 2.5 L
            water, 8 h sleep, 80% shielding). Gravity follows the current
            mission setting.
          </p>
          <div className="row">
            <button
              className="btn small"
              onClick={() => saveTwinSettings(pid, TWIN_DEFAULTS)}
            >
              Reset scenario sliders
            </button>
            <details className="twin-assumptions">
              <summary>Model assumptions</summary>
              <p>
                All curves begin at index 100 except renal risk, which begins at
                an arbitrary index of 35. Exercise, hydration, sleep and
                shielding change the endpoints through fixed demonstration
                coefficients; curves approach them smoothly over 30 days.
                Shielding affects only the modeled exposure component.
                Coefficients are not learned from your data and do not predict
                an actual storm.
              </p>
              <p>
                <a
                  href="https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/"
                  target="_blank"
                  rel="noreferrer"
                >
                  NASA background on bone changes ↗
                </a>{" "}
                provides context for the scenario, not validation of these
                equations.
              </p>
            </details>
          </div>
        </aside>
      )}
    </section>
  );
}
