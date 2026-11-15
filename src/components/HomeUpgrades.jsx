import React, { useEffect, useRef, useState } from "react";
import { useStore, tasksFor } from "../backend/api.js";
import { sandboxEnabled } from "../backend/sandbox.js";
import {
  WEARABLES,
  wearableSnapshot,
  syncWearableSnapshot,
  saveQuickPulse,
  saveVoiceBiomarkers,
  latestHomeRecord,
  motorReadiness,
  recoveryStatus,
  completeRecovery,
} from "../backend/homeUpgrades.js";
import { Panel, Icon } from "./ConsoleUI.jsx";

function sampleLabel(id, snapshot) {
  const v = snapshot.values;
  if (id === "astroskin")
    return `${v.heartRate} bpm · ${v.respiratoryRate} breaths/min`;
  if (id === "garmin")
    return `${v.hrv} ms HRV · ${v.sleep} h sleep · ${v.skinTemp} °C skin`;
  if (id === "dexcom")
    return `${v.glucose} mg/dL ${Math.abs(snapshot.glucoseTrend) < 3 ? "→" : snapshot.glucoseTrend > 0 ? "↗" : "↘"}`;
  if (id === "biobutton") return `${v.heartRate} bpm resting heart rate`;
  if (id === "cosinuss") return `${v.temp} °C core temperature`;
  return `${v.doseRate} mSv/hr · ${v.localCo2Ppm.toLocaleString()} ppm CO₂`;
}

export function WearablesBar({ person }) {
  const state = useStore();
  const [at, setAt] = useState(Date.now);
  const [message, setMessage] = useState("");
  const snapshot = wearableSnapshot(state, person.id, at);
  const latest = latestHomeRecord(
    state,
    person.id,
    "wearables",
    "wearableSnapshot",
  );
  useEffect(() => {
    const interval = setInterval(() => setAt(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Panel
      title="Connected biometric wearables"
      className="wearables-window"
      id="wearables"
    >
      <div className="row spread">
        <p className="small muted">
          Simulated BLE / ANT+ · sample refreshed every 15 seconds
        </p>
        <span className="wearable-status">
          <i />6 simulated links
        </span>
      </div>
      <div className="wearable-grid">
        {WEARABLES.map((device) => (
          <details className="wearable-pill" key={device.id}>
            <summary>
              <span className="wearable-status">
                <i />
                {device.name}
              </span>
              <small>{sampleLabel(device.id, snapshot)}</small>
            </summary>
            <p className="small muted">
              {device.channels} · {device.protocol}. Demo samples only; no
              physical device is connected.
            </p>
          </details>
        ))}
      </div>
      <div className="row spread wearable-sync">
        <button
          className="btn"
          onClick={() => {
            const saved = syncWearableSnapshot(person.id, snapshot);
            setMessage(
              saved.private
                ? "Snapshot saved only to Private Sandbox."
                : "Wearable snapshot synced to today's physiological readings.",
            );
          }}
        >
          <Icon name="refresh" />
          Sync Wearable Snapshot to Today's Readings
        </button>
        <small className="muted">
          {latest
            ? `Last ${latest.private ? "private " : ""}sync: ${new Date(latest.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "No snapshot synced today"}
        </small>
      </div>
      <p className="small muted">
        Blood pressure and SpO₂ still use your separate cuff and oximeter
        checks.
      </p>
      {message && (
        <p className="small" role="status">
          {message}
        </p>
      )}
    </Panel>
  );
}

const pulseFields = [
  {
    id: "mood",
    title: "Mood",
    faces: ["😞", "🙁", "😐", "🙂", "😊"],
    labels: ["Very low", "Low", "Neutral", "Good", "Great"],
  },
  {
    id: "energy",
    title: "Energy",
    faces: ["😴", "🥱", "😐", "🙂", "⚡"],
    labels: ["Depleted", "Low", "Moderate", "Ready", "Energized"],
  },
  {
    id: "restfulness",
    title: "Sleep restfulness",
    faces: ["😵", "🥱", "😐", "😌", "🌙"],
    labels: [
      "Unrested",
      "Tired",
      "Somewhat rested",
      "Rested",
      "Fully restored",
    ],
  },
];

export function QuickPulse({ person }) {
  const state = useStore();
  const privateMode = sandboxEnabled(state);
  const pulse = latestHomeRecord(state, person.id, "quickPulse");
  const voice = latestHomeRecord(state, person.id, "voiceBiomarkers");
  const [seconds, setSeconds] = useState(null);
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  const startedAt = useRef(0);
  useEffect(() => {
    setSeconds(null);
    setMessage("");
    return () => clearInterval(timer.current);
  }, [person.id, privateMode]);
  function startVoice() {
    clearInterval(timer.current);
    startedAt.current = Date.now();
    setSeconds(5);
    setMessage(
      "Simulated five-second voice sample running. The microphone is off.",
    );
    timer.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, Math.ceil(5 - elapsed));
      setSeconds(left);
      if (left === 0) {
        clearInterval(timer.current);
        saveVoiceBiomarkers(person.id, { durationSec: elapsed });
        setSeconds(null);
        setMessage(
          "Simulated acoustic biomarkers saved. These are demo values, not an analysis of your voice.",
        );
      }
    }, 200);
  }
  return (
    <section
      className="quick-pulse"
      aria-labelledby="quick-pulse-title"
      id="quick-pulse"
    >
      <div className="row spread">
        <div>
          <h3 id="quick-pulse-title">5-second Quick Pulse</h3>
          <p className="small muted">
            One tap for each feeling. Each choice saves immediately
            {privateMode ? " to your sandbox" : ""}.
          </p>
        </div>
        <span className="small muted">Before your full daily check-in</span>
      </div>
      <div className="pulse-sliders">
        {pulseFields.map((field) => (
          <fieldset key={field.id}>
            <legend>{field.title}</legend>
            <div
              role="radiogroup"
              aria-label={field.title}
              className="emoji-scale"
            >
              {field.faces.map((emoji, index) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={pulse?.[field.id] === index + 1}
                  aria-label={`${field.title}: ${field.labels[index]} (${index + 1} of 5)`}
                  key={index}
                  onClick={() => {
                    saveQuickPulse(person.id, { [field.id]: index + 1 });
                    setMessage(
                      `${field.title} saved${privateMode ? " privately" : ""}: ${field.labels[index]}.`,
                    );
                  }}
                >
                  <span aria-hidden="true">{emoji}</span>
                  <small>{index + 1}</small>
                </button>
              ))}
            </div>
            <small className="muted">
              {pulse?.[field.id]
                ? field.labels[pulse[field.id] - 1]
                : "Not recorded"}
            </small>
          </fieldset>
        ))}
      </div>
      <div className="row">
        <button className="btn" disabled={seconds != null} onClick={startVoice}>
          🎙️ {seconds != null ? `${seconds}s remaining` : "5-Sec Voice Log"}
        </button>
        {seconds != null && (
          <button
            className="text-button"
            onClick={() => {
              clearInterval(timer.current);
              setSeconds(null);
              setMessage("Voice simulation cancelled; no sample saved.");
            }}
          >
            Cancel sample
          </button>
        )}
        <small className="muted">
          Acoustic biomarker simulation · microphone off
        </small>
      </div>
      {voice && (
        <div
          className="voice-biomarkers"
          aria-label="Simulated acoustic voice biomarkers"
        >
          <span>
            <small>Speech cadence</small>
            <b>{voice.speechCadence} words/min</b>
          </span>
          <span>
            <small>Pitch variability</small>
            <b>{voice.pitchVariability}%</b>
          </span>
          <span>
            <small>Vocal fatigue drift</small>
            <b>+{voice.vocalFatigueDrift}%</b>
          </span>
          <p className="small muted">
            Compared with a simulated rested baseline of{" "}
            {voice.baseline.cadence} words/min and{" "}
            {voice.baseline.pitchVariability}% pitch variability. Demo values
            respond to your energy and restfulness ratings.
          </p>
        </div>
      )}
      {message && (
        <p className="small" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export function ReadinessBadge({ person }) {
  const state = useStore();
  const readiness = motorReadiness(state, person.id);
  return (
    <details className="readiness-badge" id="motor-readiness">
      <summary>
        <Icon name="brain" size={18} />
        <span>Cognitive Motor Readiness</span>
        <b>
          {readiness.score == null ? "Learning" : `${readiness.score} / 100`}
        </b>
      </summary>
      <p className="small muted">
        {readiness.label}. {readiness.samples} form interactions sampled today.
        Only timing, input type, and correction counts are saved; never typed
        text.
      </p>
      {readiness.score != null && (
        <p className="small muted">
          Mean interaction latency {readiness.latencyMs} ms · corrections{" "}
          {readiness.correctionRate}%. Compared with the first interaction
          samples in this day's window. This interaction score is exploratory
          and does not change your health score.
        </p>
      )}
    </details>
  );
}

export function RecoveryNotice({ person }) {
  const state = useStore();
  const recovery = recoveryStatus(state, person.id);
  const [message, setMessage] = useState("");
  if (!recovery.active) return null;
  return (
    <div className="recovery-notice">
      <Icon name="moon" />
      <div>
        <b>Active Recovery (Streak Preserved)</b>
        <p className="small muted">
          Today's high-strain workout is replaced because of {recovery.reason}.
          Choose gentle mobility, a quiet rest break, and your crew's recovery
          plan.
        </p>
        <p className="small muted">
          Completing your recovery plan earns the workout points and preserves
          this day's streak without adding exercise minutes.
        </p>
        {!recovery.completed && (
          <button
            className="btn small"
            onClick={() => {
              completeRecovery(person.id);
              setMessage(
                sandboxEnabled(state)
                  ? "Recovery logged only in the private sandbox; crew progress is unchanged."
                  : "Recovery plan completed. Your streak is preserved.",
              );
            }}
          >
            Mark recovery plan complete
          </button>
        )}
        {recovery.completed && (
          <p className="small">✓ Recovery plan complete</p>
        )}
        {message && (
          <p className="small" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export function CrewBioDome() {
  const state = useStore();
  const [crop, setCrop] = useState("tomatoes");
  const contributions = state.crew.map((person) => ({
    person,
    completed: tasksFor(state, person.id).filter((task) => task.done).length,
  }));
  const todayCompleted = contributions.reduce(
    (total, entry) => total + entry.completed,
    0,
  );
  const lifetimeCompleted = state.crew.reduce(
    (total, person) =>
      total +
      state.history[person.id].reduce(
        (sum, row) =>
          sum +
          tasksFor(state, person.id, row.day).filter((task) => task.done)
            .length,
        0,
      ),
    0,
  );
  const growth = Math.min(1, todayCompleted / 28);
  const stage =
    growth < 0.2
      ? "Seedling"
      : growth < 0.5
        ? "Leafing"
        : growth < 0.8
          ? "Growing"
          : "Flourishing";
  const selectCrop = (value, event) => {
    if (
      !event ||
      event.type === "click" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event?.preventDefault();
      setCrop(value);
    }
  };
  return (
    <Panel
      title="Cooperative Crew Bio-Dome"
      className="biodome-panel"
      id="crew-biodome"
    >
      <div className="row spread">
        <b>A small garden, grown together</b>
        <span className="small muted">{todayCompleted} crew tasks today</span>
      </div>
      <svg
        className="biodome"
        viewBox="0 0 500 260"
        role="group"
        aria-label={`Interactive crew terrarium: ${stage.toLowerCase()} dwarf tomatoes and mizuna lettuce. ${todayCompleted} tasks completed today.`}
      >
        <defs>
          <linearGradient id="dome-glass" x2="0" y2="1">
            <stop stopColor="#768c9a" stopOpacity=".12" />
            <stop offset="1" stopColor="#768c9a" stopOpacity=".03" />
          </linearGradient>
        </defs>
        <path
          d="M30 223V148C30 7 470 7 470 148V223Z"
          fill="url(#dome-glass)"
          stroke="currentColor"
          opacity=".35"
        />
        <path
          d="M50 211h400M72 95c35-62 115-67 180-67"
          fill="none"
          stroke="currentColor"
          opacity=".16"
        />
        <ellipse
          cx="250"
          cy="223"
          rx="220"
          ry="18"
          fill="#11191d"
          stroke="currentColor"
          opacity=".7"
        />
        <g
          role="button"
          tabIndex="0"
          aria-label="Inspect dwarf tomatoes"
          aria-pressed={crop === "tomatoes"}
          onClick={(event) => selectCrop("tomatoes", event)}
          onKeyDown={(event) => selectCrop("tomatoes", event)}
          className={crop === "tomatoes" ? "crop-selected" : ""}
        >
          <rect
            x="83"
            y="68"
            width="154"
            height="155"
            rx="16"
            className="crop-hit"
          />
          {[125, 184].map((x, index) => (
            <g
              key={x}
              transform={`translate(${x} 207) scale(${0.65 + growth * 0.35})`}
            >
              <path
                d="M0 0q-5-40 0-94M0-30q-18-28-32-21M0-52q22-27 35-24M0-75q-16-17-25-12"
                fill="none"
                stroke="#8aab95"
                strokeWidth="4"
              />
              <ellipse
                cx="-24"
                cy="-47"
                rx="16"
                ry="6"
                transform="rotate(24 -24 -47)"
                fill="#789381"
              />
              <ellipse
                cx="28"
                cy="-73"
                rx="16"
                ry="6"
                transform="rotate(-22 28 -73)"
                fill="#789381"
              />
              {growth >= 0.2 && (
                <circle
                  cx="-12"
                  cy="-58"
                  r={5 + growth * 5}
                  fill={growth > 0.6 ? "#b77867" : "#8a9c72"}
                />
              )}
              {growth >= 0.4 && (
                <circle
                  cx="12"
                  cy={-34 - index * 5}
                  r={5 + growth * 4}
                  fill="#b77867"
                />
              )}
            </g>
          ))}
        </g>
        <g
          role="button"
          tabIndex="0"
          aria-label="Inspect mizuna lettuce"
          aria-pressed={crop === "mizuna"}
          onClick={(event) => selectCrop("mizuna", event)}
          onKeyDown={(event) => selectCrop("mizuna", event)}
          className={crop === "mizuna" ? "crop-selected" : ""}
        >
          <rect
            x="265"
            y="68"
            width="154"
            height="155"
            rx="16"
            className="crop-hit"
          />
          {[306, 370].map((x) => (
            <g
              key={x}
              transform={`translate(${x} 211) scale(${0.6 + growth * 0.4})`}
            >
              {[-35, -15, 5, 25, 45].map((angle) => (
                <path
                  key={angle}
                  d="M0 0Q-30-28-14-59L-8-48 0-75 9-48 17-56Q29-20 0 0Z"
                  transform={`rotate(${angle})`}
                  fill="#789381"
                  stroke="#a1b6a5"
                  strokeWidth="1"
                  opacity=".85"
                />
              ))}
            </g>
          ))}
        </g>
        <text
          x="160"
          y="247"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12"
        >
          DWARF TOMATOES
        </text>
        <text
          x="340"
          y="247"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12"
        >
          MIZUNA LETTUCE
        </text>
      </svg>
      <div className="row crop-tabs">
        <button
          className="btn small"
          aria-pressed={crop === "tomatoes"}
          onClick={() => setCrop("tomatoes")}
        >
          Dwarf tomatoes
        </button>
        <button
          className="btn small"
          aria-pressed={crop === "mizuna"}
          onClick={() => setCrop("mizuna")}
        >
          Mizuna lettuce
        </button>
      </div>
      <p className="small">
        <b>
          {stage} · {crop === "tomatoes" ? "Dwarf tomatoes" : "Mizuna lettuce"}
        </b>{" "}
        —{" "}
        {crop === "tomatoes"
          ? "Each completed health task adds growth; fruit appears as your crew's daily care progresses."
          : "Shared care spreads new leaves. Recovery tasks help this garden grow too."}
      </p>
      <div className="dome-contributions">
        {contributions.map(({ person, completed }) => (
          <span key={person.id}>
            {person.name}
            <b>{completed} tasks</b>
          </span>
        ))}
      </div>
      <p className="small muted">
        {lifetimeCompleted} shared care tasks recorded this mission. A new day
        starts a new growth cycle; your mission total is retained. Private
        sandbox tasks stay private.
      </p>
    </Panel>
  );
}
