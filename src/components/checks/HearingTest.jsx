import React, { useEffect, useRef, useState } from "react";
import { saveTest, HEARING_FREQS, HEARING_LEVELS } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";

// Descending-level tone screen: each tone gets quieter in 10 dB steps until you stop hearing it.
// The quietest level you heard is your threshold for that ear and pitch. Levels are relative to the
// loudest tone (dBFS), so only compare results made with the same headphones and volume.
const TONE_MS = 1000;

function playTone(ctx, freq, dbfs, pan) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  osc.frequency.value = freq;
  const peak = 10 ** (dbfs / 20);
  const t = ctx.currentTime;
  // 50 ms ramps avoid clicks that could be heard as a "tone"
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.05);
  gain.gain.setValueAtTime(peak, t + TONE_MS / 1000 - 0.05);
  gain.gain.linearRampToValueAtTime(0, t + TONE_MS / 1000);
  panner.pan.value = pan;
  osc.connect(gain).connect(panner).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + TONE_MS / 1000 + 0.02);
}

export default function HearingTest({ person, onSaved }) {
  const [phase, setPhase] = useState("intro"); // intro | testing | done
  const [step, setStep] = useState({ ear: 0, f: 0, level: 0 });
  const [result, setResult] = useState({ left: {}, right: {} });
  const [saved, setSaved] = useState(null);
  const ctx = useRef(null);
  const ears = ["left", "right"];

  useEffect(() => () => ctx.current?.close?.(), []);

  const supported = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

  function play(s = step) {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    playTone(ctx.current, HEARING_FREQS[s.f], HEARING_LEVELS[s.level], s.ear === 0 ? -1 : 1);
  }

  function record(threshold) {
    const ear = ears[step.ear];
    const next = { ...result, [ear]: { ...result[ear], [HEARING_FREQS[step.f]]: threshold } };
    setResult(next);
    let s = { ear: step.ear, f: step.f + 1, level: 0 };
    if (s.f >= HEARING_FREQS.length) s = { ear: step.ear + 1, f: 0, level: 0 };
    if (s.ear >= 2) {
      setPhase("done");
      setSaved(saveTest(person.id, "hearing", { ...next, device: "Headphones" }));
      onSaved?.();
      return;
    }
    setStep(s);
    setTimeout(() => play(s), 400);
  }

  function heard() {
    const lvl = step.level;
    if (lvl + 1 >= HEARING_LEVELS.length) return record(HEARING_LEVELS[lvl]);
    const s = { ...step, level: lvl + 1 };
    setStep(s);
    setTimeout(() => play(s), 300);
  }

  function notHeard() {
    // quietest level heard so far; if not even the loudest tone, record 0 dB (louder than the test can play)
    record(step.level === 0 ? 0 : HEARING_LEVELS[step.level - 1]);
  }

  if (!supported) return <p className="alert info">This device can't play test tones.</p>;

  if (phase === "done" && saved) {
    return (
      <div className="measurement-complete" role="status">
        <Icon name="check" size={40} />
        <h2>Hearing check saved</h2>
        <Status status={saved.status} />
        <p>{saved.summary}</p>
        <table className="compact-table">
          <thead><tr><th>Ear</th>{HEARING_FREQS.map((f) => <th key={f}>{f / 1000} kHz</th>)}</tr></thead>
          <tbody>
            {ears.map((e) => (
              <tr key={e}><td>{e}</td>{HEARING_FREQS.map((f) => <td key={f}>{result[e][f]} dB</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Lower numbers = quieter tones heard = better. Levels are relative to the loudest tone.</p>
        <button className="btn" onClick={() => { setPhase("intro"); setSaved(null); setResult({ left: {}, right: {} }); setStep({ ear: 0, f: 0, level: 0 }); }}>Test again</button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div>
        <ol className="instruction-steps">
          <li>Put on headphones (not speakers) and set the device volume to your usual marked level.</li>
          <li>Find the quietest place you can. Fans and pumps can hide quiet tones.</li>
          <li>Each tone gets quieter. Tap <b>I heard it</b> each time, and <b>I didn't hear it</b> when it's gone.</li>
        </ol>
        <p className="muted small">About 3 minutes. 5 pitches in each ear.</p>
        <button className="btn primary" onClick={() => { setPhase("testing"); setTimeout(() => play(), 300); }}>
          Start hearing check <Icon name="arrow" size={18} />
        </button>
      </div>
    );
  }

  const total = HEARING_FREQS.length * 2;
  const done = step.ear * HEARING_FREQS.length + step.f;
  return (
    <div className="hearing-run">
      <p className="eyebrow">Tone {done + 1} of {total} · {ears[step.ear]} ear · {HEARING_FREQS[step.f] / 1000} kHz</p>
      <h2>Did you hear the tone?</h2>
      <p className="muted">Level {HEARING_LEVELS[step.level]} dB</p>
      <div className="row">
        <button className="btn primary big-btn" onClick={heard}>I heard it</button>
        <button className="btn big-btn" onClick={notHeard}>I didn't hear it</button>
        <button className="text-button" onClick={() => play()}>Play again</button>
      </div>
    </div>
  );
}
