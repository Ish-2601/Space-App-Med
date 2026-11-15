import React, { useState } from "react";
import {
  SavedForm,
  Tool,
  Field,
  History,
  Source,
  Checklist,
  useClinicalForm,
  useTick,
} from "./ClinicalShared.jsx";
import {
  onsdChange,
  acousticExposure,
  landingPlan,
  breathingPhase,
  numberIn,
  rounded,
  dayScopedClinicalItems,
  emptyAcousticDay,
} from "../../backend/clinicalModels.js";

export function EyesTools({ pid, go }) {
  return (
    <SavedForm
      pid={pid}
      module="sans-onsd"
      title="SANS hub · ONSD ultrasound & hyperopic shift"
      defaults={{
        baseline: 4.5,
        left: 4.5,
        right: 4.5,
        shift: 0,
        flattening: "Not assessed",
        folds: "Not assessed",
        eye: "Both",
        operator: "",
      }}
      source="sans"
      note="Enter measurements from trained-operator ultrasound and refraction. ONSD alone cannot diagnose SANS or intracranial pressure. Baseline 4.5 mm is a demonstration value; replace it with your recorded baseline."
      fields={[
        {
          name: "baseline",
          label: "Personal baseline ONSD (mm)",
          min: 1,
          max: 10,
          step: 0.01,
        },
        {
          name: "left",
          label: "Left optic nerve sheath diameter (mm)",
          min: 1,
          max: 10,
          step: 0.01,
        },
        {
          name: "right",
          label: "Right optic nerve sheath diameter (mm)",
          min: 1,
          max: 10,
          step: 0.01,
        },
        {
          name: "shift",
          label: "Hyperopic shift (diopters)",
          options: [0, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5].map(
            (v) => ({
              value: v,
              label: v === 0 ? "No shift" : `+${v.toFixed(2)} D`,
            }),
          ),
        },
        {
          name: "flattening",
          label: "Globe flattening",
          options: ["Not assessed", "Not seen", "Reported by operator"],
        },
        {
          name: "folds",
          label: "Choroidal folds",
          options: ["Not assessed", "Not seen", "Reported by operator"],
        },
        {
          name: "operator",
          label: "Ultrasound operator / reference",
          type: "text",
          maxLength: 120,
        },
      ]}
      compute={(v) => {
        const d = onsdChange(v);
        return {
          ...d,
          summary: `ONSD Δ L ${d.left >= 0 ? "+" : ""}${d.left} mm / R ${d.right >= 0 ? "+" : ""}${d.right} mm; +${d.shift.toFixed(2)} D`,
        };
      }}
      render={(r) => (
        <div className="clinical-result">
          <h3>Change from your baseline</h3>
          <p>
            Left {r.left >= 0 ? "+" : ""}
            {r.left} mm · Right {r.right >= 0 ? "+" : ""}
            {r.right} mm · Refraction +{r.shift.toFixed(2)} D
          </p>
          <p>
            New vision change, globe flattening or folds warrant review by the
            medical officer. Sudden vision loss needs the emergency workflow.
          </p>
        </div>
      )}
    >
      {() => (
        <>
          <details>
            <summary>Vision countermeasures to review with the CMO</summary>
            <p>
              Discuss adjustable fluid-lens glasses, including the historical
              Superfocus design or available mission-approved alternatives. A
              refraction is needed before selecting correction.
            </p>
            <p>
              Methylfolate / folate, B12 and B6 supplements belong in a
              clinician-reviewed plan. NASA is studying B-vitamin
              countermeasures; this app does not prescribe a formulation or
              dose.
            </p>
            <Source id="vitamins" />
          </details>
          <div className="row">
            <button
              className="btn"
              type="button"
              onClick={() => go("checks", { check: "amsler" })}
            >
              Open Amsler grid
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => go("checks", { check: "ar-ocular" })}
            >
              Open AR ocular guide
            </button>
          </div>
        </>
      )}
    </SavedForm>
  );
}
export function VestibularTools({ pid }) {
  const exposure = useClinicalForm(pid, "acoustic", {
    segments: emptyAcousticDay(),
    logDay: null,
  });
  const segments = dayScopedClinicalItems(
    exposure.values,
    exposure.state.mission.day,
    "segments",
    emptyAcousticDay(),
  );
  let result, error;
  try {
    result = acousticExposure(segments);
  } catch (e) {
    error = e.message;
  }
  function updateSegment(index, key, value) {
    exposure.change(
      "segments",
      segments.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
    exposure.change("logDay", exposure.state.mission.day);
  }
  return (
    <>
      <SavedForm
        pid={pid}
        module="vestibular"
        title="Vestibular adaptation & space motion sickness log"
        source="body"
        note="Observe symptoms during normal activity; do not deliberately provoke severe motion sickness. Stop the activity and seek assistance if faint, unsteady or vomiting persistently."
        defaults={{
          trigger: "Head movement",
          minutes: 5,
          nausea: 0,
          dizziness: 0,
          vomiting: "No",
          adaptation: "New exposure",
        }}
        fields={[
          {
            name: "trigger",
            label: "Activity / provocation observed",
            options: [
              "Head movement",
              "Visual motion",
              "EVA transition",
              "Landing",
              "Exercise",
              "No obvious trigger",
            ],
          },
          {
            name: "minutes",
            label: "Exposure duration (minutes)",
            min: 0,
            max: 240,
          },
          { name: "nausea", label: "Nausea · 0–10", min: 0, max: 10, step: 1 },
          {
            name: "dizziness",
            label: "Dizziness · 0–10",
            min: 0,
            max: 10,
            step: 1,
          },
          {
            name: "vomiting",
            label: "Vomiting",
            options: ["No", "Once", "Repeated"],
          },
          {
            name: "adaptation",
            label: "Adaptation compared with previous exposure",
            options: ["New exposure", "Improving", "Unchanged", "Worsening"],
          },
        ]}
        compute={(v) => ({
          summary: `${v.trigger}: nausea ${numberIn(v.nausea, 0, 10)}/10; dizziness ${numberIn(v.dizziness, 0, 10)}/10 · ${v.adaptation}`,
        })}
        render={(r) => <p className="clinical-result">{r.summary}</p>}
      />
      <Tool
        title="24-hour cabin acoustic dosimetry tracker"
        source="noise"
        note="Manual/dosimeter log; this browser does not measure calibrated dBA. The >60 dBA fan flag is this prototype's continuous-noise review threshold, not an occupational hearing-damage limit."
      >
        <p className="small muted">
          Day {exposure.state.mission.day} · log up to three periods totaling 24
          hours. Each new mission day starts with zero logged hours. Enter
          calibrated dosimeter readings; the initial 55 dBA values are editable
          examples until you record their duration.
        </p>
        <div className="acoustic-rows">
          {segments.map((s, index) => (
            <div className="clinical-fields" key={index}>
              <Field
                label={`Period ${index + 1} hours`}
                value={s.hours}
                min="0"
                max="24"
                onChange={(_, value) => updateSegment(index, "hours", value)}
              />
              <Field
                label={`Period ${index + 1} continuous fan noise (dBA)`}
                value={s.dba}
                min="20"
                max="140"
                onChange={(_, value) => updateSegment(index, "dba", value)}
              />
            </div>
          ))}
        </div>
        {result && (
          <div className="clinical-result">
            <h3>{result.leq} dBA energy-weighted average</h3>
            <p>
              {result.hours} / 24 hours covered{" "}
              {result.hours < 24 && "· incomplete day"}
            </p>
            {result.fanFlag ? (
              <p className="clinical-attention">
                Fan noise above 60 dBA: request an acoustic review, check
                maintenance status and use approved hearing protection where
                instructed. Keep ventilation operating.
              </p>
            ) : (
              <p>
                No logged period exceeds the prototype fan-noise review
                threshold.
              </p>
            )}
          </div>
        )}
        <button
          className="btn"
          disabled={!!error}
          onClick={() =>
            exposure.save({
              segments,
              logDay: exposure.state.mission.day,
              summary: `${result.leq} dBA over ${result.hours} hours`,
            })
          }
        >
          Save acoustic log
        </button>
        {(error || exposure.message) && (
          <p role="status">{error || exposure.message}</p>
        )}
        <details>
          <summary>How the average is calculated</summary>
          <p>
            Leq = 10 × log₁₀(Σ(hours × 10^(dBA/10)) / Σhours). Unlogged hours
            are not assumed silent.
          </p>
        </details>
        <History pid={pid} module="acoustic" />
      </Tool>
    </>
  );
}
export function BreathingPacer({ pid }) {
  const f = useClinicalForm(pid, "resonance-breathing", {
    startedAt: null,
    duration: 120000,
    taps: [],
    elapsed: 0,
  });
  const now = useTick(!!f.values.startedAt, 100),
    elapsed = f.values.startedAt
      ? Math.max(0, now - f.values.startedAt)
      : f.values.elapsed;
  const remaining = Math.max(0, Math.ceil((120000 - elapsed) / 1000)),
    phase = breathingPhase(elapsed);
  const taps = f.values.taps || [],
    errors = taps.map((t) => Math.min(t % 10000, 10000 - (t % 10000)));
  const coherence =
    taps.length >= 2
      ? Math.round(
          Math.max(
            0,
            100 - errors.reduce((a, b) => a + b, 0) / errors.length / 50,
          ),
        )
      : null;
  function stop() {
    f.save({
      startedAt: null,
      elapsed: Math.min(elapsed, 120000),
      summary: `${Math.round(Math.min(elapsed, 120000) / 1000)} s paced breathing; simulated coherence ${coherence ?? "not sampled"}`,
    });
  }
  return (
    <Tool
      title="HRV resonance box-breathing visual pacer"
      note="6 cycles/minute: 2.5 s inhale, pause, exhale, pause. Use comfortable breaths; skip pauses if uncomfortable and stop if dizzy. The coherence score measures tap-to-pacer timing, not measured cardiac HRV."
    >
      <div className="breathing-pacer">
        <svg viewBox="0 0 220 220" role="img" aria-label={phase.label}>
          <circle className="pacer-guide" cx="110" cy="110" r="90" />
          <circle
            className="pacer-orb"
            cx="110"
            cy="110"
            r={70 * phase.scale}
          />
          <text x="110" y="110" textAnchor="middle" dominantBaseline="central">
            {remaining}s
          </text>
        </svg>
        <div>
          <h3>
            {!f.values.startedAt
              ? "Ready to begin"
              : remaining === 0
                ? "Session complete"
                : phase.label}
          </h3>
          <p>
            Live coherence:{" "}
            <strong>
              {coherence == null ? "Tap twice to sample" : `${coherence}/100`}
            </strong>
          </p>
          <p className="small muted">
            Simulated coherence · tap as each inhale begins
          </p>
        </div>
      </div>
      <div className="row">
        {!f.values.startedAt ? (
          <button
            className="btn primary"
            onClick={() =>
              f.save({
                startedAt: Date.now(),
                elapsed: 0,
                taps: [],
                summary: "2-minute paced session started",
              })
            }
          >
            Start breathing pacer
          </button>
        ) : (
          <>
            <button
              className="btn"
              disabled={remaining === 0}
              onClick={() => f.change("taps", [...taps, elapsed].slice(-20))}
            >
              Mark inhale
            </button>
            <button className="btn" onClick={stop}>
              {remaining === 0 ? "Save completed session" : "Stop and save"}
            </button>
          </>
        )}
      </div>
      {f.message && <p role="status">{f.message}</p>}
      <History pid={pid} module="resonance-breathing" />
    </Tool>
  );
}
export function HeartTools({ pid, row }) {
  return (
    <>
      <BreathingPacer pid={pid} />
      <SavedForm
        pid={pid}
        module="landing-fluid"
        title="Pre-landing orthostatic intolerance & Chibis LBNP planner"
        source="cardio"
        note="Calculator executes a CMO-entered plan, not a dosing recommendation. Chibis negative pressure, salt/fluid loading, compression garments and contraindications require trained supervision. Never initiate or change LBNP settings using this app."
        defaults={{
          mass: row.mass || 75,
          prescribedMlKg: "",
          consumedMl: 0,
          sodiumG: "",
          lbnpMinutes: "",
          authorized: "No plan entered",
        }}
        fields={[
          { name: "mass", label: "Body mass (kg)", min: 30, max: 200 },
          {
            name: "prescribedMlKg",
            label: "CMO-prescribed fluid target (mL/kg)",
            min: 0,
            max: 30,
          },
          {
            name: "consumedMl",
            label: "Already consumed in this plan (mL)",
            min: 0,
            max: 6000,
          },
          {
            name: "sodiumG",
            label: "CMO-prescribed sodium total (g)",
            min: 0,
            max: 15,
          },
          {
            name: "lbnpMinutes",
            label: "CMO-prescribed Chibis duration (minutes)",
            min: 0,
            max: 120,
          },
          {
            name: "authorized",
            label: "Plan authorization",
            options: [
              "No plan entered",
              "CMO plan entered for review",
              "CMO-supervised session",
            ],
          },
        ]}
        compute={(v) => {
          if (v.authorized === "No plan entered")
            throw new Error(
              "Enter a CMO plan and select its review status before calculating.",
            );
          const result = landingPlan(v);
          return {
            ...result,
            summary: `Fluid plan ${result.targetMl} mL · ${result.remainingMl} mL remaining; LBNP ${result.lbnpMinutes} min`,
          };
        }}
        render={(r) => (
          <div className="clinical-result">
            <h3>{r.targetMl} mL entered-plan target</h3>
            <p>
              {r.remainingMl} mL remaining · {r.sodiumG} g sodium in entered
              plan · {r.lbnpMinutes} min LBNP
            </p>
            <p>
              Target = mass × prescribed mL/kg. Remaining = max(0, target −
              recorded consumption).
            </p>
          </div>
        )}
      >
        {() => <Source id="chibis" />}
      </SavedForm>
    </>
  );
}

export function RespiratoryTools({ pid }) {
  return (
    <SavedForm
      pid={pid}
      module="regolith-feno"
      title="Regolith dust & FeNO airway inflammation tracker"
      source="dust"
      note="FeNO requires a calibrated exhaled-nitric-oxide device; the camera cannot measure it. Values depend on clinical context and are not a diagnosis of dust injury. Follow mission-approved dust-control procedures."
      defaults={{
        setting: "Moon",
        duration: 0,
        feno: 20,
        baseline: 20,
        cough: "None",
        hepa: false,
        suitlock: false,
        filter: false,
      }}
      fields={[
        {
          name: "setting",
          label: "Exposure environment",
          options: ["Moon", "Mars", "Cabin / dust simulant"],
        },
        {
          name: "duration",
          label: "Suspected dust exposure (minutes)",
          min: 0,
          max: 1440,
        },
        { name: "feno", label: "FeNO reading (ppb)", min: 1, max: 300 },
        {
          name: "baseline",
          label: "Personal FeNO baseline (ppb)",
          min: 1,
          max: 300,
        },
        {
          name: "cough",
          label: "Breathing symptoms",
          options: [
            "None",
            "Cough / irritation",
            "Wheeze",
            "Shortness of breath",
          ],
        },
      ]}
      compute={(v) => {
        const delta = rounded(
          numberIn(v.feno, 1, 300) - numberIn(v.baseline, 1, 300),
        );
        return {
          delta,
          summary: `FeNO ${v.feno} ppb (Δ ${delta}); ${v.setting}, ${v.duration} min exposure`,
        };
      }}
      render={(r, v) => (
        <div className="clinical-result">
          <h3>
            FeNO change: {r.delta >= 0 ? "+" : ""}
            {r.delta} ppb
          </h3>
          <p>
            Record a repeat with the same device and technique. New breathing
            difficulty needs prompt crew medical assessment, regardless of FeNO.
          </p>
        </div>
      )}
    >
      {(f) => (
        <>
          <h3>HEPA vacuum & Suitlock dust protocol log</h3>
          <Checklist
            values={f.values}
            change={f.change}
            items={[
              [
                "suitlock",
                "Suitlock dirty/clean boundary maintained; contaminated suit isolated",
              ],
              [
                "hepa",
                "Approved HEPA vacuum dust removal completed; no compressed-air dispersal",
              ],
              [
                "filter",
                "Cabin filter/ventilation status checked and exposure reported for review",
              ],
            ]}
          />
        </>
      )}
    </SavedForm>
  );
}
