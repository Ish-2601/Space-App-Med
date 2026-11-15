const KEY = "nasa-med-display";
export const DISPLAY_MODES = [
  { id: "alertness", label: "☀️ 480nm Alertness Mode" },
  { id: "standard", label: "🌤️ Standard Orbit Day" },
  { id: "redshift", label: "🌙 Circadian Red-Shift (0% Blue Light)" },
];
let sessionDisplay = null;

export function normalizeDisplay(value = {}) {
  if (!value || typeof value !== "object") value = {};
  const mode = DISPLAY_MODES.some((m) => m.id === value.mode)
    ? value.mode
    : value.night
      ? "redshift"
      : "standard";
  return { ...value, mode, night: mode === "redshift", large: !!value.large };
}

export function getDisplay() {
  try {
    return normalizeDisplay(JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    return normalizeDisplay(sessionDisplay || {});
  }
}

export function applyDisplay(value = getDisplay()) {
  const d = normalizeDisplay(value);
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("night-mode", d.night);
  root.classList.toggle("circadian-redshift", d.mode === "redshift");
  root.classList.toggle("circadian-alertness", d.mode === "alertness");
  root.classList.toggle("large-text", d.large);
  root.dataset.displayMode = d.mode;
}

export function setDisplay(patch) {
  const next = { ...getDisplay(), ...patch };
  if ("night" in patch && !("mode" in patch))
    next.mode = patch.night ? "redshift" : "standard";
  const d = normalizeDisplay(next);
  sessionDisplay = d;
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* Apply in memory when browser storage is unavailable. */
  }
  applyDisplay(d);
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("displaychange"));
  return d;
}
