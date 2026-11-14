import React, { useEffect, useRef, useState } from "react";
import { saveTest } from "../../backend/api.js";
import { scorePvt, randomIsi, PVT_DURATION_SEC } from "../../backend/pvt.js";

// Reaction self-test: a counter appears at random intervals; tap (or press space) as fast as possible
export default function ReactionTest({ person, onSaved }) {
  const [duration, setDuration] = useState(PVT_DURATION_SEC);
  const [phase, setPhase] = useState("idle"); // idle | waiting | stimulus | done
  const [counter, setCounter] = useState(0);
  const [last, setLast] = useState(null);
  const [left, setLeft] = useState(0);
  const [saved, setSaved] = useState(null);
  const responses = useRef([]);
  const timers = useRef({});
  const stimAt = useRef(0);
  const endAt = useRef(0);
  const phaseRef = useRef("idle");
  const durationRef = useRef(duration); // keyboard handler is registered once, so read duration from a ref
  durationRef.current = duration;

  const setP = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  function clearAll() {
    clearTimeout(timers.current.isi);
    cancelAnimationFrame(timers.current.raf);
    clearInterval(timers.current.clock);
  }

  useEffect(() => clearAll, []);

  function scheduleNext() {
    if (performance.now() >= endAt.current) return finish();
    setP("waiting");
    timers.current.isi = setTimeout(() => {
      if (performance.now() >= endAt.current) return finish();
      stimAt.current = performance.now();
      setP("stimulus");
      const tick = () => {
        setCounter(Math.round(performance.now() - stimAt.current));
        timers.current.raf = requestAnimationFrame(tick);
      };
      tick();
      // no response in 30 s counts as a very long lapse
      timers.current.isi = setTimeout(() => respond(), 30000);
    }, randomIsi());
  }

  function start() {
    responses.current = [];
    setSaved(null);
    setLast(null);
    endAt.current = performance.now() + duration * 1000;
    setLeft(duration);
    timers.current.clock = setInterval(() => setLeft(Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000))), 250);
    scheduleNext();
  }

  function respond() {
    const p = phaseRef.current;
    if (p === "waiting") {
      responses.current.push({ falseStart: true });
      setLast("Too early! Wait for the counter.");
      return;
    }
    if (p !== "stimulus") return;
    cancelAnimationFrame(timers.current.raf);
    clearTimeout(timers.current.isi);
    const rt = Math.round(performance.now() - stimAt.current);
    responses.current.push({ rt });
    setLast(`${rt} ms`);
    scheduleNext();
  }

  function finish() {
    clearAll();
    setP("done");
    const res = scorePvt(responses.current);
    if (res.trials === 0) {
      setSaved({ status: "unknown", summary: "No valid responses recorded. Try again." });
      return;
    }
    setSaved(saveTest(person.id, "pvt", { ...res, durationSec: durationRef.current }));
    onSaved?.();
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && (phaseRef.current === "waiting" || phaseRef.current === "stimulus")) {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (phase === "idle" || phase === "done") {
    return (
      <div>
        <p className="small">A counter will appear in the box at random moments. Tap the box (or press Space) as fast as you can when it appears. Don't tap before it shows up.</p>
        <div className="row">
          <label className="radio"><input type="radio" checked={duration === 180} onChange={() => setDuration(180)} /> Full test (3 min)</label>
          <label className="radio"><input type="radio" checked={duration === 60} onChange={() => setDuration(60)} /> Quick practice (1 min)</label>
        </div>
        <button className="btn primary" onClick={start}>Start</button>
        {saved && (
          <div className={"alert " + (saved.status === "green" ? "info" : saved.status === "unknown" ? "yellow" : saved.status)}>
            <b>Result:</b> {saved.summary}.
            {saved.test && <div className="small">Trials {saved.test.result.trials} · median {saved.test.result.medianRt} ms · false starts {saved.test.result.falseStarts}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={"pvt-box" + (phase === "stimulus" ? " on" : "")} onPointerDown={respond} role="button" aria-label="Reaction box: tap when the counter appears">
        {phase === "stimulus" ? <span className="pvt-counter">{counter}</span> : <span className="muted">Wait for it…</span>}
      </div>
      <div className="row spread">
        <span className="small">{left} s left · last: {last || "–"}</span>
        <button className="btn small" onClick={() => { clearAll(); setP("idle"); }}>Cancel</button>
      </div>
    </div>
  );
}
