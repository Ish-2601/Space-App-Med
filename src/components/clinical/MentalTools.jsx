import React, { useState } from "react";
import {
  Field,
  Tool,
  History,
  Checklist,
  useClinicalForm,
  useTick,
} from "./ClinicalShared.jsx";

const THOUGHT_STEPS = [
  [
    "situation",
    "What happened?",
    "Describe one specific situation, without judging yourself.",
  ],
  [
    "thought",
    "What went through your mind?",
    "Write the thought in your own words. A thought is an interpretation, not necessarily a fact.",
  ],
  [
    "evidenceFor",
    "What supports that thought?",
    "List what you directly observed. Separate facts from guesses.",
  ],
  [
    "evidenceAgainst",
    "What might you be missing?",
    "Consider other explanations and what you would say to a crewmate.",
  ],
  [
    "balanced",
    "Write a more balanced thought",
    "Keep what is true while allowing for uncertainty, context and your strengths.",
  ],
  [
    "nextAction",
    "Choose one small action",
    "Pick something realistic: ask for help, take a break, or clarify a task.",
  ],
];
export function ThoughtWizard({ pid }) {
  const form = useClinicalForm(pid, "cbt", {
    step: 0,
    situation: "",
    thought: "",
    evidenceFor: "",
    evidenceAgainst: "",
    balanced: "",
    nextAction: "",
    distressBefore: 5,
    distressAfter: 5,
    complete: false,
  });
  const step = Math.min(5, Math.max(0, form.values.step)),
    [name, heading, prompt] = THOUGHT_STEPS[step];
  const valid = String(form.values[name] || "").trim().length > 0;
  function move(delta) {
    if (delta > 0 && !valid) return;
    const next = step + delta;
    form.save({
      step: next,
      complete: false,
      summary: `Thought record in progress · step ${next + 1}/6`,
    });
  }
  return (
    <Tool
      title="Autonomous CBT thought-reframing wizard"
      source="cbt"
      note="Offline, guided self-reflection. Your words stay on this device. This exercise supports wellbeing; it does not replace a mental-health clinician."
    >
      <p className="small muted">
        Step {step + 1} of 6 · no Earth connection needed
      </p>
      <progress
        max="6"
        value={form.values.complete ? 6 : step}
        aria-label="Thought record progress"
      />
      <h2>{heading}</h2>
      <p>{prompt}</p>
      <Field
        type="textarea"
        name={name}
        label={heading}
        value={form.values[name]}
        onChange={form.change}
      />
      <div className="clinical-fields">
        <Field
          label="Distress before · 0–10"
          name="distressBefore"
          value={form.values.distressBefore}
          onChange={form.change}
          min="0"
          max="10"
          step="1"
        />
        <Field
          label="Distress now · 0–10"
          name="distressAfter"
          value={form.values.distressAfter}
          onChange={form.change}
          min="0"
          max="10"
          step="1"
        />
      </div>
      <div className="row spread">
        <button className="btn" disabled={step === 0} onClick={() => move(-1)}>
          Back
        </button>
        {step < 5 ? (
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => move(1)}
          >
            Next step
          </button>
        ) : (
          <button
            className="btn primary"
            disabled={
              !THOUGHT_STEPS.every(([key]) => String(form.values[key]).trim())
            }
            onClick={() => {
              const before = Number(form.values.distressBefore),
                after = Number(form.values.distressAfter);
              if (
                ![before, after].every(
                  (n) => Number.isFinite(n) && n >= 0 && n <= 10,
                )
              )
                return form.setMessage(
                  "Distress ratings must be between 0 and 10.",
                );
              form.save({
                complete: true,
                summary: `Reframing completed · distress ${before} → ${after}/10`,
              });
            }}
          >
            Complete thought record
          </button>
        )}
      </div>
      {form.message && <p role="status">{form.message}</p>}
      {form.values.complete && (
        <div className="clinical-result">
          <strong>Your balanced thought</strong>
          <p>{form.values.balanced}</p>
          <strong>Your next action</strong>
          <p>{form.values.nextAction}</p>
        </div>
      )}
      <History pid={pid} module="cbt" />
    </Tool>
  );
}
function NatureScene({ scene, immersive }) {
  return (
    <svg
      className={`nature-scene scene-${scene} ${immersive ? "immersive" : ""}`}
      viewBox="0 0 640 240"
      role="img"
      aria-label={`${scene} relaxation scene preview`}
    >
      <rect width="640" height="240" fill="var(--nature-sky)" />
      <circle cx="510" cy="54" r="25" fill="var(--nature-light)" />
      <path
        d="M0 165 100 90 200 150 310 65 460 155 560 95 640 142V240H0Z"
        fill="var(--nature-far)"
      />
      {scene === "Forest" ? (
        [40, 100, 160, 480, 550, 600].map((x, i) => (
          <g key={x} transform={`translate(${x},${100 + (i % 2) * 30})`}>
            <path
              d="M0-60-30 20H-15L-40 50H40L15 20H30Z"
              fill="var(--nature-near)"
            />
            <path d="M0 45V95" stroke="var(--nature-light)" strokeWidth="6" />
          </g>
        ))
      ) : (
        <path
          d="M0 180Q150 135 300 180T640 180V240H0Z"
          fill="var(--nature-near)"
        />
      )}
      {scene === "Ocean" &&
        [190, 210, 230].map((y) => (
          <path
            key={y}
            d={`M0 ${y}Q80 ${y - 10} 160 ${y}T320 ${y}T480 ${y}T640 ${y}`}
            fill="none"
            stroke="var(--nature-light)"
            opacity=".3"
          />
        ))}
      <path
        d="M220 240Q310 200 310 175"
        fill="none"
        stroke="var(--nature-light)"
        strokeWidth="10"
        opacity=".25"
      />
    </svg>
  );
}
export function SensoryLauncher({ pid }) {
  const f = useClinicalForm(pid, "sensory", {
    scene: "Forest",
    scent: "Pine",
    approved: false,
    fan: false,
    startedAt: null,
    duration: 120000,
    complete: false,
  });
  const now = useTick(!!f.values.startedAt),
    elapsed = f.values.startedAt ? Math.max(0, now - f.values.startedAt) : 0;
  const remaining = Math.max(
    0,
    Math.ceil((f.values.duration - elapsed) / 1000),
  );
  const [immersive, setImmersive] = useState(false);
  return (
    <Tool
      title="Sensory monotony countermeasure launcher"
      source="sensory"
      note="Offline nature preview for a VR-style relaxation session. No headset or scent hardware is controlled. Use only mission-approved scent cartridges, with crewmate consent; stop if nauseated or irritated."
    >
      <div className="clinical-fields">
        <Field
          label="VR nature scene"
          name="scene"
          value={f.values.scene}
          onChange={f.change}
          options={["Forest", "Ocean", "Mountains"]}
        />
        <Field
          label="Olfactory scent cartridge prompt"
          name="scent"
          value={f.values.scent}
          onChange={f.change}
          options={["Pine", "Petrichor", "Coffee", "Citrus", "None"]}
        />
      </div>
      <NatureScene scene={f.values.scene} immersive={immersive} />
      <button className="btn" onClick={() => setImmersive((v) => !v)}>
        {immersive ? "Close immersive view" : "Expand nature preview"}
      </button>
      <p>
        Cartridge prompt:{" "}
        {f.values.scent === "None"
          ? "No scent selected."
          : `Prepare the approved ${f.values.scent} cartridge; do not release unapproved fragrances into cabin air.`}
      </p>
      <Checklist
        values={f.values}
        change={f.change}
        items={[
          ["approved", "Scene and scent setup checked"],
          [
            "fan",
            "CO₂ sleeping-bag fan reminder: verify ventilation is unobstructed; never cover the inlet",
          ],
        ]}
      />
      <div className="row">
        <button
          className="btn primary"
          onClick={() =>
            f.save({
              startedAt: Date.now(),
              complete: false,
              summary: `${f.values.scene} / ${f.values.scent} session started`,
            })
          }
        >
          Start 2-minute session
        </button>
        {f.values.startedAt && (
          <>
            <output className="clinical-clock">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </output>
            <button
              className="btn"
              onClick={() =>
                f.save({
                  startedAt: null,
                  complete: remaining === 0,
                  summary: `${f.values.scene} session ${remaining === 0 ? "completed" : "ended early"}`,
                })
              }
            >
              {remaining === 0 ? "Save completion" : "End session"}
            </button>
          </>
        )}
      </div>
      {f.message && <p role="status">{f.message}</p>}
      <History pid={pid} module="sensory" />
    </Tool>
  );
}
