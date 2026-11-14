import React, { useEffect, useMemo, useState } from "react";
import { useStore, saveTest, setCalibration } from "../../backend/api.js";
import { CARD_WIDTH_MM, DEFAULT_PX_PER_MM, DIRECTIONS, LETTERS_PER_LINE, LINES, PASS_CORRECT, optotypePx, smallestDrawableLine, snellen } from "../../backend/vision.js";

const ROTATE = { right: 0, down: 90, left: 180, up: 270 };
const KEYS = { ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left", ArrowUp: "up" };

// Tumbling "E" drawn as SVG (5x5 units, opening points right before rotation)
function LetterE({ size, dir }) {
  return (
    <svg width={size} height={size} viewBox="0 0 5 5" style={{ transform: `rotate(${ROTATE[dir]}deg)` }} aria-label="letter E">
      <rect x="0" y="0" width="1" height="5" fill="#fff" />
      <rect x="0" y="0" width="5" height="1" fill="#fff" />
      <rect x="0" y="2" width="5" height="1" fill="#fff" />
      <rect x="0" y="4" width="5" height="1" fill="#fff" />
    </svg>
  );
}

const randomDir = () => DIRECTIONS[Math.floor(Math.random() * 4)];

export default function AcuityTest({ person, onSaved }) {
  const state = useStore();
  const pxPerMm = state.settings.pxPerMm;
  const [calibrating, setCalibrating] = useState(!pxPerMm);
  const [cardPx, setCardPx] = useState(Math.round((pxPerMm || DEFAULT_PX_PER_MM) * CARD_WIDTH_MM));
  const [eye, setEye] = useState("left");
  const [lineIdx, setLineIdx] = useState(0);
  const [trial, setTrial] = useState({ n: 0, correct: 0, dir: randomDir() });
  const [scores, setScores] = useState({});
  const [started, setStarted] = useState(false);
  const [saved, setSaved] = useState(null);
  const ppm = pxPerMm || DEFAULT_PX_PER_MM;
  const lastLine = useMemo(() => LINES.indexOf(smallestDrawableLine(ppm, window.devicePixelRatio || 1)), [ppm]);

  function answer(dir) {
    const correct = trial.correct + (dir === trial.dir ? 1 : 0);
    const n = trial.n + 1;
    if (n < LETTERS_PER_LINE) {
      setTrial({ n, correct, dir: randomDir() });
      return;
    }
    const passed = correct >= PASS_CORRECT;
    // Line finished: go smaller if passed and possible, otherwise record the last passed line
    if (passed && lineIdx < lastLine) {
      setLineIdx(lineIdx + 1);
      setTrial({ n: 0, correct: 0, dir: randomDir() });
      return;
    }
    const score = passed ? LINES[lineIdx] : lineIdx === 0 ? 1.1 : LINES[lineIdx - 1];
    const next = { ...scores, [eye]: score };
    setScores(next);
    if (eye === "left") {
      setEye("right");
      setLineIdx(0);
      setTrial({ n: 0, correct: 0, dir: randomDir() });
      setStarted(false);
    } else {
      setSaved(saveTest(person.id, "acuity", { left: next.left, right: next.right, limit: LINES[lastLine] }));
      onSaved?.();
    }
  }

  useEffect(() => {
    if (!started || saved) return undefined;
    const onKey = (e) => {
      if (KEYS[e.key]) {
        e.preventDefault();
        answer(KEYS[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (calibrating) {
    return (
      <div>
        <h4>Calibrate your screen (once)</h4>
        <p className="small">Hold a bank card or ID card against the screen. Drag the slider until the box is exactly as wide as the card ({CARD_WIDTH_MM} mm).</p>
        <div className="card-cal" style={{ width: cardPx, height: cardPx * 0.63 }} />
        <input type="range" min="150" max="900" value={cardPx} onChange={(e) => setCardPx(Number(e.target.value))} style={{ width: "100%" }} />
        <div className="row">
          <button className="btn primary" onClick={() => { setCalibration(cardPx / CARD_WIDTH_MM); setCalibrating(false); }}>Save calibration</button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className={"alert " + (saved.status === "green" ? "info" : saved.status)}>
        <b>Near vision saved:</b> {saved.summary}.
        <div className="row"><button className="btn" onClick={() => { setSaved(null); setScores({}); setEye("left"); setLineIdx(0); setStarted(false); }}>Test again</button></div>
      </div>
    );
  }

  const size = optotypePx(LINES[lineIdx], ppm);
  return (
    <div>
      <ol className="small">
        <li>Hold the screen <b>40 cm</b> from your eyes (about a forearm's length), with reading glasses if you use them.</li>
        <li>Cover your <b>{eye === "left" ? "RIGHT" : "LEFT"}</b> eye: testing the <b>{eye}</b> eye.</li>
        <li>Press the arrow (or arrow key) for the way the E's arms point. Guess if unsure.</li>
      </ol>
      {!started ? (
        <div className="row">
          <button className="btn primary" onClick={() => setStarted(true)}>Start {eye} eye</button>
          <button className="btn small" onClick={() => setCalibrating(true)}>Recalibrate screen</button>
          {scores.left != null && <span className="small">Left eye: {snellen(scores.left)}</span>}
        </div>
      ) : (
        <>
          <div className="e-box"><LetterE size={size} dir={trial.dir} /></div>
          <p className="small muted center">Line {snellen(LINES[lineIdx])} · letter {trial.n + 1} of {LETTERS_PER_LINE}</p>
          <div className="arrows">
            <button className="btn" onClick={() => answer("up")} aria-label="up">↑</button>
            <div>
              <button className="btn" onClick={() => answer("left")} aria-label="left">←</button>
              <button className="btn" onClick={() => answer("right")} aria-label="right">→</button>
            </div>
            <button className="btn" onClick={() => answer("down")} aria-label="down">↓</button>
          </div>
        </>
      )}
      <p className="muted small">Screen-based check for change over time, not a clinical eye exam. Smallest line this screen can draw: {snellen(LINES[lastLine])}.</p>
    </div>
  );
}
