import React, { useState } from "react";
import { PageTitle } from "../components/ConsoleUI.jsx";
import {
  useStore,
  takeMed,
  restockMed,
  daysOfSupply,
  medName,
  envOf,
} from "../backend/api.js";
import PharmacyStability from "../components/PharmacyStability.jsx";

// Shared crew medical kit: inventory, doses taken, low-stock warnings
export default function MedKit({ person }) {
  const state = useStore();
  const pid = person.id;
  const [msg, setMsg] = useState("");
  const env = envOf(state);
  const myLog = state.medLog[pid].slice(0, 10);

  return (
    <div>
      <PageTitle
        eyebrow="Help · Shared supplies"
        title="The crew's medical kit"
        description="Track the supplies on board and the doses in your record."
      />
      <p className="muted">
        {env.microgravity && env.delayMin > 1
          ? "No resupply is possible in deep space: every dose counts. Low items are flagged to the CMO."
          : "Resupply is possible here, but plan ahead. Low items are flagged to the CMO."}
      </p>
      <div className="table-scroll">
        <table className="table inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Use</th>
              <th>Stock</th>
              <th>Days left*</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.medkit.map((m) => {
              const low = m.stock <= m.min;
              const days = daysOfSupply(state, m.id);
              return (
                <tr key={m.id} className={low ? "low" : ""}>
                  <td>{m.name}</td>
                  <td className="small">{m.purpose}</td>
                  <td>
                    {m.stock}
                    {low ? " ⚠ low" : ""}
                  </td>
                  <td>{days == null ? "–" : days}</td>
                  <td>
                    <button
                      className="btn small"
                      disabled={m.stock <= 0}
                      onClick={() => {
                        takeMed(pid, m.id);
                        setMsg(`Logged 1 dose of ${m.name}.`);
                      }}
                    >
                      Log 1 dose
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        *Estimated from the whole crew's use over the last 14 days.
      </p>
      {msg && <p className="muted">{msg}</p>}

      <h3>Your recent doses</h3>
      {myLog.length === 0 && <p className="muted">None.</p>}
      <ul className="small">
        {myLog.map((l) => (
          <li key={l.id}>
            Day {l.day}: {medName(l.med)}
          </li>
        ))}
      </ul>

      <h3>Resupply (demo)</h3>
      <p className="small muted">
        Simulates a cargo delivery (possible on the ISS or a Moon base).
      </p>
      <button
        className="btn"
        onClick={() => {
          state.medkit
            .filter((m) => m.stock <= m.min)
            .forEach((m) => restockMed(m.id, m.min * 3));
          setMsg("Low items restocked.");
        }}
      >
        Restock low items
      </button>
      <p className="muted small">
        Prototype list for demonstration, not a prescription. Only take
        medicines as directed by your flight surgeon.
      </p>
      <PharmacyStability person={person} />
    </div>
  );
}
