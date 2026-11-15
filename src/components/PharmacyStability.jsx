import React, { useState } from "react";
import { useStore } from "../backend/store.js";
import {
  saveClinicalRecord,
  latestClinicalRecord,
} from "../backend/clinicalStore.js";
import { sandboxEnabled } from "../backend/sandbox.js";
import {
  PHARMACY_DRUGS,
  PHARMACY_ENVIRONMENTS,
  DEFAULT_PHARMACY_SCENARIO,
  pharmacyPotency,
} from "../backend/pharmacyModel.js";
import { Panel } from "./ConsoleUI.jsx";

export default function PharmacyStability({ person }) {
  const state = useStore();
  const [form, setForm] = useState(
    () =>
      latestClinicalRecord(state, person.id, "pharmacy-stability")?.payload
        ?.inputs || {
        ...DEFAULT_PHARMACY_SCENARIO,
        environment: state.mission.environment,
      },
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  let result = null;
  try {
    result = pharmacyPotency(form);
  } catch {
    /* Incomplete numeric fields display the validation message on save. */
  }
  const setField = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setMessage("");
    if (sandboxEnabled(state))
      saveClinicalRecord(
        person.id,
        "pharmacy-stability",
        { inputs: next },
        { draft: true },
      );
  };
  return (
    <div className="pharmacy-stability panel-stack">
      <Panel
        title="Space radiation drug-decay & potency calculator"
        id="pharmacy-stability"
      >
        <h2>Plan storage, compare assumptions</h2>
        <p className="alert info">
          Illustrative stress-test only. Radiation does not have an established
          universal acceleration factor for these medicines. This model cannot
          assess a real lot or justify a dose change.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const output = pharmacyPotency(form);
              const record = saveClinicalRecord(
                person.id,
                "pharmacy-stability",
                { inputs: form, result: output },
              );
              setMessage(
                record.private
                  ? "Scenario saved in Private Sandbox."
                  : "Pharmacy scenario saved on this device.",
              );
              setError("");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <div className="specialty-fields">
            <label>
              Medicine
              <select
                value={form.drug}
                onChange={(e) => setField("drug", e.target.value)}
              >
                {PHARMACY_DRUGS.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Storage environment
              <select
                value={form.environment}
                onChange={(e) => setField("environment", e.target.value)}
              >
                {Object.entries(PHARMACY_ENVIRONMENTS).map(([id, e]) => (
                  <option key={id} value={id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lot identifier
              <input
                value={form.lot}
                maxLength={100}
                onChange={(e) => setField("lot", e.target.value)}
              />
            </label>
            <label>
              Packaging
              <select
                value={form.packaging}
                onChange={(e) => setField("packaging", e.target.value)}
              >
                <option value="sealed">Manufacturer sealed</option>
                <option value="repacked">Repacked scenario</option>
              </select>
            </label>
            {[
              ["days", "Storage duration (days)", 0, 2000, 1],
              ["temperature", "Storage temperature (°C)", 0, 45, 0.1],
              [
                "initialPotency",
                "Starting assay / scenario potency (%)",
                0,
                120,
                0.1,
              ],
              ["baseLoss", "Assumed storage loss (% per day)", 0, 1, 0.001],
              [
                "absorbedDoseGy",
                "Pharmacy absorbed dose scenario (Gy)",
                0,
                20,
                0.01,
              ],
              [
                "radiationLoss",
                "Assumed extra loss coefficient (% per Gy)",
                0,
                50,
                0.1,
              ],
            ].map(([id, label, min, max, step]) => (
              <label key={id}>
                {label}
                <input
                  type="number"
                  required
                  min={min}
                  max={max}
                  step={step}
                  value={form[id]}
                  onChange={(e) => setField(id, e.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => setField("radiationLoss", 0)}
            >
              No assumed radiation effect
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setField("radiationLoss", 10)}
            >
              Explore faster degradation (hypothetical)
            </button>
          </div>
          {result && (
            <div className="pharmacy-results">
              <div>
                <strong>{result.potency.toFixed(1)}%</strong>
                <span>Illustrative potency at day {form.days}</span>
                <small>
                  {result.baseline.toFixed(1)}% without assumed radiation effect
                </small>
              </div>
              <svg
                viewBox="0 0 500 180"
                role="img"
                aria-label="Illustrative drug potency curve compared with storage-only scenario"
              >
                <path d="M35 10V150H480" className="plot-axis" />
                <polyline
                  points={result.curve
                    .map(
                      (p, i) =>
                        `${35 + i * 37},${150 - (p.baseline / 120) * 130}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="5 5"
                  opacity=".5"
                />
                <polyline
                  points={result.curve
                    .map(
                      (p, i) =>
                        `${35 + i * 37},${150 - (p.potency / 120) * 130}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <text x="35" y="172">
                  Day 0
                </text>
                <text x="400" y="172">
                  Day {form.days}
                </text>
              </svg>
            </div>
          )}
          <p className="small muted">
            Solid: selected assumptions · dashed: storage alone. Gy describes
            energy absorbed by the medicine; the crew’s mSv reading is not a
            medication assay and is not converted here.
          </p>
          <label>
            Pharmacist / medical officer review notes
            <textarea
              rows="3"
              maxLength={3000}
              value={form.pharmacistNote}
              onChange={(e) => setField("pharmacistNote", e.target.value)}
            />
          </label>
          <button className="btn primary">Save pharmacy scenario</button>
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </form>
        <details>
          <summary>Model and evidence</summary>
          <p>
            Potency = starting assay × exp(−storage rate × days × temperature
            factor × packaging factor − radiation coefficient × Gy × environment
            factor). Every coefficient is a scenario assumption, not a validated
            drug-specific constant. Temperature uses an illustrative doubling
            per 10 °C; repacking uses 1.4×; environment stress multipliers are
            ISS 1, Moon 1.3, Mars 1.5 and transit 1.8.
          </p>
          <p>
            A 2025 NASA-supported experiment found comparable degradation
            between irradiated and control samples of four solid oral drugs,
            including amoxicillin and promethazine. It does not establish the
            same result for every formulation or mission.
          </p>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12085706/"
            target="_blank"
            rel="noreferrer"
          >
            Read the drug stability study
          </a>
        </details>
      </Panel>
      <Panel
        title="Microgravity pharmacokinetic dosing notes"
        id="medication-dosing-notes"
      >
        <p>{PHARMACY_DRUGS.find((d) => d.id === form.drug)?.note}</p>
        <ul>
          <li>
            Absorption may depend on nausea, gastric transit, route and
            formulation.
          </li>
          <li>
            Fluid redistribution and hydration can affect distribution. Record
            symptoms and response for the medical officer.
          </li>
          <li>
            Review renal and hepatic function, allergies, interactions and
            mission duties before treatment.
          </li>
          <li>
            Use the approved mission formulary and expiration/lot guidance. This
            prototype supplies no automatic dose multiplier, replacement dose or
            medication clearance.
          </li>
        </ul>
        <a
          href="https://www.nasa.gov/reference/medical-operations-and-clinical-care/"
          target="_blank"
          rel="noreferrer"
        >
          NASA medical operations and clinical care
        </a>
      </Panel>
    </div>
  );
}
