import React, { useId } from "react";
import { useStore } from "../backend/store.js";
import { indicators } from "../lib.js";
import {
  BASELINE_MODES,
  OVERLAYS,
  chartPreferences,
  setChartPreferences,
  chartReference,
  environmentRows,
  correlationInsight,
  dailyTrendRows,
} from "../backend/trendModel.js";

const num = (n) =>
  Number.isFinite(n) ? Number(n.toFixed(Math.abs(n) < 10 ? 2 : 1)) : "—";
const domain = (values) => {
  const v = values.filter(Number.isFinite);
  if (!v.length) return [0, 1];
  const lo = Math.min(...v),
    hi = Math.max(...v),
    pad = (hi - lo || Math.abs(hi) * 0.1 || 1) * 0.12;
  return [lo - pad, hi + pad];
};
function pathFor(rows, key, x, y) {
  let drawing = false;
  return rows
    .map((r) => {
      if (!Number.isFinite(r[key])) {
        drawing = false;
        return "";
      }
      const prefix = drawing ? "L" : "M";
      drawing = true;
      return `${prefix}${x(r.day)},${y(r[key])}`;
    })
    .join(" ");
}
export default function HealthTrend({
  pid,
  indicatorId,
  rows: suppliedRows,
  label,
  unit,
  days = 14,
  compact = false,
}) {
  const state = useStore(),
    uid = useId(),
    ind = indicators.find((i) => i.id === indicatorId);
  const title = label || ind?.label || "Health reading",
    units = unit ?? ind?.unit ?? "";
  const all = dailyTrendRows(
    suppliedRows ||
      (state.history[pid] || []).map((r) => ({
        day: r.day,
        value: r[indicatorId],
      })),
  );
  const prefs = chartPreferences(state, pid, indicatorId);
  const reference = chartReference(
    indicatorId,
    all,
    prefs.mode,
    state.mission.environment,
  );
  const rows = environmentRows(state, pid, all.slice(-days), prefs.overlay);
  const change = (patch) => setChartPreferences(pid, indicatorId, patch);
  const left = 53,
    right = 547,
    top = 27,
    bottom = 187;
  const firstDay = rows[0]?.day || 0,
    lastDay = rows.at(-1)?.day || firstDay + 1;
  const x = (day) =>
    left + ((day - firstDay) / (lastDay - firstDay || 1)) * (right - left);
  const [lo, hi] = domain([
    ...rows.map((r) => r.value),
    reference.line,
    ...(reference.band || []),
  ]);
  const y = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const [elo, ehi] = domain(rows.map((r) => r.overlay));
  const ey = (v) => bottom - ((v - elo) / (ehi - elo)) * (bottom - top);
  const overlay = prefs.overlay !== "none",
    overlayInfo = OVERLAYS[prefs.overlay];
  return (
    <section
      className={`health-trend ${compact ? "compact" : ""}`}
      aria-label={`${title} trend`}
    >
      <div className="trend-control-grid">
        <label htmlFor={uid + "-baseline"}>
          Comparison baseline
          <select
            id={uid + "-baseline"}
            value={prefs.mode}
            onChange={(e) => change({ mode: e.target.value })}
          >
            {BASELINE_MODES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={uid + "-overlay"}>
          Environmental overlay
          <select
            id={uid + "-overlay"}
            value={prefs.overlay}
            onChange={(e) => change({ overlay: e.target.value })}
          >
            {Object.entries(OVERLAYS).map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}
                {info.unit ? ` (${info.unit})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="small trend-key">
        <span>
          {title} · {units}
        </span>
        {overlay && (
          <span className="overlay-key">
            Dashed: {overlayInfo.label} · {overlayInfo.unit}
          </span>
        )}
      </p>
      {!rows.some((r) => Number.isFinite(r.value)) ? (
        <p className="muted">No saved readings yet.</p>
      ) : (
        <svg
          viewBox="0 0 610 225"
          className="health-trend-svg"
          role="img"
          aria-labelledby={uid + "-title"}
        >
          <title
            id={uid + "-title"}
          >{`${title} from mission day ${firstDay} to ${lastDay}. ${overlay ? `${overlayInfo.label} uses the separate right axis.` : ""}`}</title>
          {reference.band && (
            <rect
              className="trend-band"
              x={left}
              width={right - left}
              y={y(reference.band[1])}
              height={Math.max(0, y(reference.band[0]) - y(reference.band[1]))}
            />
          )}
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <path
                className="trend-gridline"
                d={`M${left} ${top + t * (bottom - top)}H${right}`}
              />
              <text
                x={left - 8}
                y={top + t * (bottom - top) + 4}
                textAnchor="end"
              >
                {num(hi - t * (hi - lo))}
              </text>
              {overlay && (
                <text
                  className="overlay-axis"
                  x={right + 8}
                  y={top + t * (bottom - top) + 4}
                >
                  {num(ehi - t * (ehi - elo))}
                </text>
              )}
            </g>
          ))}
          {Number.isFinite(reference.line) && (
            <path
              className="trend-baseline"
              d={`M${left} ${y(reference.line)}H${right}`}
            />
          )}
          <path className="trend-primary" d={pathFor(rows, "value", x, y)} />
          {overlay && (
            <path
              className="trend-overlay"
              d={pathFor(rows, "overlay", x, ey)}
            />
          )}
          {rows.map(
            (r, index) =>
              Number.isFinite(r.value) && (
                <circle
                  key={index}
                  className="trend-point"
                  cx={x(r.day)}
                  cy={y(r.value)}
                  r="2.6"
                >
                  <title>{`Day ${r.day}: ${num(r.value)} ${units}${overlay ? `; ${overlayInfo.label}: ${num(r.overlay)} ${overlayInfo.unit}` : ""}`}</title>
                </circle>
              ),
          )}
          <text x={left} y="212">
            Day {firstDay}
          </text>
          <text x={right} y="212" textAnchor="end">
            Day {lastDay}
          </text>
        </svg>
      )}
      <p className="small muted">
        {reference.note}{" "}
        {reference.source && (
          <a href={reference.source} target="_blank" rel="noreferrer">
            Reference ↗
          </a>
        )}
      </p>
      {all.some((r) => r.count > 1) && (
        <p className="small muted">
          Multiple saved tests on the same day are averaged into one daily
          point.
        </p>
      )}
      {overlay && (
        <div className="correlation-insight" role="status">
          <b>Correlation insight</b>
          <p>{correlationInsight(rows, title, prefs.overlay)}</p>
          {prefs.overlay === "noise" && (
            <small>
              Noise is a simulated daily signal where no stored microphone
              reading exists.
            </small>
          )}
        </div>
      )}
      <details className="trend-data-table">
        <summary>View chart readings</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mission day</th>
                <th>
                  {title} ({units})
                </th>
                {overlay && (
                  <th>
                    {overlayInfo.label} ({overlayInfo.unit})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.day}</td>
                  <td>{num(r.value)}</td>
                  {overlay && <td>{num(r.overlay)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
