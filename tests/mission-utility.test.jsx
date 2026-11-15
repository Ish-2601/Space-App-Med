import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeDisplay, getDisplay, setDisplay } from "../src/display.js";
import {
  normalizeVoiceCommand,
  executeMissionCommand,
} from "../src/components/handsFree.js";
import MissionUtilityBar from "../src/components/MissionUtilityBar.jsx";
import { resetAll, getState } from "../src/backend/api.js";
import { setSandboxMode, saveSandboxRecord } from "../src/backend/sandbox.js";

beforeEach(async () => {
  await resetAll();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
const person = () => getState().crew.find((p) => p.id === "okafor");

function commandContext(main = {}) {
  return {
    doc: {
      querySelector: () => ({
        querySelector: () => null,
        querySelectorAll: () => [],
        ...main,
      }),
    },
    navigate: vi.fn(),
    speak: vi.fn(() => true),
    startTimer: vi.fn(),
  };
}

describe("circadian preferences", () => {
  it("migrates saved night preferences without losing larger text", () => {
    expect(normalizeDisplay({ night: true, large: true })).toMatchObject({
      mode: "redshift",
      night: true,
      large: true,
    });
    expect(normalizeDisplay({ night: false })).toMatchObject({
      mode: "standard",
      night: false,
    });
    expect(normalizeDisplay({ mode: "alertness", night: true })).toMatchObject({
      mode: "alertness",
      night: false,
    });
  });
  it("persists all three modes and applies mutually exclusive root classes", () => {
    const stored = new Map();
    const classes = new Set();
    vi.stubGlobal("localStorage", {
      getItem: (key) => stored.get(key),
      setItem: (key, value) => stored.set(key, value),
    });
    vi.stubGlobal("document", {
      documentElement: {
        dataset: {},
        classList: {
          toggle: (key, on) => (on ? classes.add(key) : classes.delete(key)),
        },
      },
    });
    for (const mode of ["alertness", "redshift", "standard"]) {
      setDisplay({ mode, large: true });
      expect(getDisplay().mode).toBe(mode);
      expect(classes.has("circadian-redshift")).toBe(mode === "redshift");
      expect(classes.has("circadian-alertness")).toBe(mode === "alertness");
      expect(classes.has("large-text")).toBe(true);
    }
  });
});

describe("hands-free command actions", () => {
  it("recognizes only supported phrases, not arbitrary speech", () => {
    expect(normalizeVoiceCommand("Please open Emergency!")).toBe(
      "Open Emergency",
    );
    expect(normalizeVoiceCommand("record vitals")).toBe("Record vitals");
    expect(normalizeVoiceCommand("delete my health data")).toBeNull();
  });
  it("opens the existing Emergency route and starts the usable timer", () => {
    const context = commandContext();
    executeMissionCommand("Open Emergency", context);
    executeMissionCommand("Start timer", context);
    expect(context.navigate).toHaveBeenCalledWith("emergency");
    expect(context.startTimer).toHaveBeenCalledOnce();
  });
  it("reads the current screen and handles unavailable synthesis", () => {
    const context = commandContext({
      innerText: "Check breathing and responsiveness.",
    });
    executeMissionCommand("Read aloud", context);
    expect(context.speak).toHaveBeenCalledWith(
      "Check breathing and responsiveness.",
    );
    context.speak.mockReturnValue(false);
    expect(executeMissionCommand("Read aloud", context)).toContain(
      "unavailable",
    );
  });
  it("advances an available step while leaving disabled Next controls alone", () => {
    const blocked = {
      disabled: true,
      hidden: false,
      textContent: "Next",
      matches: () => true,
      click: vi.fn(),
    };
    const next = {
      disabled: false,
      hidden: false,
      textContent: "Next",
      matches: () => true,
      click: vi.fn(),
    };
    const context = commandContext({ querySelectorAll: () => [blocked, next] });
    executeMissionCommand("Next step", context);
    expect(blocked.click).not.toHaveBeenCalled();
    expect(next.click).toHaveBeenCalledOnce();
  });
  it("records vitals through form validation and never bypasses a missing reading", () => {
    const focus = vi.fn();
    const form = {
      reportValidity: vi.fn(() => false),
      requestSubmit: vi.fn(),
      querySelector: () => ({ focus }),
    };
    const context = commandContext({ querySelector: () => form });
    expect(executeMissionCommand("Record vitals", context)).toContain(
      "missing",
    );
    expect(form.requestSubmit).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalledOnce();
    form.reportValidity.mockReturnValue(true);
    executeMissionCommand("Record vitals", context);
    expect(form.requestSubmit).toHaveBeenCalledOnce();
  });
  it("opens the existing heart review when there is no protocol form", () => {
    const context = commandContext();
    executeMissionCommand("Record vitals", context);
    expect(context.navigate).toHaveBeenCalledWith("review-heart");
  });
});

describe("global utility rendering", () => {
  it("offers all three utilities without asking for a microphone on render", () => {
    const html = renderToStaticMarkup(
      <MissionUtilityBar person={person()} navigate={() => {}} />,
    );
    expect(html).toContain("Private Sandbox: OFF");
    expect(html).toContain("Hands-Free");
    expect(html).toContain("480nm Alertness Mode");
    expect(html).toContain("Standard Orbit Day");
    expect(html).toContain("Circadian Red-Shift");
    expect(html).not.toContain("Microphone listening");
  });
  it("shows private saving confirmation and a critical escalation decision", () => {
    setSandboxMode(true);
    saveSandboxRecord(person().id, "diagnostic", { values: { spo2: 84 } });
    const html = renderToStaticMarkup(
      <MissionUtilityBar person={person()} navigate={() => {}} />,
    );
    expect(html).toContain("Private Sandbox: ON");
    expect(html).toContain("Saved privately");
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("Escalate critical finding");
    expect(html).toContain("Keep private for now");
  });
});
