import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { useStore, habitatToday, co2Status, ppO2, setCo2Fault, envOf, CO2_LIMIT_MMHG, CO2_TARGET_MMHG } from "../backend/api.js";
import { COLORS } from "../lib.js";

// Cabin environment: the "hostile/closed environment" hazard
export default function Habitat({ go }) {
  const state = useStore();
  const h = habitatToday(state);
  const env = envOf(state);
  const s = co2Status(h.co2);
  const fault = state.habitat.fault;

  return (
    <div>
      <h2>Habitat environment</h2>
      <p className="muted">The cabin is both home and machine. CO₂, oxygen, pressure, temperature and humidity all affect crew health ({env.label}). Readings are simulated.</p>
      <div className="grid3">
        <div className="card stat" style={{ borderLeft: `4px solid ${COLORS[s]}` }}>
          <div className="muted small">CO₂</div>
          <div className="big-ish">{h.co2} mmHg</div>
          <div className="small">{s === "green" ? "Below the 2.5 mmHg target" : s === "yellow" ? "Above target: headache risk rising" : "Above NASA's 3 mmHg limit"}</div>
        </div>
        <div className="card stat"><div className="muted small">Oxygen</div><div className="big-ish">{h.o2}%</div><div className="small">ppO₂ {ppO2(h)} kPa</div></div>
        <div className="card stat"><div className="muted small">Cabin pressure</div><div className="big-ish">{h.pressure} kPa</div><div className="small">{h.pressure < 80 ? "Reduced-pressure exploration atmosphere" : "Sea-level pressure"}</div></div>
        <div className="card stat"><div className="muted small">Temperature</div><div className="big-ish">{h.temp} °C</div></div>
        <div className="card stat"><div className="muted small">Humidity</div><div className="big-ish">{h.humidity}%</div></div>
      </div>
      {h.pressure < 80 && (
        <p className="alert info small">
          Surface habitats may run at about 56.5 kPa (8.2 psi) with 34% oxygen so spacewalks need less prebreathing. That raises the risk of mild hypoxia, so watch your SpO₂ and for headaches or poor sleep.
        </p>
      )}

      <div className="card">
        <h3>CO₂ over the last 30 days</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={state.habitat.history.slice(-30)}>
            <CartesianGrid stroke="#26315a" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#9aa6c4" />
            <YAxis domain={[0, 5]} stroke="#9aa6c4" />
            <Tooltip contentStyle={{ background: "#131a33", border: "1px solid #34406a" }} />
            <ReferenceLine y={CO2_TARGET_MMHG} stroke="#f1c40f" strokeDasharray="4 4" label={{ value: "2.5 target", fill: "#f1c40f", fontSize: 12 }} />
            <ReferenceLine y={CO2_LIMIT_MMHG} stroke="#e74c3c" strokeDasharray="4 4" label={{ value: "3.0 limit", fill: "#e74c3c", fontSize: 12 }} />
            <Line type="monotone" dataKey="co2" stroke="#8fb3ff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="small muted">
          NASA limits CO₂ to 3 mmHg (1-hour average). On the ISS, each 1 mmHg rise doubled the odds of crew headaches; about 2.5 mmHg keeps headache risk near 1%.
          {" "}<a href="https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf" target="_blank" rel="noreferrer">NASA CO₂ technical brief</a>
        </p>
      </div>

      <h3>Demo</h3>
      <div className="row">
        {!fault ? (
          <button className="btn" onClick={() => setCo2Fault(true)}>Simulate CO₂ scrubber fault</button>
        ) : (
          <>
            <button className="btn primary" onClick={() => setCo2Fault(false)}>Fix scrubber (back to normal)</button>
            <button className="btn danger" onClick={() => go("emergency")}>Open High CO₂ protocol</button>
          </>
        )}
      </div>
    </div>
  );
}
