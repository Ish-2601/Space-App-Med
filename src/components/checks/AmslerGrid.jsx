import React, { useState } from "react";
import { saveTest } from "../../backend/api.js";

const N = 20; // 20 x 20 squares

// Amsler grid: cover one eye, look at the centre dot, tap squares where lines look wavy, blurry or missing
export default function AmslerGrid({ person, onSaved }) {
  const [eye, setEye] = useState("left");
  const [marks, setMarks] = useState({ left: [], right: [] });
  const [done, setDone] = useState({ left: false, right: false });
  const [saved, setSaved] = useState(null);

  const toggle = (i) =>
    setMarks((m) => ({ ...m, [eye]: m[eye].includes(i) ? m[eye].filter((x) => x !== i) : [...m[eye], i] }));

  function finishEye() {
    const next = { ...done, [eye]: true };
    setDone(next);
    if (eye === "left") setEye("right");
    else {
      const res = saveTest(person.id, "amsler", marks);
      setSaved(res);
      onSaved?.();
    }
  }

  if (saved) {
    return (
      <div className={"alert " + (saved.status === "green" ? "info" : saved.status)}>
        <b>Amsler grid saved:</b> {saved.summary}.
        {saved.status !== "green" && <div>The CMO has been notified. An eye exam or ultrasound may be needed (SANS).</div>}
        <div className="row"><button className="btn" onClick={() => { setSaved(null); setMarks({ left: [], right: [] }); setDone({ left: false, right: false }); setEye("left"); }}>Test again</button></div>
      </div>
    );
  }

  return (
    <div>
      <ol className="small">
        <li>Hold the screen at reading distance (about 35–40 cm), with your glasses if you use them.</li>
        <li>Cover your <b>{eye === "left" ? "RIGHT" : "LEFT"}</b> eye. You are testing the <b>{eye}</b> eye.</li>
        <li>Stare at the centre dot the whole time. Tap any square where lines look wavy, blurry, bent or missing.</li>
      </ol>
      <div className="amsler" role="grid" aria-label={`Amsler grid, ${eye} eye`}>
        {Array.from({ length: N * N }, (_, i) => (
          <button
            key={i}
            className={"amsler-cell" + (marks[eye].includes(i) ? " marked" : "")}
            onClick={() => toggle(i)}
            aria-label={`square ${i + 1}${marks[eye].includes(i) ? ", marked" : ""}`}
          />
        ))}
        <div className="amsler-dot" />
      </div>
      <div className="row">
        <span className="small">{marks[eye].length} square(s) marked for the {eye} eye</span>
        <button className="btn primary" onClick={finishEye}>
          {eye === "left" ? "Done with left eye → test right eye" : "Done with right eye → save"}
        </button>
      </div>
    </div>
  );
}
