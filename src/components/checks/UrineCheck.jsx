import React, { useState } from "react";
import { saveTest, URINE_SHADES } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";

// Armstrong 8-shade urine colour chart. Screen colours vary, so this is a rough guide.
export default function UrineCheck({ person, onSaved }) {
  const [shade, setShade] = useState(null);
  const [saved, setSaved] = useState(null);

  if (saved) {
    return (
      <div className="measurement-complete" role="status">
        <Icon name="check" size={40} />
        <h2>Hydration check saved</h2>
        <Status status={saved.status} />
        <p>{saved.summary}</p>
        <button className="btn" onClick={() => { setSaved(null); setShade(null); }}>Check again</button>
      </div>
    );
  }
  return (
    <div>
      <p>Which shade is closest?</p>
      <div className="urine-chart" role="radiogroup" aria-label="Urine colour, 1 (palest) to 8 (darkest)">
        {URINE_SHADES.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={shade === i + 1}
            aria-label={`Shade ${i + 1} of 8`}
            className={"urine-swatch" + (shade === i + 1 ? " selected" : "")}
            style={{ background: c }}
            onClick={() => setShade(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="row spread small muted"><span>1–3 well hydrated</span><span>4–6 drink more</span><span>7–8 dehydrated</span></p>
      <p className="muted small">Screen colours vary and B vitamins can make urine bright yellow, so use this as a rough guide.</p>
      <button className="btn primary" disabled={!shade} onClick={() => { setSaved(saveTest(person.id, "urine", { shade })); onSaved?.(); }}>
        Save <Icon name="check" size={18} />
      </button>
    </div>
  );
}
