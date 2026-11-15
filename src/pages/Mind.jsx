import React, { useState } from "react";
import {
  useStore,
  addJournal,
  deleteJournal,
  sendReport,
  historyOf,
  COPING,
} from "../backend/api.js";
import { PageTitle, Sparkline, Icon } from "../components/ConsoleUI.jsx";
export default function Mind({ person, go, embedded = false }) {
  const state = useStore(),
    pid = person.id;
  const [text, setText] = useState(""),
    [mood, setMood] = useState(7),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const entries = state.journal[pid],
    last7 = historyOf(state, pid)
      .slice(-7)
      .map((r) => r.mood);
  function save() {
    if (!text.trim()) {
      setError("Write something first.");
      return;
    }
    addJournal(pid, text.trim(), mood);
    setText("");
    setError("");
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
      <Sparkline
        bars
        values={last7}
        label={"Mood over seven days: " + last7.join(", ")}
      />
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
        Saved on this device. Anyone using this crew profile can see these
        entries.
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
                onClick={() => deleteJournal(pid, j.id)}
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
          setSent(true);
        }}
      >
        <Icon name="message" />
        Request ground support
      </button>
      {sent && (
        <p className="small" role="status">
          Request queued in the simulated Earth link.
        </p>
      )}
    </div>
  );
}
