import React, { useEffect, useRef, useState } from "react";
import { useStore, saveTest, envOf } from "../../backend/api.js";

const MAX_SEC = 30;

// One-leg stance test. If the device has motion sensors (phone/tablet held to the chest), sway is measured too.
export default function BalanceTest({ person, onSaved }) {
  const state = useStore();
  const env = envOf(state);
  const [phase, setPhase] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(null);
  const t0 = useRef(0);
  const timer = useRef(0);
  const accel = useRef([]);
  const motionHandler = useRef(null);

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    clearInterval(timer.current);
    if (motionHandler.current) window.removeEventListener("devicemotion", motionHandler.current);
  }

  async function start() {
    setSaved(null);
    accel.current = [];
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        await DeviceMotionEvent.requestPermission(); // iPhone/iPad
      }
    } catch {
      // no permission: test still works without sway
    }
    motionHandler.current = (e) => {
      const a = e.acceleration || e.accelerationIncludingGravity;
      if (a && a.x != null) accel.current.push(Math.hypot(a.x, a.y, a.z));
    };
    window.addEventListener("devicemotion", motionHandler.current);
    t0.current = performance.now();
    setPhase("running");
    timer.current = setInterval(() => {
      const s = (performance.now() - t0.current) / 1000;
      setElapsed(s);
      if (s >= MAX_SEC) stop();
    }, 100);
  }

  function stop() {
    stopAll();
    const seconds = Math.min(MAX_SEC, Math.round(((performance.now() - t0.current) / 1000) * 10) / 10);
    const a = accel.current;
    let sway = null;
    if (a.length > 20) {
      const mean = a.reduce((x, y) => x + y, 0) / a.length;
      sway = Math.round(Math.sqrt(a.reduce((x, y) => x + (y - mean) ** 2, 0) / a.length) * 100) / 100;
    }
    setPhase("idle");
    setSaved(saveTest(person.id, "balance", { seconds, sway }));
    onSaved?.();
  }

  return (
    <div>
      {env.microgravity && (
        <p className="alert info">You're in microgravity ({env.label}), where standing balance can't be tested. Use this after landing on the Moon, Mars or Earth.</p>
      )}
      <ol className="small">
        <li>Stand near a wall or handhold for safety. Cross your arms (hold a phone to your chest to also measure sway).</li>
        <li>Press Start, lift one foot, and keep your eyes open.</li>
        <li>Press Stop the moment your foot touches down or you grab support. The test ends by itself at 30 s.</li>
      </ol>
      {phase === "idle" ? (
        <button className="btn primary" onClick={start}>Start</button>
      ) : (
        <div className="center">
          <div className="big">{elapsed.toFixed(1)} s</div>
          <button className="btn danger big-btn" onClick={stop}>Stop: foot down</button>
        </div>
      )}
      {saved && <div className={"alert " + (saved.status === "green" ? "info" : saved.status)}><b>Result:</b> {saved.summary}.</div>}
      <p className="muted small">Ranges: 20 s+ normal, 10–19 s reduced, under 10 s poor (team screening thresholds).</p>
    </div>
  );
}
