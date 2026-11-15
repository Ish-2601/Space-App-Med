import React, { useState } from "react";
import {
  useStore,
  addJournal,
  deleteJournal,
  sendReport,
  COPING,
} from "../backend/api.js";
import { PageTitle, Icon } from "../components/ConsoleUI.jsx";
import HealthTrend from "../components/HealthTrend.jsx";
import {
  sandboxEnabled,
  privateRecordsFor,
  deletePrivateRecord,
} from "../backend/sandbox.js";
export default function Mind({ person, go, embedded = false }) {
  const state = useStore(),
    pid = person.id;
  const [text, setText] = useState(""),
    [mood, setMood] = useState(7),
    [error, setError] = useState(""),
    [sent, setSent] = useState(""),
    [saved, setSaved] = useState("");
  const privateMode = sandboxEnabled(state);
  const entries = privateMode
    ? privateRecordsFor(state, pid)
        .filter((r) => r.kind === "journal" && !r.draft)
        .map((r) => ({ ...r, ...r.payload }))
    : state.journal[pid];
  function save() {
    if (!text.trim()) {
      setError("Write something first.");
      return;
    }
    addJournal(pid, text.trim(), mood);
    setText("");
    setError("");
    setSaved(
      privateMode
        ? "Saved in Private Sandbox. Your public health record is unchanged."
        : "Journal entry saved on this device.",
    );
  }
  return (
    <div className="mind-content">
      {!embedded && (
        <PageTitle
          eyebrow="Crew · Mind"
          title="Room to breathe"
          description="A quiet place to reflect, notice patterns, and stay connected."
        />
      )}
      <p className="eyebrow">Your mood this week</p>
      <HealthTrend compact pid={pid} indicatorId="mood" days={7} />
      <div className="row spread small muted">
        <span>7 days ago</span>
        <button
          className="text-button"
          onClick={() => go("trends", { indicator: "mood" })}
        >
          See trend <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="section-divider" />
      <h3>Personal journal</h3>
      <p className="small muted">
        {privateMode
          ? "Private Sandbox journal. Entries stay separate from your public crew record; this is local separation, not encrypted access control."
          : "Saved on this device. Anyone using this crew profile can see these entries."}
      </p>
      <label className="sr-only" htmlFor="journal-entry">
        Journal entry
      </label>
      <textarea
        id="journal-entry"
        rows="4"
        value={text}
        placeholder="How was today?"
        onChange={(e) => {
          setText(e.target.value);
          setError("");
        }}
      />
      <label className="range-label">
        Mood now <b>{mood} / 10</b>
        <input
          type="range"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
        />
      </label>
      <button className="btn" onClick={save}>
        <Icon name="journal" />
        Save entry
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="small" role="status">
          {saved}
        </p>
      )}
      {entries.length > 0 && (
        <details className="journal-history">
          <summary>
            {entries.length} saved journal{" "}
            {entries.length === 1 ? "entry" : "entries"}
          </summary>
          {entries.map((j) => (
            <article key={j.id} className="transmission">
              <span className="small muted">
                Day {j.day} · Mood {j.mood}/10
              </span>
              <p>{j.text}</p>
              <button
                className="text-button"
                onClick={() =>
                  privateMode
                    ? deletePrivateRecord(pid, j.id)
                    : deleteJournal(pid, j.id)
                }
              >
                Delete entry
              </button>
            </article>
          ))}
        </details>
      )}
      <div className="section-divider" />
      <p className="eyebrow">Small ways to reconnect</p>
      <ul className="quiet-list">
        {COPING.map((c) => (
          <li key={c}>
            <Icon name="star" size={15} />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      <button
        className="btn"
        onClick={() => {
          sendReport(
            pid,
            "psych",
            "Requesting a private conference with ground support.",
          );
          setSent(
            privateMode
              ? "Saved in Private Sandbox. No ground-support request queued."
              : "Request queued in the simulated Earth link.",
          );
        }}
      >
        <Icon name="message" />
        Request ground support
      </button>
      {sent && (
        <p className="small" role="status">
          {sent}
        </p>
      )}
    </div>
  );
}
