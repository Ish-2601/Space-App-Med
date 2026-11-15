import React, { useEffect, useState } from "react";
import {
  useStore,
  triage,
  TRIAGE_SYMPTOMS,
  TRIAGE_CONTEXT,
  startEmergency,
  notifyCMO,
  EMERGENCIES,
} from "../backend/api.js";
import { Icon } from "./ConsoleUI.jsx";
import { sandboxEnabled, saveTriageQuery } from "../backend/sandbox.js";

const URGENCY = {
  emergency: { label: "Emergency", cls: "red" },
  urgent: { label: "Urgent", cls: "yellow" },
  routine: { label: "Not urgent", cls: "info" },
};
const STRENGTH = {
  strong: "Strong match",
  possible: "Possible",
  weak: "Less likely",
};

// Fast diagnosis: tap what's happening, get ranked possible causes from symptoms + live data.
export default function Triage({ person, pid, setPid, go }) {
  const state = useStore();
  const [symptoms, setSymptoms] = useState([]);
  const [context, setContext] = useState({});
  const [vitals, setVitals] = useState({ spo2: "", hr: "", sys: "", temp: "" });
  const [alerted, setAlerted] = useState("");
  const privateMode = sandboxEnabled(state);
  const query = JSON.stringify({ symptoms, context, vitals });
  useEffect(() => {
    const payload = JSON.parse(query);
    if (
      !payload.symptoms.length &&
      !Object.values(payload.vitals).some((v) => v !== "")
    )
      return;
    const timer = setTimeout(() => saveTriageQuery(pid, payload), 700);
    return () => clearTimeout(timer);
  }, [pid, query, privateMode]);
  const who = state.crew.find((p) => p.id === pid);
  const toggle = (id) =>
    setSymptoms((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const { results, flags, emergency } = triage(state, pid, {
    symptoms,
    context,
    vitals,
  });
  const any = symptoms.length > 0;

  const alertCrew = () => {
    const what = symptoms.length
      ? TRIAGE_SYMPTOMS.filter((s) => symptoms.includes(s.id))
          .map((s) => s.label.toLowerCase())
          .join(", ")
      : "needs help";
    const top = results[0] ? ` Most likely: ${results[0].name}.` : "";
    notifyCMO(
      pid,
      `URGENT: ${who?.name} — ${what}.${top} (raised by ${person.name})`,
      "red",
    );
    setAlerted(
      privateMode
        ? "Alert saved privately. No crew notification sent."
        : `Crew alerted at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. The medical officer has been notified.`,
    );
  };

  return (
    <div className="triage">
      <div className="triage-top">
        <button className="btn danger triage-alert" onClick={alertCrew}>
          <Icon name="emergency" size={26} /> Alert the crew now
        </button>
        <div className="triage-who" role="group" aria-label="Who needs help">
          <span className="muted">Who needs help?</span>
          <div className="chip-row">
            {state.crew.map((p) => (
              <button
                key={p.id}
                className={"chip" + (p.id === pid ? " on" : "")}
                aria-pressed={p.id === pid}
                onClick={() => setPid(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      {alerted && (
        <p role="status" className="alert-crew-status">
          <Icon name="check" size={18} /> {alerted}
        </p>
      )}
      <p className="small muted">
        {privateMode
          ? "Triage queries are saved in your Private Sandbox. Critical readings open an escalation prompt before anything is shared."
          : "Triage queries are saved on this device; they do not change your readings."}
      </p>

      <div className="triage-layout">
        <div className="triage-inputs">
          <h2 className="triage-h">
            1. What's happening?{" "}
            <span className="muted">Tap all that apply</span>
          </h2>
          <div className="tile-grid">
            {TRIAGE_SYMPTOMS.map((s) => (
              <button
                key={s.id}
                className={"tile" + (symptoms.includes(s.id) ? " on" : "")}
                aria-pressed={symptoms.includes(s.id)}
                onClick={() => toggle(s.id)}
              >
                <Icon name={s.icon} size={24} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <h2 className="triage-h">
            2. Any of these? <span className="muted">Optional</span>
          </h2>
          <div className="tile-grid context">
            {TRIAGE_CONTEXT.map((c) => (
              <button
                key={c.id}
                className={"tile" + (context[c.id] ? " on" : "")}
                aria-pressed={!!context[c.id]}
                onClick={() => setContext((x) => ({ ...x, [c.id]: !x[c.id] }))}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <h2 className="triage-h">
            3. Readings now{" "}
            <span className="muted">Optional: skip if you don't have them</span>
          </h2>
          <div className="vitals-quick">
            {[
              ["spo2", "SpO₂ %"],
              ["hr", "Heart rate"],
              ["sys", "Systolic BP"],
              ["temp", "Temp °C"],
              ["acuteRadiation", "Acute event dose (mSv)"],
            ].map(([k, label]) => (
              <label key={k}>
                {label}
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={vitals[k] ?? ""}
                  onChange={(e) =>
                    setVitals({ ...vitals, [k]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          {any && (
            <button
              className="text-button"
              onClick={() => {
                setSymptoms([]);
                setContext({});
                setVitals({ spo2: "", hr: "", sys: "", temp: "" });
              }}
            >
              <Icon name="refresh" size={16} /> Start over
            </button>
          )}
        </div>

        {any && results[0] && (
          <button
            className={`triage-peek cause-${URGENCY[results[0].urgencyNow].cls}`}
            onClick={() =>
              document
                .getElementById("triage-results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            <span>
              <small>
                Most likely · {URGENCY[results[0].urgencyNow].label}
              </small>
              {results[0].name}
            </span>
            <span className="peek-go">
              See what to do <Icon name="arrow" size={18} />
            </span>
          </button>
        )}
        <div className="triage-results" id="triage-results" aria-live="polite">
          <h2 className="triage-h">Most likely causes</h2>
          {!any && (
            <p className="muted triage-empty">
              Tap the symptoms on the left. Results appear here instantly, using{" "}
              {who?.name}'s live readings, cabin air and recent checks.
            </p>
          )}
          {any && emergency && (
            <div className="triage-flag" role="alert">
              <Icon name="alert" size={24} />
              <div>
                <b>Treat as an emergency now.</b>{" "}
                {(flags.length
                  ? flags
                  : results
                      .filter(
                        (r) =>
                          r.urgencyNow === "emergency" &&
                          r.strength === "strong",
                      )
                      .map((r) => r.name)
                ).join(" · ")}
                .<span> Alert the crew and start the protocol below.</span>
              </div>
            </div>
          )}
          {any && !results.length && (
            <p className="muted">
              No clear match. Alert the CMO and describe what's happening.
            </p>
          )}
          {results.map((r, i) => {
            const proto =
              r.protocol && EMERGENCIES.find((e) => e.id === r.protocol);
            return (
              <article
                key={r.id}
                className={`cause cause-${URGENCY[r.urgencyNow].cls}${i === 0 ? " top" : ""}`}
              >
                <div className="cause-head">
                  <h3>
                    {i + 1}. {r.name}
                  </h3>
                  <span
                    className={`status status-${URGENCY[r.urgencyNow].cls}`}
                  >
                    {URGENCY[r.urgencyNow].label}
                  </span>
                  <span className="status">{STRENGTH[r.strength]}</span>
                </div>
                <ul className="cause-why">
                  {r.why.slice(0, 4).map(([w, t]) => (
                    <li key={t} className={w < 0 ? "against" : "for"}>
                      <Icon name={w < 0 ? "info" : "check"} size={15} /> {t}
                    </li>
                  ))}
                </ul>
                {(i === 0 || r.urgencyNow === "emergency") && (
                  <ol className="cause-do">
                    {r.doNow.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                )}
                <div className="row">
                  {proto && (
                    <button
                      className={
                        "btn " +
                        (r.urgencyNow === "emergency" ? "danger" : "primary")
                      }
                      onClick={() => startEmergency(pid, proto.id)}
                    >
                      Start {proto.title.split(" (")[0].split(" / ")[0]}{" "}
                      protocol <Icon name="arrow" size={18} />
                    </button>
                  )}
                  {r.guide && (
                    <button
                      className="btn"
                      onClick={() => go("medguide", { guide: r.guide })}
                    >
                      Guide
                    </button>
                  )}
                  <button
                    className="btn"
                    onClick={() => go("body", { part: r.part })}
                  >
                    Body map
                  </button>
                </div>
              </article>
            );
          })}
          {any && (
            <p className="small muted">
              Possible causes to check, ranked from symptoms and live data. Not
              a diagnosis: the CMO and flight surgeon decide.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
