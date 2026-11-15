import React, { useEffect, useRef, useState } from "react";
import { useStore, saveTest, envOf, STAND_REST_SEC, STAND_UP_SEC } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";

// Lie-then-stand test used after landing: 2 minutes lying down, then 3.5 minutes standing.
export default function StandTest({ person, onSaved }) {
  const state = useStore();
  const env = envOf(state);
  const [phase, setPhase] = useState("intro"); // intro | rest | restVitals | stand | standVitals | done
  const [left, setLeft] = useState(0);
  const [v, setV] = useState({ restHr: "", restSys: "", restDia: "", standHr: "", standSys: "", standDia: "" });
  const [symptoms, setSymptoms] = useState(false);
  const [saved, setSaved] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => clearInterval(timer.current), []);

  function countdown(sec, next) {
    clearInterval(timer.current);
    const end = Date.now() + sec * 1000;
    setLeft(sec);
    timer.current = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) {
        clearInterval(timer.current);
        setPhase(next);
      }
    }, 250);
  }

  const num = (x) => (x === "" ? null : Number(x));
  function finish(completed) {
    clearInterval(timer.current);
    const result = {
      restHr: num(v.restHr), restSys: num(v.restSys), restDia: num(v.restDia),
      standHr: num(v.standHr), standSys: num(v.standSys), standDia: num(v.standDia),
      symptoms, completed,
    };
    setSaved(saveTest(person.id, "stand", result));
    setPhase("done");
    onSaved?.();
  }

  const field = (id, label) => (
    <label key={id}>
      {label}
      <input type="number" inputMode="numeric" min="20" max="250" value={v[id]} onChange={(e) => setV({ ...v, [id]: e.target.value })} />
    </label>
  );
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (env.microgravity) {
    return <p className="alert info">You're in microgravity ({env.label}), so there's no "standing up". Use this test after landing on the Moon, Mars or Earth.</p>;
  }
  if (phase === "done" && saved) {
    return (
      <div className="measurement-complete" role="status">
        <Icon name="check" size={40} />
        <h2>Stand test saved</h2>
        <Status status={saved.status} />
        <p>{saved.summary}</p>
        <button className="btn" onClick={() => { setPhase("intro"); setSaved(null); setSymptoms(false); }}>Test again</button>
      </div>
    );
  }
  if (phase === "intro") {
    return (
      <div>
        <ol className="instruction-steps">
          <li>Have a crewmate nearby and a blood-pressure cuff on your arm.</li>
          <li>Lie down flat and still for 2 minutes. Then measure heart rate and blood pressure.</li>
          <li>Stand up and stay still for 3.5 minutes. Measure again near the end.</li>
          <li>If you feel faint, sit or lie down right away and press <b>Stop</b>.</li>
        </ol>
        <button className="btn primary" onClick={() => { setPhase("rest"); countdown(STAND_REST_SEC, "restVitals"); }}>
          Start: lie down <Icon name="arrow" size={18} />
        </button>
      </div>
    );
  }
  if (phase === "rest" || phase === "stand") {
    return (
      <div className="center">
        <p className="eyebrow">{phase === "rest" ? "Lying down" : "Standing still"}</p>
        <div className="big">{mmss(left)}</div>
        {phase === "stand" && (
          <label className="row" style={{ justifyContent: "center" }}>
            <input type="checkbox" checked={symptoms} onChange={(e) => setSymptoms(e.target.checked)} /> I feel dizzy, light-headed or sick
          </label>
        )}
        <div className="row" style={{ justifyContent: "center" }}>
          {phase === "stand" && <button className="btn danger big-btn" onClick={() => { setSymptoms(true); finish(false); }}>Stop: I need to sit down</button>}
          <button className="text-button" onClick={() => { clearInterval(timer.current); setPhase(phase === "rest" ? "restVitals" : "standVitals"); }}>Skip timer</button>
        </div>
      </div>
    );
  }
  if (phase === "restVitals") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); setPhase("stand"); countdown(STAND_UP_SEC, "standVitals"); }}>
        <h2>Lying-down readings</h2>
        <div className="vitals-fields">{field("restHr", "Heart rate (bpm)")}{field("restSys", "Systolic BP")}{field("restDia", "Diastolic BP")}</div>
        <button className="btn primary" type="submit">Now stand up <Icon name="arrow" size={18} /></button>
      </form>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); finish(true); }}>
      <h2>Standing readings</h2>
      <div className="vitals-fields">{field("standHr", "Heart rate (bpm)")}{field("standSys", "Systolic BP")}{field("standDia", "Diastolic BP")}</div>
      <label className="row"><input type="checkbox" checked={symptoms} onChange={(e) => setSymptoms(e.target.checked)} /> I felt dizzy, light-headed or sick</label>
      <button className="btn primary" type="submit">Save result <Icon name="check" size={18} /></button>
    </form>
  );
}
