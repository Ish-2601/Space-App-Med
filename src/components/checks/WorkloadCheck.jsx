import React, { useState } from "react";
import { saveTest, TLX_SCALES, rawTlx } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";

// NASA Task Load Index (raw TLX): six 0-100 sliders, averaged.
export default function WorkloadCheck({ person, onSaved }) {
  const [vals, setVals] = useState(Object.fromEntries(TLX_SCALES.map((s) => [s.id, 50])));
  const [saved, setSaved] = useState(null);

  if (saved) {
    return (
      <div className="measurement-complete" role="status">
        <Icon name="check" size={40} />
        <h2>Workload saved</h2>
        <Status status={saved.status} />
        <p>{saved.summary}</p>
        <button className="btn" onClick={() => setSaved(null)}>Rate again</button>
      </div>
    );
  }
  return (
    <form
      className="tlx-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(saveTest(person.id, "tlx", vals));
        onSaved?.();
      }}
    >
      {TLX_SCALES.map((s) => (
        <label key={s.id} className="tlx-scale">
          <span className="row spread">
            <b>{s.label}</b>
            <span className="muted">{vals[s.id]}</span>
          </span>
          <span className="muted small">{s.q}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={vals[s.id]}
            onChange={(e) => setVals({ ...vals, [s.id]: Number(e.target.value) })}
            aria-label={s.label}
          />
          <span className="row spread small muted"><span>{s.low}</span><span>{s.high}</span></span>
        </label>
      ))}
      <p className="row spread">
        <span className="muted">Overall workload</span>
        <b>{rawTlx(vals)} / 100</b>
      </p>
      <button className="btn primary" type="submit">Save rating <Icon name="check" size={18} /></button>
    </form>
  );
}
