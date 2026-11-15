import React, { useState } from "react";
import { bodyParts } from "../lib.js";
import HealthTrend from "../components/HealthTrend.jsx";
import {
  useStore,
  dueChecks,
  testsOf,
  evaluateTest,
  CHECKS,
} from "../backend/api.js";
import HeartRateCamera from "../components/checks/HeartRateCamera.jsx";
import AmslerGrid from "../components/checks/AmslerGrid.jsx";
import AcuityTest from "../components/checks/AcuityTest.jsx";
import ReactionTest from "../components/checks/ReactionTest.jsx";
import BalanceTest from "../components/checks/BalanceTest.jsx";
import HearingTest from "../components/checks/HearingTest.jsx";
import StandTest from "../components/checks/StandTest.jsx";
import WorkloadCheck from "../components/checks/WorkloadCheck.jsx";
import UrineCheck from "../components/checks/UrineCheck.jsx";
import ARCameraGuides from "../components/ARCameraGuides.jsx";
import {
  Back,
  PageTitle,
  Panel,
  Icon,
  Status,
} from "../components/ConsoleUI.jsx";
const RUNNERS = {
  hr: HeartRateCamera,
  amsler: AmslerGrid,
  acuity: AcuityTest,
  pvt: ReactionTest,
  balance: BalanceTest,
  hearing: HearingTest,
  stand: StandTest,
  tlx: WorkloadCheck,
  urine: UrineCheck,
};
const TITLES = {
  hr: "Heart rate with the camera",
  amsler: "Amsler grid",
  acuity: "Near vision chart",
  pvt: "Reaction self-test",
  balance: "Balance test",
  hearing: "Hearing check",
  stand: "Stand test (landing readiness)",
  tlx: "Workload rating (NASA-TLX)",
  urine: "Hydration colour check",
};
const DURATION = {
  hr: "20 seconds",
  pvt: "3 minutes",
  balance: "30 seconds",
  hearing: "About 3 minutes",
  stand: "About 6 minutes",
  tlx: "1 minute",
  urine: "10 seconds",
};
const ICON = {
  eyes: "eyes",
  heart: "heart",
  brain: "brain",
  kidneys: "water",
  vestibular: "medical",
};
export default function Checks({ person, go, params = {} }) {
  const state = useStore(),
    pid = person.id,
    [open, setOpen] = useState(params.check || null);
  const due = dueChecks(state, pid),
    check = CHECKS.find((c) => c.id === open),
    Runner = RUNNERS[open];
  if (check && Runner) {
    const past = testsOf(state, pid, check.id).slice(0, 8);
    return (
      <div>
        <Back
          onClick={() =>
            params.returnTo ? go(params.returnTo) : setOpen(null)
          }
        >
          {params.returnTo ? "Back to body health" : "All medical checks"}
        </Back>
        <PageTitle
          eyebrow={"Medical check · " + bodyParts[check.part].name}
          title={TITLES[open]}
        >
          <span className="telemetry-chip">
            <Icon name="clock" />
            {DURATION[open] || "About 2 minutes"}
          </span>
        </PageTitle>
        <div className="check-layout">
          <Panel
            title={open === "amsler" ? "How to" : "Why we check"}
            className="check-instructions"
          >
            {open === "amsler" ? (
              <ol className="instruction-steps">
                <li>
                  Hold the screen at reading distance, about 30 to 35 cm. Wear
                  your reading glasses if you use them.
                </li>
                <li>Cover the opposite eye to the one being tested.</li>
                <li>Look only at the white dot in the middle.</li>
                <li>
                  Mark any square where lines look wavy, blurry, bent or
                  missing. Click a square, or hold the button and drag across
                  several. Start a drag on a marked square to erase.
                </li>
              </ol>
            ) : (
              <>
                <p>{check.what}</p>
                <div className="section-divider" />
                <p className="muted">{check.why}</p>
              </>
            )}
            {open === "hr" && (
              <p className="alert info small">
                Less accurate than a medical monitor. Use it for trends and spot
                checks.
              </p>
            )}
            {open === "amsler" && (
              <p className="muted small">
                On a touch screen, drag with your finger. With a keyboard, use
                the arrow keys to move and Space to mark a square.
              </p>
            )}
          </Panel>
          <Panel
            title="Measurement"
            className={"measurement-panel measurement-" + open}
          >
            <Runner person={person} />
          </Panel>
          <Panel title="Your results" className="check-results">
            {open === "hr" && (
              <>
                <p className="eyebrow">Recent resting heart rate</p>
                <HealthTrend
                  compact
                  pid={pid}
                  indicatorId="heartRate"
                  days={7}
                />
                <p className="small muted">Last seven mission days · bpm</p>
              </>
            )}
            {past.length ? (
              past.map((t) => {
                const ev = evaluateTest(state, pid, t);
                return (
                  <div className="check-result" key={t.id}>
                    <Status status={ev.status} />
                    <p>
                      <b>Day {t.day}</b> · {ev.summary}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Icon name="medical" size={28} />
                <p>No saved results yet.</p>
                <span>Completed checks appear here.</span>
              </div>
            )}
            <button
              className="text-button"
              onClick={() => go("body", { part: check.part })}
            >
              See on your body map <Icon name="arrow" size={16} />
            </button>
            {open === "amsler" && (
              <>
                <div className="section-divider" />
                <p className="eyebrow">Why we check</p>
                <p className="muted small">{check.why}</p>
              </>
            )}
          </Panel>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageTitle
        eyebrow="Personal health"
        title="Medical checks"
        description="Small checks to notice changes early. Choose a test to begin."
      />
      <ARCameraGuides
        person={person}
        initialGuide={
          {
            "ar-ocular": "onsd",
            "ar-bladder": "bladder",
            "ar-pupil": "iris",
            "ar-rppg": "pulse",
          }[open]
        }
        onPulse={() => setOpen("hr")}
      />
      <div className="checks-directory">
        {due.map(({ check: c, last, daysSince, applicable, due: isDue }) => (
          <Panel
            key={c.id}
            title={bodyParts[c.part].name}
            tone={isDue ? "yellow" : "neutral"}
          >
            <div className="row spread">
              <Icon name={ICON[c.part] || "medical"} size={28} />
              <Status status={isDue ? "yellow" : "info"}>
                {!applicable
                  ? "Needs gravity"
                  : isDue
                    ? "Due"
                    : `Next in ${c.every - daysSince} day${c.every - daysSince === 1 ? "" : "s"}`}
              </Status>
            </div>
            <h2>{c.title}</h2>
            <p className="muted">{c.what}</p>
            <p className="small muted">
              Every {c.every} days ·{" "}
              {last ? "Last checked on day " + last.day : "Not checked yet"}
            </p>
            <button
              className="btn"
              onClick={() =>
                c.photo ? go("photos", { category: "face" }) : setOpen(c.id)
              }
            >
              {c.photo ? "Open photo log" : "Open check"}
              <Icon name="arrow" size={16} />
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
