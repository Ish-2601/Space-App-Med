// In-memory database with persistence, change notifications and a clock for time-based events.
import { useEffect, useState } from "react";
import { loadState, saveState } from "./storage.js";
import { createInitialState, SCHEMA_VERSION } from "./seed.js";

let state = loadState();
if (!state || state.version !== SCHEMA_VERSION) state = createInitialState();

const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  saveState(state);
  listeners.forEach((fn) => fn());
}

// Run a mutation against the state, then save and notify the UI
export function update(mutator) {
  const result = mutator(state);
  emit();
  return result;
}

export function replaceState(next) {
  state = next;
  emit();
}

// React hook: re-render the component whenever the data changes
export function useStore() {
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return state;
}

// Clock: calls tick(state, now) every second; tick returns true when it changed something
let clock = null;
export function startClock(tick) {
  if (clock) return;
  clock = setInterval(() => {
    if (tick(state, Date.now())) emit();
  }, 1000);
}
