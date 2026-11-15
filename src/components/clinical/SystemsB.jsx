import React, { useState } from "react";
import {
  SavedForm,
  Tool,
  Field,
  Gauge,
  History,
  Source,
  useClinicalForm,
  useTick,
} from "./ClinicalShared.jsx";
import {
  viralIndex,
  renalIndex,
  fatigueMap,
  organDose,
  SPACE_FOODS,
  foodTotals,
  numberIn,
  dayScopedClinicalItems,
} from "../../backend/clinicalModels.js";
import useCamera from "../useCamera.js";
import { sandboxEnabled } from "../../backend/sandbox.js";

const HOTSPOTS = [
  ["left-nail", "Left nailbed", 83, 50],
  ["right-nail", "Right nailbed", 188, 50],
  ["left-foot", "Left foot-loop callus", 345, 154],
  ["right-foot", "Right foot-loop callus", 450, 154],
];
export function SkinHotspots({ pid, go }) {
  const f = useClinicalForm(pid, "skin-hotspots", {
    selected: "left-nail",
    spots: {},
    photoId: "",
  });
  const current = f.values.spots[f.values.selected] || {
    severity: "None",
    note: "",
  };
  const selected =
    HOTSPOTS.find((h) => h[0] === f.values.selected) || HOTSPOTS[0];
  const photos = sandboxEnabled(f.state)
    ? (f.state.privateSandboxRecords || [])
        .filter((r) => r.pid === pid && r.kind === "photo")
        .map((r) => ({
          ...r.payload,
          id: r.payload.photoId || r.payload.id || r.id,
          day: r.day,
        }))
    : f.state.photos[pid] || [];
  function updateSpot(key, value) {
    f.change("spots", {
      ...f.values.spots,
      [f.values.selected]: { ...current, [key]: value },
    });
  }
  return (
    <Tool
      title="Photo tracking · nailbed & foot-loop hotspot map"
      note="Record location, discomfort and a linked photo for comparison. The map does not identify infection, nail delamination or tissue injury from an image."
    >
      <svg
        className="clinical-hotspot-map"
        viewBox="0 0 540 220"
        role="group"
        aria-label="2D nailbed and foot-loop callus map"
      >
        <g className="map-outline">
          <path d="M50 175V87Q45 55 58 55L70 80V35Q84 20 90 37V75L95 25Q108 12 114 30V75L120 35Q136 21 139 45V87L148 58Q163 50 165 70V135Q155 177 130 185Z" />
          <path
            d="M200 175V87Q195 55 208 55L220 80V35Q234 20 240 37V75L245 25Q258 12 264 30V75L270 35Q286 21 289 45V87L298 58Q313 50 315 70V135Q305 177 280 185Z"
            transform="translate(-45,0)"
          />
          <path d="M335 190Q309 162 325 126L328 73Q337 48 355 63L373 102Q388 143 373 182Z" />
          <path d="M440 190Q414 162 430 126L433 73Q442 48 460 63L478 102Q493 143 478 182Z" />
        </g>
        {HOTSPOTS.map(([id, label, x, y]) => (
          <g
            key={id}
            role="button"
            tabIndex="0"
            aria-label={label}
            aria-pressed={f.values.selected === id}
            onClick={() => f.change("selected", id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                f.change("selected", id);
              }
            }}
            className={
              f.values.selected === id ? "hotspot selected" : "hotspot"
            }
          >
            <circle cx={x} cy={y} r="17" />
            <text x={x} y={y + 5} textAnchor="middle">
              {f.values.spots[id]?.severity &&
              f.values.spots[id]?.severity !== "None"
                ? "!"
                : "+"}
            </text>
          </g>
        ))}
      </svg>
      <div className="clinical-fields">
        <Field
          label="Hotspot location"
          name="selected"
          value={f.values.selected}
          options={HOTSPOTS.map(([value, label]) => ({ value, label }))}
          onChange={f.change}
        />
        <Field
          label={`${selected[1]} condition`}
          value={current.severity}
          options={[
            "None",
            "Tender",
            "Callus / thickened skin",
            "Nail lifting / delamination",
            "Open skin / bleeding",
          ]}
          onChange={(_, value) => updateSpot("severity", value)}
        />
        <Field
          label="Photo to link"
          name="photoId"
          value={f.values.photoId}
          options={[
            { value: "", label: "No photo attached" },
            ...photos.map((p) => ({
              value: p.id,
              label: `Day ${p.day} · ${p.category || "photo"}`,
            })),
          ]}
          onChange={f.change}
        />
      </div>
      <Field
        type="textarea"
        label="Location notes"
        value={current.note}
        onChange={(_, value) => updateSpot("note", value)}
      />
      <div className="row">
        <button
          className="btn"
          onClick={() =>
            f.save({
              summary: `${selected[1]} · ${current.severity}${f.values.photoId ? " · photo linked" : ""}`,
            })
          }
        >
          Save hotspot map
        </button>
        <button
          className="btn"
          onClick={() => {
            f.save({ summary: "Hotspot draft saved before photo capture" });
            go("photos", { category: "skin" });
          }}
        >
          Take / compare skin photos
        </button>
      </div>
      <p className="small muted">
        Persistent pain, spreading redness, discharge or open skin should be
        reviewed by the medical officer.
      </p>
      {f.message && <p role="status">{f.message}</p>}
      <History pid={pid} module="skin-hotspots" />
    </Tool>
  );
}
export function ImmuneTools({ pid, row, go }) {
  return (
    <>
      <SavedForm
        pid={pid}
        module="viral-risk"
        title="Latent viral reactivation risk index"
        source="immune"
        defaults={{
          stress: 3,
          sleep: row.sleep || 7,
          cortisolRatio: 100,
          radiation: 12.9,
        }}
        fields={[
          { name: "stress", label: "Perceived stress · 0–10", min: 0, max: 10 },
          { name: "sleep", label: "Sleep last night (hours)", min: 0, max: 16 },
          {
            name: "cortisolRatio",
            label: "Measured cortisol (% of personal same-time baseline)",
            min: 0,
            max: 500,
          },
          {
            name: "radiation",
            label: "Dose over past 7 days (mSv)",
            min: 0,
            max: 1000,
          },
        ]}
        compute={(v) => {
          const r = viralIndex(v);
          return { ...r, summary: `Illustrative viral index ${r.score}/100` };
        }}
        render={(r) => (
          <Gauge score={r.score} label="Latent viral reactivation index" />
        )}
        note="Not a validated infection prediction. Cortisol and 7-day dose begin as editable demo values. Index = stress×3 + capped sleep debt×6 + capped cortisol elevation×0.2 + capped weekly dose×2; caps are 30, 30, 20 and 20 points. Positive symptoms or concerns require clinical assessment, not this score."
      />
      <SkinHotspots pid={pid} go={go} />
    </>
  );
}

export function FoodAnalyzer({ pid }) {
  const f = useClinicalForm(pid, "space-food", {
    code: "NM-101",
    servings: 1,
    meals: [],
    ironCeiling: 20,
    condiment: "None",
    dullTaste: false,
    logDay: null,
  });
  const cam = useCamera(),
    [scanMessage, setScanMessage] = useState("");
  const meals = dayScopedClinicalItems(f.values, f.state.mission.day, "meals");
  let totals, error;
  try {
    totals = foodTotals(meals, f.values.ironCeiling);
  } catch (e) {
    error = e.message;
  }
  async function scan() {
    if (!("BarcodeDetector" in window)) {
      setScanMessage(
        "Camera barcode decoding is unavailable here. Enter a code, use a keyboard RFID reader, or choose a demo pouch below.",
      );
      return;
    }
    if (!cam.active) {
      await cam.start("environment");
      return;
    }
    try {
      const detector = new window.BarcodeDetector();
      const found = await detector.detect(cam.videoRef.current);
      if (!found.length)
        return setScanMessage(
          "No code found. Hold a supported code steady and try again.",
        );
      f.change("code", found[0].rawValue.trim().toUpperCase());
      setScanMessage(
        "Code captured. Confirm the item and servings before logging.",
      );
      cam.stop();
    } catch {
      setScanMessage(
        "This camera or barcode format cannot be decoded. Enter the printed code below.",
      );
    }
  }
  function addMeal() {
    try {
      const code = f.values.code.trim().toUpperCase(),
        servings = numberIn(f.values.servings, 0.25, 10, "Servings");
      const next = [...meals, { code, servings, ts: Date.now() }];
      const result = foodTotals(next, f.values.ironCeiling);
      f.save({
        meals: next,
        logDay: f.state.mission.day,
        summary: `${next.length} food entries · iron ${result.iron} mg`,
      });
    } catch (e) {
      f.setMessage(e.message);
    }
  }
  return (
    <Tool
      title="Space food RFID / barcode & micronutrient analyzer"
      source="food"
      note="Demo food catalog with illustrative nutrient values. Camera barcode decoding is used where available; hardware RFID readers can enter their code as keyboard input. This browser does not directly read RFID tags."
    >
      <video
        ref={cam.videoRef}
        autoPlay
        muted
        playsInline
        className="clinical-video"
        aria-label="Food barcode camera"
        hidden={!cam.active}
      />
      <div className="row">
        <button className="btn" onClick={scan}>
          {cam.active ? "Capture food barcode" : "Scan food barcode"}
        </button>
        {cam.active && (
          <button className="btn" onClick={cam.stop}>
            Stop camera
          </button>
        )}
      </div>
      {(scanMessage || cam.error) && (
        <p role="status">{scanMessage || cam.error}</p>
      )}
      <div className="clinical-fields">
        <Field
          label="Food / RFID code"
          name="code"
          type="text"
          value={f.values.code}
          onChange={f.change}
          maxLength={100}
        />
        <Field
          label="Servings"
          name="servings"
          value={f.values.servings}
          onChange={f.change}
          min=".25"
          max="10"
          step=".25"
        />
        <Field
          label="Personal iron review ceiling (mg/day)"
          name="ironCeiling"
          value={f.values.ironCeiling}
          onChange={f.change}
          min="1"
          max="100"
        />
      </div>
      <div className="clinical-choice-grid">
        {SPACE_FOODS.map((food) => (
          <button
            className="btn"
            key={food.code}
            onClick={() => f.change("code", food.code)}
            aria-pressed={f.values.code === food.code}
          >
            {food.name}
            <small>{food.code}</small>
          </button>
        ))}
      </div>
      <button className="btn primary" onClick={addMeal}>
        Log confirmed food
      </button>
      {totals && (
        <>
          <div className="clinical-nutrients">
            {[
              ["Lutein", "lutein", "mg"],
              ["Zeaxanthin", "zeaxanthin", "mg"],
              ["Omega-3", "omega3", "g"],
              ["Iron", "iron", "mg"],
              ["Sodium", "sodium", "mg"],
            ].map(([label, key, unit]) => (
              <div key={key}>
                <small>{label}</small>
                <strong>
                  {totals[key]} {unit}
                </strong>
              </div>
            ))}
          </div>
          {totals.ironFlag && (
            <p role="status" className="clinical-attention">
              Iron exceeds your entered review ceiling. Discuss iron retention
              and supplement use with the CMO; this is not an overload
              diagnosis.
            </p>
          )}
        </>
      )}
      <p className="small muted">
        The initial 20 mg/day review ceiling is a demo setting, not a
        prescription or an iron toxicity threshold. Use your mission nutrition
        plan.
      </p>
      <Source id="iron" />
      <label className="clinical-check">
        <input
          type="checkbox"
          checked={f.values.dullTaste}
          onChange={(e) => f.change("dullTaste", e.target.checked)}
        />
        Food tastes dull during fluid shifts
      </label>
      {f.values.dullTaste && (
        <>
          <p>
            For variety, consider an approved Sriracha, Wasabi or Horseradish
            portion if tolerated. Check sodium and allergies; spices do not
            treat fluid shifts.
          </p>
          <Field
            label="Flavor option"
            name="condiment"
            value={f.values.condiment}
            onChange={f.change}
            options={["None", "Sriracha", "Wasabi", "Horseradish"]}
          />
          <button
            className="btn"
            onClick={() =>
              f.save({
                meals,
                logDay: f.state.mission.day,
                summary: `Flavor preference: ${f.values.condiment}`,
              })
            }
          >
            Save flavor preference
          </button>
        </>
      )}
      {meals.length > 0 && (
        <details>
          <summary>Today's food entries ({meals.length})</summary>
          <ul>
            {meals.map((m, i) => (
              <li key={`${m.ts}-${i}`}>
                {SPACE_FOODS.find((food) => food.code === m.code)?.name} ·{" "}
                {m.servings} servings
              </li>
            ))}
          </ul>
        </details>
      )}
      {(error || f.message) && <p role="status">{error || f.message}</p>}
      <History pid={pid} module="space-food" />
    </Tool>
  );
}

export function KidneyTools({ pid, row, go }) {
  return (
    <SavedForm
      pid={pid}
      module="renal-risk"
      title="Renal stone risk index (RSRI)"
      source="kidney"
      defaults={{
        water: row.water || 2,
        specificGravity: 1.015,
        color: 3,
        sodium: 2300,
        boneLoss: 1,
      }}
      fields={[
        { name: "water", label: "Water intake today (L)", min: 0, max: 10 },
        {
          name: "specificGravity",
          label: "Measured urine specific gravity",
          min: 1,
          max: 1.05,
          step: 0.001,
        },
        {
          name: "color",
          label: "Urine color scale · 1 pale, 8 dark",
          min: 1,
          max: 8,
          step: 1,
        },
        {
          name: "sodium",
          label: "Dietary sodium (mg/day)",
          min: 0,
          max: 15000,
        },
        {
          name: "boneLoss",
          label: "Estimated bone mineral loss (%/month)",
          min: 0,
          max: 10,
          step: 0.1,
        },
      ]}
      compute={(v) => {
        const r = renalIndex(v);
        return { ...r, summary: `Illustrative RSRI ${r.score}/100` };
      }}
      render={(r) => <Gauge score={r.score} label="Live RSRI scenario" />}
      note="Updates as inputs change. Not a validated renal-stone predictor; urine chemistry and clinical imaging are needed. Demo defaults are not measured results. Index sums capped contributions: water deficit (40), specific gravity (20), color (10), sodium above 1,500 mg (15) and bone loss (15)."
    >
      {() => (
        <>
          <details>
            <summary>Prevention and treatment options for CMO review</summary>
            <p>
              Review hydration and nutrition against your assigned plan.
              Potassium citrate may be considered by the medical team based on
              urine chemistry, renal function and medication interactions; no
              dose is recommended here.
            </p>
            <p>
              Focused ultrasound stone propulsion is a specialized treatment
              capability under study for spaceflight. It requires diagnosis,
              trained operators and suitable hardware; do not attempt it using a
              camera guide.
            </p>
            <p>
              Flank pain with fever, inability to pass urine, persistent
              vomiting or severe pain needs urgent medical review.
            </p>
          </details>
          <div className="row">
            <button
              className="btn"
              type="button"
              onClick={() => go("checks", { check: "urine" })}
            >
              Open urine color check
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => go("checks", { check: "ar-bladder" })}
            >
              Open AR bladder guide
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => go("emergency")}
            >
              Open emergency catalog
            </button>
          </div>
        </>
      )}
    </SavedForm>
  );
}

export function SpinalStretch({ pid }) {
  const f = useClinicalForm(pid, "spinal-stretch", {
    startedAt: null,
    duration: 30000,
    completed: false,
  });
  const now = useTick(!!f.values.startedAt),
    seconds = Math.max(
      0,
      Math.ceil(
        (f.values.duration -
          (f.values.startedAt ? now - f.values.startedAt : 0)) /
          1000,
      ),
    );
  return (
    <Tool
      title="Microgravity fetal-tuck spinal stretch timer"
      source="body"
      note="Comfort timer, not a spine treatment protocol. Use only a movement cleared by your flight physical therapist. Stop with pain, tingling, weakness or dizziness; never force the tuck."
    >
      <div className="stretch-demo">
        <svg
          viewBox="0 0 220 160"
          role="img"
          aria-label="Gentle supported fetal-tuck illustration"
        >
          <circle cx="95" cy="35" r="17" />
          <path
            d="M86 53Q40 90 87 132M89 70Q155 52 163 92Q160 115 115 112L90 130M91 75 130 98 158 84"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <h3>{seconds} seconds</h3>
          <p>
            Secure your position. Move gently into a comfortable tuck and
            breathe normally.
          </p>
        </div>
      </div>
      <div className="row">
        <button
          className="btn primary"
          onClick={() =>
            f.save({
              startedAt: Date.now(),
              completed: false,
              summary: "30-second comfortable stretch started",
            })
          }
        >
          Start stretch timer
        </button>
        {f.values.startedAt && (
          <button
            className="btn"
            onClick={() =>
              f.save({
                startedAt: null,
                completed: seconds === 0,
                summary:
                  seconds === 0
                    ? "Stretch timer completed"
                    : "Stretch stopped early",
              })
            }
          >
            {seconds === 0 ? "Save completion" : "Stop stretch"}
          </button>
        )}
      </div>
      {f.message && <p role="status">{f.message}</p>}
      <History pid={pid} module="spinal-stretch" />
    </Tool>
  );
}
export function MuscleTools({ pid }) {
  return (
    <>
      <SavedForm
        pid={pid}
        module="muscle-fatigue"
        title="ARED / T2 / CEVIS muscle-fatigue heatmap"
        source="body"
        defaults={{ ared: 30, t2: 30, cevis: 20, exertion: 5 }}
        fields={[
          {
            name: "ared",
            label: "ARED resistance exercise (minutes)",
            min: 0,
            max: 180,
          },
          { name: "t2", label: "T2 treadmill (minutes)", min: 0, max: 180 },
          {
            name: "cevis",
            label: "CEVIS cycle ergometer (minutes)",
            min: 0,
            max: 180,
          },
          {
            name: "exertion",
            label: "Perceived exertion · 0–10",
            min: 0,
            max: 10,
            step: 1,
          },
        ]}
        compute={(v) => {
          const map = fatigueMap(v);
          return {
            map,
            summary: `Load scenario · shoulders ${map.shoulders}, lumbar ${map.lumbar}, quads ${map.quadriceps}, calves ${map.calves}`,
          };
        }}
        render={(r) => (
          <div className="muscle-heatmap">
            <svg
              viewBox="0 0 150 270"
              role="img"
              aria-label="Illustrative muscle load map"
            >
              <circle cx="75" cy="25" r="18" className="map-outline" />
              <path
                d="M48 50H102L115 125 100 132 96 94 93 155 100 250H79L75 176 71 250H50L57 155 54 94 50 132 35 125Z"
                className="map-outline"
              />
              {[
                ["shoulders", 52, 57, 46, 25],
                ["lumbar", 58, 116, 34, 28],
                ["quadriceps", 55, 159, 40, 39],
                ["calves", 54, 207, 42, 33],
              ].map(([key, x, y, w, h]) => (
                <rect
                  key={key}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="8"
                  fill="currentColor"
                  opacity={0.2 + r.map[key] / 125}
                />
              ))}
            </svg>
            <div>
              {Object.entries(r.map).map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <meter
                    min="0"
                    max="100"
                    value={value}
                    aria-label={`${key} load index`}
                  />
                  <b>{value}/100</b>
                </div>
              ))}
            </div>
          </div>
        )}
        note="Illustrative workload distribution, not measured muscle fatigue. Equipment minutes are multiplied by disclosed region weights and exertion/10, capped at 100. Shoulder ARED×0.9; lumbar ARED×0.8+T2×0.3; quads ARED×0.7+T2×0.6+CEVIS×0.8; calves T2×1.1+CEVIS×0.3."
      />
      <SpinalStretch pid={pid} />
    </>
  );
}

function ShelterDiagram({ layout }) {
  return (
    <svg
      className="shelter-layout"
      viewBox="0 0 450 220"
      role="img"
      aria-label={`${layout} conceptual shielding layout`}
    >
      <rect
        x="20"
        y="20"
        width="410"
        height="180"
        rx="40"
        className="map-outline"
      />
      <circle cx="224" cy="68" r="17" className="map-outline" />
      <path
        d="M202 88H246L258 150H240V184H210V150H192Z"
        className="map-outline"
      />
      {layout === "AstroRad vest" ? (
        <path
          d="M199 90 210 83 224 105 238 83 249 90 255 147H193Z"
          className="shield-material"
        />
      ) : (
        [
          [40, 45, 30, 130],
          [380, 45, 30, 130],
          [100, 30, 250, 25],
          [100, 170, 250, 25],
        ].map(([x, y, w, h], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="7"
            className="shield-material"
          />
        ))
      )}
      <text x="225" y="214" textAnchor="middle">
        {layout === "AstroRad vest"
          ? "Targeted torso shielding · concept"
          : "Water / polyethylene around protected volume · concept"}
      </text>
    </svg>
  );
}
export function RadiationTools({ pid, go }) {
  return (
    <SavedForm
      pid={pid}
      module="organ-dose"
      title="Organ-specific dose equivalent calculator"
      source="shielding"
      defaults={{
        lens: 1,
        marrow: 1,
        thyroid: 1,
        cns: 1,
        quality: 1,
        shielding: 0,
        layout: "Polyethylene water-wall shelter",
        acuteRadiation: 0,
      }}
      fields={[
        {
          name: "lens",
          label: "Eye lens absorbed dose (mGy)",
          min: 0,
          max: 10000,
        },
        {
          name: "marrow",
          label: "Bone marrow / BFO absorbed dose (mGy)",
          min: 0,
          max: 10000,
        },
        {
          name: "thyroid",
          label: "Thyroid absorbed dose (mGy)",
          min: 0,
          max: 10000,
        },
        { name: "cns", label: "CNS absorbed dose (mGy)", min: 0, max: 10000 },
        {
          name: "quality",
          label: "Radiation quality factor (entered by dosimetry team)",
          min: 1,
          max: 30,
        },
        {
          name: "shielding",
          label: "Assumed attenuation for scenario comparison (%)",
          min: 0,
          max: 100,
        },
        {
          name: "acuteRadiation",
          label: "Recorded acute-event whole-body dose (mSv)",
          min: 0,
          max: 10000,
        },
        {
          name: "layout",
          label: "Shielding layout",
          options: ["Polyethylene water-wall shelter", "AstroRad vest"],
        },
      ]}
      compute={(v) => {
        const rows = organDose(v);
        numberIn(v.acuteRadiation, 0, 10000);
        return {
          rows,
          summary: `Organ equivalent dose scenario · quality factor ${v.quality}; attenuation ${v.shielding}%`,
        };
      }}
      render={(r, v) => (
        <>
          <div className="clinical-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organ</th>
                  <th>Equivalent dose</th>
                  <th>Scenario after shielding</th>
                </tr>
              </thead>
              <tbody>
                {r.rows.map((row) => (
                  <tr key={row.organ}>
                    <th>{row.organ}</th>
                    <td>{row.before} mSv</td>
                    <td>{row.after} mSv</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ShelterDiagram layout={v.layout} />
          <p>
            Use the mission-approved shelter manifest and radiation team's organ
            dosimetry. These diagrams do not specify real stowage locations.
          </p>
        </>
      )}
      note="H(mSv) = absorbed dose(mGy) × quality factor. Editable 1 mGy inputs are demo values. The comparison applies your assumed attenuation uniformly, not a verified AstroRad performance claim. Whole-body badge dose cannot determine organ dose or effective dose. Acute-event dose is kept separate from career exposure."
    >
      {() => (
        <button className="btn" type="button" onClick={() => go("radiation")}>
          Open storm shelter checklist
        </button>
      )}
    </SavedForm>
  );
}
