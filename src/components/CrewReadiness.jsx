import React, { useEffect, useState } from "react";
import { useStore } from "../backend/store.js";
import {
  evaReadiness,
  workloadFor,
  generateAndSaveEvaProof,
  verifyEvaProof,
} from "../backend/crewReadiness.js";
import { TLX_SCALES } from "../backend/assess.js";
import { Panel, Status, Icon } from "./ConsoleUI.jsx";

export function EvaBadge({ person }) {
  const state = useStore(),
    proof = state.evaProofs?.[person.id];
  const readiness = evaReadiness(state, person.id);
  const [verified, setVerified] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  // Public references can mutate in place, so the snapshot includes only the
  // fields the proof verifier depends on; private records never participate.
  const signature = JSON.stringify([
    state.mission,
    state.history[person.id],
    state.checkins[person.id],
    state.tests[person.id],
    state.bodyDiagnostics?.[person.id],
    state.symptomLog[person.id],
    state.emergencies,
    state.events,
    proof,
  ]);
  useEffect(() => {
    let current = true;
    setVerified(false);
    if (proof)
      verifyEvaProof(state, person.id, proof).then((valid) => {
        if (current) setVerified(valid);
      });
    return () => {
      current = false;
    };
  }, [signature, person.id]);
  async function generate() {
    setBusy(true);
    setMessage("");
    try {
      await generateAndSaveEvaProof(person.id);
      setMessage(
        "A fresh local proof was generated and verified. No sandbox records were read or shared.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="eva-badge">
      <Status status={verified ? "green" : "info"}>
        {verified
          ? "ZKP verified: Fit-for-EVA (demo)"
          : readiness.eligible
            ? "Fit-for-EVA demo proof available"
            : "Fit-for-EVA: review needed"}
      </Status>
      <button
        className="text-button"
        disabled={busy || !readiness.eligible}
        onClick={generate}
      >
        <Icon name="shield" size={15} />
        {busy
          ? "Verifying…"
          : verified
            ? "Refresh proof"
            : "Generate readiness proof"}
      </button>
      {proof && !verified && (
        <span className="small muted">
          No current verified proof. Changed readings require a fresh proof.
        </span>
      )}
      <details>
        <summary>What this proves</summary>
        <p>
          Six Pedersen commitments represent the six public readiness checks. A
          Schnorr opening proof verifies that each committed check is true,
          bound to this crew member's public snapshot and mission day. Random
          openings are discarded; the persisted proof contains no private logs.
        </p>
        <p>
          This local demo proves the committed bits, not the accuracy or
          clinical validity of the underlying readings. It does not authenticate
          an issuer or authorize an EVA. The medical officer must independently
          clear the crew member.
        </p>
        <p>
          Demo screening requires a completed daily check-in, sleep ≥6 h, SpO₂
          ≥95%, public health score ≥80, today's Raw TLX ≤65, and no active
          emergency or storm. These are prototype criteria, not NASA EVA
          clearance rules.
        </p>
        <p>
          {Object.values(readiness.checks).filter(Boolean).length} of 6 public
          checks currently met.
        </p>
        <a
          href="https://www.rfc-editor.org/rfc/rfc8235.html"
          target="_blank"
          rel="noreferrer"
        >
          Schnorr proof protocol · RFC 8235
        </a>
      </details>
      {message && (
        <p role="status" className="small">
          {message}
        </p>
      )}
    </div>
  );
}

export function CrewWorkloadHeatmap({ onOpenPerson }) {
  const state = useStore();
  const rows = state.crew.map((person) => ({
    person,
    ...workloadFor(state, person.id),
  }));
  const known = rows.filter((row) => row.fatigue != null);
  const high = known.filter((row) => row.fatigue >= 60);
  const lower = known.slice().sort((a, b) => a.fatigue - b.fatigue)[0];
  const heat = (value) =>
    value == null
      ? "unknown"
      : value >= 70
        ? "high"
        : value >= 40
          ? "medium"
          : "low";
  return (
    <Panel title="Crew workload & fatigue balance" className="crew-workload">
      <p className="muted">
        Today's public NASA-TLX responses and sleep readings. Private Sandbox
        entries are excluded.
      </p>
      <div className="workload-table-wrap">
        <table className="workload-table">
          <thead>
            <tr>
              <th>Crew member</th>
              {TLX_SCALES.map((scale) => (
                <th key={scale.id}>{scale.label}</th>
              ))}
              <th>Raw TLX</th>
              <th>Sleep debt</th>
              <th>Fatigue index</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.person.id}>
                <th>
                  <button
                    className="text-button"
                    onClick={() => onOpenPerson?.(row.person.id)}
                    disabled={!onOpenPerson}
                  >
                    {row.person.name}
                  </button>
                </th>
                {TLX_SCALES.map((scale) => (
                  <td
                    key={scale.id}
                    className={"heat-" + heat(row.dimensions?.[scale.id])}
                  >
                    {row.dimensions?.[scale.id] ?? "—"}
                  </td>
                ))}
                <td className={"heat-" + heat(row.tlx)}>
                  {row.tlx == null ? "Not recorded" : row.tlx + " / 100"}
                </td>
                <td
                  className={
                    "heat-" +
                    heat(row.sleepDebt == null ? null : row.sleepDebt * 20)
                  }
                >
                  {row.sleepDebt == null ? "Unknown" : row.sleepDebt + " h"}
                </td>
                <td className={"heat-" + heat(row.fatigue)}>
                  {row.fatigue == null
                    ? "Awaiting data"
                    : row.fatigue + " / 100"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small workload-insight">
        {!known.length
          ? "Complete today's workload check to compare the crew. Missing responses are not treated as low workload."
          : high.length && lower && lower.fatigue < 40
            ? `${high.map((r) => r.person.name).join(", ")} may benefit from a lighter task schedule. Discuss redistributing suitable tasks with ${lower.person.name} and the commander.`
            : "Review the workload spread with the crew before assigning demanding tasks. This display does not assign or remove duties automatically."}
      </p>
      <details>
        <summary>How the heatmap is calculated</summary>
        <p>
          Raw TLX is the unweighted mean of six 0–100 ratings. Sleep debt here
          is max(0, 8 − last night's sleep hours), a planning reference. Demo
          fatigue = 60% Raw TLX + 40% min(100, sleep debt × 20). It is not a
          validated fatigue diagnosis. Cells use low (under 40), moderate
          (40–69), or high (70+) shading and always display the value.
        </p>
        <a
          href="https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/"
          target="_blank"
          rel="noreferrer"
        >
          NASA Task Load Index background
        </a>
      </details>
    </Panel>
  );
}
