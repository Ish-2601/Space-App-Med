import React, { useState } from "react";
import {
  useStore,
  rowFor,
  saveBodyDiagnostic,
  latestBodyDiagnostic,
  symptomsToday,
  SYMPTOMS,
} from "../backend/api.js";
import { indicators } from "../lib.js";
import { HEALTH_AREAS, SLEEP_QUALITY, areaPage } from "../data/healthAreas.js";
import { Back, PageTitle, Panel, Icon } from "../components/ConsoleUI.jsx";
import { sandboxEnabled } from "../backend/sandbox.js";
import usePrivateDraft, {
  privateDraft,
} from "../components/usePrivateDraft.js";

export default function BodyDiagnostic({ person, go, partKey = "brain" }) {
  const state = useStore(),
    area = HEALTH_AREAS[partKey],
    row = rowFor(state, person.id);
  const previous = latestBodyDiagnostic(state, person.id, partKey);
  const privateMode = sandboxEnabled(state);
  const draft = privateDraft(state, person.id, `diagnostic-draft-${partKey}`);
  const fields = indicators.filter((i) => i.bodyPart === partKey);
  const [values, setValues] = useState(
    () =>
      draft?.values ||
      Object.fromEntries(fields.map((i) => [i.id, row[i.id] ?? ""])),
  );
  const [answers, setAnswers] = useState(() => {
    if (draft?.answers) return draft.answers;
    const current = symptomsToday(state, person.id).map((s) => s.id);
    const ci = state.checkins[person.id][state.mission.day];
    const known = (id) =>
      (ci && !ci.auto) ||
      state.bodyDiagnostics?.[person.id]?.some(
        (r) =>
          r.day === state.mission.day && typeof r.answers[id] === "boolean",
      );
    return Object.fromEntries(
      area.symptoms.filter(known).map((id) => [id, current.includes(id)]),
    );
  });
  const [sleepQuality, setSleepQuality] = useState(
    draft?.sleepQuality || previous?.sleepQuality || "",
  );
  const [stress, setStress] = useState(draft?.stress ?? previous?.stress ?? "");
  const [acuteRadiation, setAcuteRadiation] = useState(
    draft?.acuteRadiation ?? "",
  );
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  usePrivateDraft(
    person.id,
    `diagnostic-draft-${partKey}`,
    { values, answers, sleepQuality, stress, acuteRadiation },
    privateMode && !saved,
  );
  return (
    <div className="area-check-screen">
      <Back onClick={() => go(areaPage(partKey))}>{area.title}</Back>
      <PageTitle
        eyebrow={person.name + " · Focused diagnostic"}
        title={area.short + " health check"}
        description="Review readings from your instruments and answer how you feel. This self-check adds to your record without completing your daily check-in."
      />
      {saved ? (
        <Panel>
          <div className="measurement-complete" role="status">
            <Icon name="check" size={42} />
            <h2>Diagnostic check saved</h2>
            <p>
              {saved.private
                ? "Saved in your Private Sandbox. Public health scores and crew records are unchanged."
                : `Your ${area.short.toLowerCase()} information and health summary have been updated.`}
            </p>
            <button
              className="btn primary"
              onClick={() => go(areaPage(partKey))}
            >
              View updated health summary <Icon name="arrow" />
            </button>
          </div>
        </Panel>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const result = saveBodyDiagnostic(person.id, partKey, {
                values,
                answers,
                sleepQuality,
                stress,
                acuteRadiation,
              });
              setSaved(result);
              setError("");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <Panel title="Your readings">
            {privateMode && (
              <p className="small muted">
                Private Sandbox: this check is saved separately from your crew
                record.
              </p>
            )}
            {partKey === "wholeBody" && (
              <label className="acute-dose-field">
                Acute event dose (mSv, optional)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={acuteRadiation}
                  onChange={(e) => setAcuteRadiation(e.target.value)}
                />
                <small className="muted">
                  Dose from this single event, separate from your lifetime
                  cumulative reading.
                </small>
              </label>
            )}
            {fields.length ? (
              <div className="focused-readings">
                {fields.map((i) => (
                  <label key={i.id}>
                    <b>
                      {i.label} <span className="muted">({i.unit})</span>
                    </b>
                    <input
                      type="number"
                      required
                      step="any"
                      min={i.id === "mood" ? 1 : 0}
                      max={
                        i.id === "mood"
                          ? 10
                          : i.id === "sleep"
                            ? 24
                            : i.id === "spo2"
                              ? 100
                              : undefined
                      }
                      value={values[i.id]}
                      onChange={(e) =>
                        setValues({ ...values, [i.id]: e.target.value })
                      }
                    />
                    <small className="muted">{i.how}</small>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted">
                Record your symptoms below, then use the dedicated tests on your
                health screen for measurements.
              </p>
            )}
            {partKey === "brain" && (
              <div className="focused-readings head-check-fields">
                <label>
                  <b>Sleep quality</b>
                  <select
                    required
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                  >
                    <option value="">Choose your sleep quality</option>
                    {SLEEP_QUALITY.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                  <small className="muted">
                    How restorative did last night's sleep feel?
                  </small>
                </label>
                <label>
                  <b>Stress (0–10)</b>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    step="1"
                    value={stress}
                    onChange={(e) => setStress(e.target.value)}
                  />
                  <small className="muted">
                    0 calm · 10 very stressed. Your own rating, not a diagnosis.
                  </small>
                </label>
              </div>
            )}
          </Panel>
          {area.symptoms.length > 0 && (
            <Panel title="Current symptoms">
              <p className="muted">
                Are you experiencing any of these right now?
              </p>
              <div className="focused-symptoms">
                {area.symptoms.map((id) => (
                  <fieldset key={id}>
                    <legend>{SYMPTOMS.find((s) => s.id === id)?.label}</legend>
                    <div className="symptom-answer-options">
                      {[
                        [true, "Yes"],
                        [false, "No"],
                      ].map(([value, label]) => (
                        <label
                          key={label}
                          className={answers[id] === value ? "selected" : ""}
                        >
                          <input
                            required
                            type="radio"
                            name={id}
                            checked={answers[id] === value}
                            onChange={() =>
                              setAnswers({ ...answers, [id]: value })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </Panel>
          )}
          <div className="row spread diagnostic-actions">
            <button
              type="button"
              className="btn"
              onClick={() => go(areaPage(partKey))}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Save diagnostic check <Icon name="check" />
            </button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
