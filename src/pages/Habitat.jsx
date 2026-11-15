import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  useStore,
  habitatToday,
  co2Status,
  ppO2,
  setCo2Fault,
  envOf,
  CO2_LIMIT_MMHG,
  CO2_TARGET_MMHG,
} from "../backend/api.js";
import { PageTitle, Icon, Status } from "../components/ConsoleUI.jsx";
export default function Habitat({ go, embedded = false }) {
  const state = useStore(),
    h = habitatToday(state),
    env = envOf(state),
    s = co2Status(h.co2),
    fault = state.habitat.fault;
  return (
    <div>
      {!embedded && (
        <PageTitle
          eyebrow="Crew · Ship"
          title="The place you call home"
          description={
            "Cabin readings for " +
            env.label +
            ". Simulated environmental monitoring."
          }
        />
      )}
      <div className="habitat-stats">
        {[
          ["Cabin CO₂", h.co2, "mmHg", s],
          ["Oxygen", h.o2, "%", "info"],
          ["Pressure", h.pressure, "kPa", "info"],
        ].map(([label, value, unit, status]) => (
          <div key={label}>
            <p className="eyebrow">{label}</p>
            <strong>
              {value} <small>{unit}</small>
            </strong>
            <Status status={status}>
              {label === "Cabin CO₂"
                ? s === "green"
                  ? "Below recommended"
                  : s === "yellow"
                    ? "Above recommended"
                    : "Above NASA limit"
                : label === "Oxygen"
                  ? "ppO₂ " + ppO2(h) + " kPa"
                  : h.pressure < 80
                    ? "Exploration atmosphere"
                    : "Sea-level pressure"}
            </Status>
          </div>
        ))}
      </div>
      <p className="small muted">
        Temperature {h.temp} °C · Humidity {h.humidity}%
      </p>
      <div className="habitat-chart">
        <p className="small muted">Cabin CO₂, last 30 days (mmHg)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={state.habitat.history.slice(-30)}
            margin={{ left: -28, right: 8, top: 18, bottom: 0 }}
          >
            <CartesianGrid stroke="#273746" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#7f93a5"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              stroke="#7f93a5"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#111d29",
                border: "1px solid #536a80",
                fontSize: 12,
              }}
            />
            <ReferenceLine
              y={CO2_TARGET_MMHG}
              stroke="#c3af82"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={CO2_LIMIT_MMHG}
              stroke="#ca9396"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="co2"
              stroke="#b4cddd"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="chart-legend">
          <span className="text-yellow">Recommended {CO2_TARGET_MMHG} (NASA study)</span>
          <span className="text-red">NASA limit {CO2_LIMIT_MMHG} (1-h avg)</span>
        </p>
      </div>
      <div className="row spread">
        <a
          className="small muted"
          href="https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"
          target="_blank"
          rel="noreferrer"
        >
          NASA CO₂ technical brief ↗
        </a>
        <button
          className={"btn small " + (fault ? "primary" : "")}
          onClick={() => setCo2Fault(!fault)}
        >
          <Icon name="air" size={16} />
          {fault ? "Restore scrubber" : "Simulate scrubber fault"}
        </button>
      </div>
      {fault && (
        <button
          className="btn danger full-width"
          onClick={() => go("emergency", { type: "co2" })}
        >
          Open high CO₂ protocol <Icon name="arrow" />
        </button>
      )}
    </div>
  );
}
