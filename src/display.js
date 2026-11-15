// Per-device display preferences: night mode (dim red light for sleep periods)
// and larger text. Stored in this browser only; safe if storage is blocked.
const KEY = "nasa-med-display";

export function getDisplay() {
  try {
    return { night: false, large: false, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { night: false, large: false };
  }
}

export function applyDisplay(d = getDisplay()) {
  const root = document.documentElement;
  root.classList.toggle("night-mode", !!d.night);
  root.classList.toggle("large-text", !!d.large);
}

export function setDisplay(patch) {
  const d = { ...getDisplay(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage blocked: still apply for this session */
  }
  applyDisplay(d);
  return d;
}
