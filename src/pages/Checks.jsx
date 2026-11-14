import React, { useState } from "react";
import { useStore, dueChecks, testsOf, evaluateTest, CHECKS } from "../backend/api.js";
import { COLORS } from "../lib.js";
import HeartRateCamera from "../components/checks/HeartRateCamera.jsx";
import AmslerGrid from "../components/checks/AmslerGrid.jsx";
import AcuityTest from "../components/checks/AcuityTest.jsx";
import ReactionTest from "../components/checks/ReactionTest.jsx";
import BalanceTest from "../components/checks/BalanceTest.jsx";

const RUNNERS = { hr: HeartRateCamera, amsler: AmslerGrid, acuity: AcuityTest, pvt: ReactionTest, balance: BalanceTest };

// Medical checks hub: what's due, run a check, see past results
export default function Checks({ person, go, params }) {
  const state = useStore();
  const pid = person.id;
  const [open, setOpen] = useState(params.check || null);
  const due = dueChecks(state, pid);
  const check = CHECKS.find((c) => c.id === open);
  const Runner = RUNNERS[open];

  if (check && Runner) {
    const past = testsOf(state, pid, check.id).slice(0, 8);
    return (
      <div>
        <button className="btn small" onClick={() => setOpen(null)}>← All checks</button>
        <h2>{check.title}</h2>
        <p className="muted small">{check.why}</p>
        <div className="card"><Runner person={person} /></div>
        <h3>Your recent results</h3>
        {past.length === 0 && <p className="muted">None yet.</p>}
        <ul className="results">
          {past.map((t) => {
            const ev = evaluateTest(state, pid, t);
            return (
              <li key={t.id}><span className="dot" style={{ background: COLORS[ev.status] }} />Day {t.day}: {ev.summary}</li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h2>Medical checks</h2>
      <p className="muted">Quick self-checks using the camera, screen and motion sensors. They're scheduled like NASA's in-flight "standard measures": the app reminds you when each is due.</p>
      <div className="grid2">
        {due.map(({ check: c, last, daysSince, applicable, due: isDue }) => (
          <div key={c.id} className="card">
            <div className="row spread">
              <h3>{c.title}</h3>
              <span className={"pill " + (isDue ? "pill-due" : "")}>
                {!applicable ? "Not in microgravity" : isDue ? "Due" : `Next in ${c.every - daysSince} d`}
              </span>
            </div>
            <p className="small">{c.what}</p>
            <p className="small muted">Every {c.every} days · last: {last ? `day ${last.day}` : "never"}</p>
            {c.photo ? (
              <button className="btn" onClick={() => go("photos", { category: "face" })}>Open photo log</button>
            ) : (
              <button className={"btn" + (isDue ? " primary" : "")} onClick={() => setOpen(c.id)}>Start</button>
            )}
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Photo log</h3>
        <p className="small">Photograph rashes, cold sores, swelling or anything you want the CMO or flight surgeon to see, and compare over time.</p>
        <button className="btn" onClick={() => go("photos")}>Open photo log</button>
      </div>
    </div>
  );
}
