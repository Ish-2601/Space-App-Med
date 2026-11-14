import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, CartesianGrid } from "recharts";
import { useStore, historyOf } from "../backend/api.js";
import { indicators, indicatorSummary, greenBand, rangeText, COLORS, round1 } from "../lib.js";

export default function Trends({ person, params }) {
  const state = useStore();
  const [id, setId] = useState(params.indicator || "heartRate");
  const [range, setRange] = useState(30);
  const ind = indicators.find((i) => i.id === id);
  const full = historyOf(state, person.id);
  const data = full.slice(-range);
  const sum = indicatorSummary(ind, full);
  const vals = data.map((r) => r[id]);
  const band = greenBand(ind, sum.baseline);
  const lo = Math.min(...vals, band[0]);
  const hi = Math.max(...vals, Math.min(band[1], Math.max(...vals) * 1.2));

  return (
    <div>
      <h2>Trends</h2>
      <div className="row">
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {indicators.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
        {[7, 14, 30, 365].map((n) => (
          <button key={n} className={"btn small" + (range === n ? " active" : "")} onClick={() => setRange(n)}>
            {n === 365 ? "All" : `${n} days`}
          </button>
        ))}
      </div>
      <p>
        Latest <b>{sum.latest} {ind.unit}</b> · your baseline {round1(sum.baseline)} · {sum.trend}
        {sum.trend !== "steady" && ` (${sum.change > 0 ? "+" : ""}${round1(sum.change)})`}
      </p>
      <div className="card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="#26315a" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#9aa6c4" />
            <YAxis domain={[Math.floor(lo * 0.95), Math.ceil(hi * 1.05)]} stroke="#9aa6c4" />
            <Tooltip contentStyle={{ background: "#131a33", border: "1px solid #34406a" }} />
            <ReferenceArea y1={band[0]} y2={band[1]} fill={COLORS.green} fillOpacity={0.08} />
            <ReferenceLine y={sum.baseline} stroke="#8fb3ff" strokeDasharray="4 4" label={{ value: "your baseline", fill: "#8fb3ff", fontSize: 12 }} />
            <Line type="monotone" dataKey={id} stroke={COLORS[sum.status]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="muted small">Green band = healthy range ({rangeText(ind, sum.baseline)}). Dashed line = your own baseline (first week of data).</p>
      </div>
      <p><b>Why it matters:</b> {ind.why}</p>
      <p className="muted small">
        NASA risk: {ind.risk} · Sources:{" "}
        {ind.sources.map((s, n) => <a key={s} href={s} target="_blank" rel="noreferrer">[{n + 1}] </a>)}
      </p>
    </div>
  );
}
