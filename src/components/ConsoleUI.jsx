import React from "react";

const paths = {
  today:
    "M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1m3 9 3 3 5-5",
  body: "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-7 3h14m-7-1v6m0 0-4 6m4-6 4 6",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18m0-5v.1m-3-8a3 3 0 0 1 6 0c0 2-3 2-3 5",
  crew: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-2a7 7 0 0 1 14 0v2m1-17a4 4 0 0 1 0 7m3 10v-2a6 6 0 0 0-3-5",
  more: "M5 4v16m7-16v16m7-16v16M2 8h6m1 8h6m1-10h6",
  bell: "M6 9a6 6 0 0 1 12 0c0 7 3 7 3 8H3c0-1 3-1 3-8m4 12h4",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  down: "m7 10 5 5 5-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18m0-15v6l4 2",
  orbit:
    "M17 7A7 7 0 0 0 7 17m0 0a7 7 0 0 0 10-10M3 18C-2 13 16-1 21 6S8 23 3 18",
  link: "m10 14 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1a4 4 0 0 1 6 0l-4 4m0-10 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
  check: "m5 12 4 4 10-10",
  alert: "M12 3 2 21h20L12 3m0 6v5m0 3v1",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18m0-11v6m0-9v.1",
  heart: "M12 21S1 14 2 7c1-5 7-5 10-1 3-4 9-4 10 1 1 7-10 14-10 14",
  eyes: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  brain:
    "M10 3C6 1 3 5 5 8c-4 1-4 7 0 8-1 4 3 6 5 4V3m4 0c4-2 7 2 5 5 4 1 4 7 0 8 1 4-3 6-5 4V3",
  water: "M12 2s-7 9-7 14a7 7 0 0 0 14 0c0-5-7-14-7-14",
  camera: "M8 6 10 3h4l2 3h5v15H3V6h5m4 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  radiation:
    "M12 12h.01M10 8 7 3a10 10 0 0 1 10 0l-3 5m2 3h6a10 10 0 0 1-5 9l-3-5m-4 0-3 5a10 10 0 0 1-5-9h6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-7v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
  medical:
    "M6 3H3v6a6 6 0 0 0 12 0V3h-3M9 15v3a4 4 0 0 0 8 0v-4m0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  send: "m22 2-7 20-4-9-9-4L22 2m0 0L11 13",
  kit: "M8 7V3h8v4M3 7h18v14H3V7m9 4v6m-3-3h6",
  book: "M4 3h15v18H6a2 2 0 0 1-2-2V3m0 14h15",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  exercise: "M3 7v10m4-13v16m10-16v16m4-13v10M7 12h10",
  journal: "M5 3h14v18H5V3m4 5h6m-6 4h6m-6 4h4",
  grid: "M3 3h18v18H3V3m6 0v18m6-18v18M3 9h18M3 15h18",
  air: "M2 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M2 16h6a3 3 0 1 1-3 3",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4m-4 10 3 3 5-6",
  message: "M3 3h18v14H9l-6 4V3",
  star: "m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1 3-7",
  emergency:
    "M7 18V9a5 5 0 0 1 10 0v9M4 18h16v4H4v-4M12 0v2M2 5l2 2m16 0 2-2M1 12h3m16 0h3",
  search: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14m5-2 7 7",
  download: "M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5",
  refresh: "M20 7a9 9 0 1 0 1 9M20 2v6h-6",
};

export function Icon({ name = "info", size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.info} />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-orb">
        <Icon name="orbit" size={30} />
        <span>+</span>
      </span>
      NASA Med
    </span>
  );
}
export function Panel({
  title,
  tone = "neutral",
  className = "",
  children,
  ...props
}) {
  return (
    <section className={`console-panel tone-${tone} ${className}`} {...props}>
      {title && <h3 className="panel-tab">{title}</h3>}
      {children}
    </section>
  );
}
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children && <div className="page-title-actions">{children}</div>}
    </div>
  );
}
export function Status({ status = "unknown", children }) {
  const labels = {
    green: "All good",
    yellow: "Needs attention",
    red: "Alert",
    unknown: "Not checked",
    info: "For info",
  };
  return (
    <span className={`status status-${status}`}>
      <Icon
        name={
          status === "green" ? "check" : status === "red" ? "alert" : "info"
        }
        size={15}
      />
      {children || labels[status]}
    </span>
  );
}
export function Segments({
  value,
  max = 100,
  count = 10,
  label,
  tone = "info",
}) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div
      className={`segments tone-${tone}`}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span style={{ width: `${pct}%` }} />
      <i style={{ backgroundSize: `${100 / count}% 100%` }} />
    </div>
  );
}
export function Sparkline({ values, label, baseline, bars = false }) {
  if (!values.length) return <p className="muted small">No readings yet.</p>;
  const low = Math.min(...values, baseline ?? Infinity);
  const high = Math.max(...values, baseline ?? -Infinity);
  const min = bars ? Math.min(0, low) : low - (high - low || 1) * 0.25;
  const max = high + (high - min || 1) * 0.15;
  const y = (v) => 94 - ((v - min) / (max - min || 1)) * 82;
  const points = values
    .map((v, i) => `${8 + (i * 384) / Math.max(1, values.length - 1)},${y(v)}`)
    .join(" ");
  return (
    <svg
      className="sparkline"
      viewBox="0 0 400 110"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      {[25, 55, 85].map((n) => (
        <path key={n} d={`M0 ${n}H400`} className="spark-grid" />
      ))}
      {baseline != null && (
        <path d={`M0 ${y(baseline)}H400`} className="spark-baseline" />
      )}
      {bars ? (
        values.map((v, i) => (
          <rect
            key={i}
            x={(i * 400) / values.length + 3}
            y={y(v)}
            width={400 / values.length - 6}
            height={Math.max(1, 98 - y(v))}
            rx="2"
            opacity={i === values.length - 1 ? 1 : 0.5}
          />
        ))
      ) : (
        <polyline points={points} />
      )}
    </svg>
  );
}
export function Back({ children = "Back", onClick }) {
  return (
    <button className="text-button back-button" onClick={onClick}>
      <Icon name="back" size={17} />
      {children}
    </button>
  );
}
