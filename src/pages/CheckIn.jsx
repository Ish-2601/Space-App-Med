import React, { useState } from "react";
import {
  useStore,
  rowFor,
  historyOf,
  submitCheckIn,
  SYMPTOMS,
  habitatToday,
  symptomsToday,
} from "../backend/api.js";
import { indicators, personalBaseline, rangeText } from "../lib.js";
import { Panel, Back, Segments, Icon } from "../components/ConsoleUI.jsx";
import { sandboxEnabled } from "../backend/sandbox.js";
import usePrivateDraft, {
  privateDraft,
} from "../components/usePrivateDraft.js";

const QUESTIONS = [
  "How did you sleep?",
  "How are you feeling?",
  "Any headache right now?",
  "Has your vision changed?",
  "Any motion sickness?",
  "How is your hydration?",
  "Anything else to report?",
  "Review your readings",
];
const GROUPS = [
  ["sleep"],
  ["mood"],
  [],
  [],
  [],
  ["water"],
  [],
  [
    "heartRate",
    "systolic",
    "diastolic",
    "spo2",
    "temp",
    "mass",
    "exercise",
    "radiation",
  ],
];
export default function CheckIn({ person, go }) {
  const state = useStore(),
    pid = person.id,
    row = rowFor(state, pid),
    history = historyOf(state, pid);
  const existing = state.checkins[pid][state.mission.day];
  const privateMode = sandboxEnabled(state);
  const draft = privateDraft(state, pid, "checkin-draft");
  const [step, setStep] = useState(draft?.step || 0),
    [values, setValues] = useState(
      () =>
        draft?.values ||
        Object.fromEntries(indicators.map((i) => [i.id, row[i.id]])),
    );
  const [motion, setMotion] = useState(draft?.motion ?? existing?.motion ?? 0),
    [symptoms, setSymptoms] = useState(
      () => draft?.symptoms || symptomsToday(state, pid).map((s) => s.id),
    );
  const [answers, setAnswers] = useState(
    draft?.answers || {
      headache:
        existing && !existing.auto ? symptoms.includes("headache") : undefined,
      vision:
        existing && !existing.auto ? symptoms.includes("vision") : undefined,
    },
  );
  const [error, setError] = useState("");
  usePrivateDraft(
    pid,
    "checkin-draft",
    { values, motion, symptoms, answers, step },
    privateMode,
  );
  function toggleSym(id) {
    setSymptoms((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }
  function answer(id, yes) {
    setAnswers({ ...answers, [id]: yes });
    setSymptoms((s) => [...s.filter((x) => x !== id), ...(yes ? [id] : [])]);
  }
  function next() {
    const fields =
      step === 7
        ? indicators
        : indicators.filter((i) => GROUPS[step].includes(i.id));
    const missing = fields.filter(
      (i) =>
        values[i.id] === "" ||
        values[i.id] == null ||
        !Number.isFinite(Number(values[i.id])),
    );
    if (missing.length) {
      setError(
        "Enter a number for " + missing.map((i) => i.label).join(", ") + ".",
      );
      return;
    }
    if (
      step === 7 &&
      (answers.headache === undefined || answers.vision === undefined)
    ) {
      setStep(answers.headache === undefined ? 2 : 3);
      setError("Please answer this question before saving your check-in.");
      return;
    }
    setError("");
    if (step < 7) setStep(step + 1);
    else {
      submitCheckIn(pid, { values, motion, symptoms });
      go("today");
    }
  }
  function field(i) {
    return (
      <div className="checkin-field" key={i.id}>
        <label>
          <span>
            {i.label} <small className="muted">({i.unit})</small>
          </span>
          <input
            type="number"
            step="any"
            value={values[i.id]}
            readOnly={i.id === "radiation"}
            onChange={(e) => {
              setValues({ ...values, [i.id]: e.target.value });
              setError("");
            }}
          />
        </label>
        <details>
          <summary>How and why</summary>
          <p>{i.how}</p>
          <p className="muted">{i.why}</p>
          <p className="small muted">
            Screening range: {rangeText(i, personalBaseline(i, history))}
          </p>
        </details>
      </div>
    );
  }
  const symptomId = step === 2 ? "headache" : "vision";
  const unanswered =
    (step === 2 || step === 3) && answers[symptomId] === undefined;
  return (
    <div className="checkin-screen">
      {privateMode && (
        <p role="status" className="small muted">
          Private Sandbox: drafts and results stay separate from your public
          daily check-in.
        </p>
      )}
      <div className="row spread checkin-top">
        <Back onClick={() => go("today")}>Today</Back>
        <span className="eyebrow">
          Daily check-in · Day {state.mission.day}
        </span>
        <span className="muted small">
          <Icon name="clock" size={16} /> About 3 minutes
        </span>
      </div>
      {existing && !existing.auto && (
        <p className="alert info">
          You have already checked in today. Saving updates today's entry.
        </p>
      )}
      <Segments value={step + 1} max={8} count={8} label="Check-in progress" />
      <p className="muted">
        Question {step + 1} of 8 · Your answers stay here as you move between
        steps.
      </p>
      <Panel
        title={"Question " + (step + 1) + " of 8"}
        className="question-window"
      >
        <h1>{QUESTIONS[step]}</h1>
        {step === 2 && (
          <p className="muted">
            Cabin CO₂ is {habitatToday(state).co2} mmHg today.
          </p>
        )}
        {step === 3 && (
          <p className="muted">
            Think about blurriness, distortion, or a change from your usual
            vision.
          </p>
        )}
        {(step === 2 || step === 3) && (
          <div className="answer-options">
            {[
              [false, step === 2 ? "No headache" : "No change"],
              [
                true,
                step === 2 ? "I have a headache" : "My vision has changed",
              ],
            ].map(([yes, label]) => (
              <button
                key={label}
                className={
                  "answer-option " +
                  (answers[symptomId] === yes ? "selected" : "")
                }
                aria-pressed={answers[symptomId] === yes}
                onClick={() => answer(symptomId, yes)}
              >
                {label}
                <Icon name={yes ? "info" : "check"} />
              </button>
            ))}
          </div>
        )}
        {step === 4 && (
          <label className="motion-question">
            <strong>
              {motion}
              <small> / 10</small>
            </strong>
            <input
              aria-label="Motion sickness"
              type="range"
              min="0"
              max="10"
              step="1"
              value={motion}
              onChange={(e) => setMotion(Number(e.target.value))}
            />
            <span className="row spread muted">
              <span>None</span>
              <span>Severe</span>
            </span>
          </label>
        )}
        {step === 6 && (
          <div className="symptom-options">
            {SYMPTOMS.filter((s) => !["headache", "vision"].includes(s.id)).map(
              (s) => (
                <label
                  key={s.id}
                  className={
                    "symptom-option " +
                    (symptoms.includes(s.id) ? "selected" : "")
                  }
                >
                  <input
                    type="checkbox"
                    checked={symptoms.includes(s.id)}
                    onChange={() => toggleSym(s.id)}
                  />
                  {s.label}
                </label>
              ),
            )}
          </div>
        )}
        <div
          className={"checkin-fields " + (step === 7 ? "review-fields" : "")}
        >
          {indicators
            .filter(
              (i) =>
                GROUPS[step].includes(i.id) ||
                (step === 7 && !GROUPS.flat().includes(i.id)),
            )
            .map(field)}
        </div>
        {step === 7 && (
          <p className="muted small">
            Your sleep, mood, water and symptom answers from earlier steps will
            also be saved. Radiation is read from your simulated dosimeter.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="row spread question-actions">
          <button
            className="btn"
            onClick={() =>
              step ? (setStep(step - 1), setError("")) : go("today")
            }
          >
            <Icon name="back" />
            Back
          </button>
          <button className="btn primary" disabled={unanswered} onClick={next}>
            {step === 7 ? "Save check-in" : "Next"}
            <Icon name={step === 7 ? "check" : "arrow"} />
          </button>
        </div>
      </Panel>
      <Panel title="From your sensors">
        <div className="sensor-grid">
          {[
            ["heartRate", "Resting HR", "bpm", "heart"],
            ["sleep", "Sleep", "h", "moon"],
            ["exercise", "Exercise", "min", "exercise"],
            ["mass", "Body mass", "kg", "body"],
          ].map(([id, label, unit, icon]) => (
            <button
              className="sensor-tile"
              key={id}
              onClick={() => setStep(id === "sleep" ? 0 : 7)}
            >
              <span className="eyebrow">
                <Icon name={icon} size={16} />
                {label}
              </span>
              <strong>
                {values[id] ?? "—"} <small>{unit}</small>
              </strong>
              <span className="small muted">
                Review reading <Icon name="arrow" size={13} />
              </span>
            </button>
          ))}
        </div>
        <p className="small muted">
          Pre-filled from the simulated mission data. Select a reading to review
          it.
        </p>
      </Panel>
    </div>
  );
}
