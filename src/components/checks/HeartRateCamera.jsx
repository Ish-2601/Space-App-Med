import React, { useEffect, useRef, useState } from "react";
import useCamera from "../useCamera.js";
import { estimateBpm, regionMean } from "../../backend/rppg.js";
import { saveTest } from "../../backend/api.js";

const DURATION_SEC = 20;
// Where to read colour from: forehead box for face mode, whole frame for fingertip mode
const REGIONS = {
  face: { region: { x0: 0.38, y0: 0.12, x1: 0.62, y1: 0.3 }, channel: 1 }, // green channel
  finger: { region: { x0: 0.2, y0: 0.2, x1: 0.8, y1: 0.8 }, channel: 0 }, // red channel
};

export default function HeartRateCamera({ person, onSaved }) {
  const cam = useCamera();
  const [mode, setMode] = useState("face");
  const [phase, setPhase] = useState("idle"); // idle | measuring | done
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState(null);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(null);
  const samples = useRef([]);
  const raf = useRef(0);
  const canvas = useRef(null);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  async function begin() {
    setResult(null);
    setSaved(null);
    setElapsed(0);
    setLive(null);
    samples.current = [];
    const stream = await cam.start(mode === "face" ? "user" : "environment", { torch: mode === "finger" });
    if (!stream) return;
    setPhase("measuring");
    const t0 = performance.now();
    let lastLive = 0;
    let lastUi = 0;
    const ctx = canvas.current.getContext("2d", { willReadFrequently: true });
    const { region, channel } = REGIONS[mode];
    const loop = () => {
      const v = cam.videoRef.current;
      if (v && v.videoWidth) {
        ctx.drawImage(v, 0, 0, 80, 60);
        const img = ctx.getImageData(0, 0, 80, 60);
        const t = performance.now();
        samples.current.push({ t, v: regionMean(img, region, channel) });
        const sec = (t - t0) / 1000;
        if (t - lastUi >= 250) {
          lastUi = t; // update the screen ~4 times a second, not every frame
          setElapsed(sec);
        }
        if (sec > 8 && t - lastLive > 1000) {
          lastLive = t;
          setLive(estimateBpm(samples.current.filter((s) => s.t > t - 10000)));
        }
        if (sec >= DURATION_SEC) {
          finish();
          return;
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }

  function finish() {
    cancelAnimationFrame(raf.current);
    cam.stop();
    setResult(estimateBpm(samples.current));
    setPhase("done");
  }

  function save() {
    const res = saveTest(person.id, "hr", { bpm: result.bpm, quality: Math.round(result.quality * 100) / 100, label: result.label, mode });
    setSaved(res);
    onSaved?.();
  }

  return (
    <div>
      <div className="row">
        <label className="radio"><input type="radio" checked={mode === "face"} onChange={() => setMode("face")} disabled={phase === "measuring"} /> Face (front camera)</label>
        <label className="radio"><input type="radio" checked={mode === "finger"} onChange={() => setMode("finger")} disabled={phase === "measuring"} /> Fingertip (back camera + flash)</label>
      </div>
      <p className="small muted">
        {mode === "face"
          ? "Sit still in good, even light. Put your forehead inside the box and don't talk for 20 seconds."
          : "Cover the back camera (and flash) completely with your fingertip. Press lightly and keep still for 20 seconds."}
      </p>
      <div className="cam-box">
        <video ref={cam.videoRef} playsInline muted className={cam.active ? "" : "hidden"} />
        {cam.active && mode === "face" && <div className="roi" style={{ left: "38%", top: "12%", width: "24%", height: "18%" }} />}
        {!cam.active && <div className="cam-placeholder"><div className="camera-outline" /><span>{phase === "done" ? "Measurement complete · camera off" : "Camera off · ready when you are"}</span></div>}
      </div>
      <canvas ref={canvas} width="80" height="60" className="hidden" />
      {cam.error && <p className="error">{cam.error}</p>}

      {phase === "idle" && <button className="btn primary" onClick={begin}>Start 20-second measurement</button>}
      {phase === "measuring" && (
        <>
          <div className="meter"><div style={{ width: `${(elapsed / DURATION_SEC) * 100}%`, background: "#9cb9ce" }} /></div>
          <p>Measuring… {Math.ceil(DURATION_SEC - elapsed)} s left{live?.bpm ? ` · live estimate ${live.bpm} bpm (${live.label})` : ""}</p>
          <button className="btn small" onClick={() => { cancelAnimationFrame(raf.current); cam.stop(); setPhase("idle"); }}>Cancel</button>
        </>
      )}
      {phase === "done" && result && (
        <div className={"alert " + (result.label === "poor" ? "yellow" : "info")}>
          <b>{result.bpm ? `${result.bpm} bpm` : "No pulse found"}</b> · signal quality {result.label} ({Math.round(result.quality * 100)}%)
          {result.label === "poor" && <div>{result.reason || "The signal was too noisy to trust. Hold still, improve the light, and try again."}</div>}
          <div className="row">
            {result.label !== "poor" && !saved && <button className="btn primary" onClick={save}>Save to my heart-rate record</button>}
            <button className="btn" onClick={() => setPhase("idle")}>Measure again</button>
          </div>
          {saved && <div>Saved. Status: {saved.status} ({saved.summary}).</div>}
        </div>
      )}
      {phase === "done" && !result && <p className="error">Not enough video frames were captured. Try again.</p>}
      <p className="muted small">Camera pulse readings are less accurate than a medical monitor. Use them for trends and spot checks.</p>
    </div>
  );
}
