import React, { useState } from "react";
import {
  useStore,
  EMERGENCIES,
  activeEmergencies,
  startEmergency,
  toggleEmergencyStep,
  resolveEmergency,
  saveEmergencyVitals,
  notifyCMO,
  sendReport,
} from "../backend/api.js";
import useNow from "../components/useNow.js";
import Triage from "../components/Triage.jsx";
import {
  PageTitle,
  Panel,
  Icon,
  Status,
  Segments,
} from "../components/ConsoleUI.jsx";
function Vitals({ em }) {
  const [v, setV] = useState(
      em.vitals || { heartRate: "", systolic: "", diastolic: "", spo2: "" },
    ),
    [msg, setMsg] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="protocol-vitals"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          saveEmergencyVitals(em.id, v);
          setMsg(
            "Vitals saved to the patient record. A priority update is queued.",
          );
          setError("");
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <p className="eyebrow">Patient vitals</p>
      <div className="vitals-fields">
        {[
          ["heartRate", "Heart rate (bpm)"],
          ["systolic", "Systolic BP"],
          ["diastolic", "Diastolic BP"],
          ["spo2", "SpO₂ (%)"],
        ].map(([id, label]) => (
          <label key={id}>
            {label}
            <input
              required
              min=".1"
              max={id === "spo2" ? 100 : undefined}
              type="number"
              step="any"
              value={v[id]}
              onChange={(e) => setV({ ...v, [id]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <button className="btn primary" type="submit">
        Save vitals <Icon name="check" />
      </button>
      {msg && (
        <p role="status" className="small">
          {msg}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
export default function Emergency({ person, go, params = {} }) {
  const state = useStore(),
    now = useNow();
  const selected = state.emergencies.find((e) => e.id === params.emergencyId);
  const [pid, setPid] = useState(selected?.pid || person.id),
    [type, setType] = useState(params.type || "faint"),
    [msg, setMsg] = useState(""),
    [note, setNote] = useState("");
  const active = activeEmergencies(state, pid),
    em = active.find((e) => e.id === params.emergencyId) || active[0],
    def = EMERGENCIES.find((d) => d.id === (em?.type || type));
  const past = state.emergencies.filter((e) => e.pid === pid && e.resolvedAt);
  const [ending, setEnding] = useState(false);
  const seconds = em ? Math.max(0, Math.floor((now - em.startedAt) / 1000)) : 0,
    done = em ? Object.values(em.stepsDone).filter(Boolean).length : 0;
  return (
    <div>
      {!em ? (
        <>
          <PageTitle
            eyebrow="Emergency"
            title="What's wrong?"
            description="Tap the symptoms. The most likely causes and what to do appear instantly."
          />
          <Triage person={person} pid={pid} setPid={setPid} go={go} />
          <h2 className="section-title">
            All emergency protocols{" "}
            <span className="muted small">
              for {state.crew.find((p) => p.id === pid)?.name}
            </span>
          </h2>
          <div className="emergency-options">
            {EMERGENCIES.map((e) => (
              <Panel key={e.id} tone="neutral">
                <h2>{e.title}</h2>
                <p className="muted">{e.when}</p>
                <button
                  className="btn danger"
                  onClick={() => {
                    setType(e.id);
                    startEmergency(pid, e.id);
                  }}
                >
                  Start protocol <Icon name="arrow" />
                </button>
              </Panel>
            ))}
          </div>
        </>
      ) : (
        <>
          <Panel
            title="Emergency · In progress"
            tone="red"
            className="emergency-header"
          >
            <div className="row spread">
              <div className="emergency-heading">
                <span className="icon-tile">
                  <Icon name="emergency" size={34} />
                </span>
                <div>
                  <h1>{em.title}</h1>
                  <p className="muted">
                    Patient: {state.crew.find((p) => p.id === em.pid)?.name} ·
                    Started{" "}
                    {new Date(em.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="protocol-timer">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
                <small>
                  {done} of {def.steps.length} steps
                </small>
              </div>
            </div>
            <div className="emergency-status">
              <div>
                <Icon name="check" />
                <span>
                  <b>Medical officer notified.</b> Recorded in the onboard
                  notification list.
                </span>
              </div>
              <div>
                <Icon name="send" />
                <span>
                  <b>Priority report queued.</b> Track delivery in the simulated
                  Earth link.
                </span>
              </div>
            </div>
          </Panel>
          <div className="main-with-aside">
            <Panel title="Steps">
              <Segments
                value={done}
                max={def.steps.length}
                count={def.steps.length}
                label="Emergency steps completed"
                tone="green"
              />
              <div className="protocol-steps">
                {def.steps.map((s, i) => (
                  <div
                    className={
                      "protocol-step " + (em.stepsDone[i] ? "done" : "")
                    }
                    key={s}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={!!em.stepsDone[i]}
                        onChange={() => toggleEmergencyStep(em.id, i)}
                      />
                      <span>
                        <b>
                          {i + 1}. {s}
                        </b>
                        {i === 2 && em.type === "faint" && (
                          <small>
                            Record the readings from your medical equipment
                            below.
                          </small>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <Vitals key={em.id} em={em} />
              <div className="row spread protocol-actions">
                <button className="btn danger" onClick={() => setEnding(true)}>
                  End protocol
                </button>
                <button
                  className="btn"
                  onClick={() => go("earth", { pid: em.pid })}
                >
                  Track priority report <Icon name="send" />
                </button>
                <button
                  className="btn primary"
                  disabled={done !== def.steps.length}
                  onClick={() => resolveEmergency(em.id)}
                >
                  <Icon name="check" />
                  Mark resolved
                </button>
              </div>
              {ending && (
                <div className="alert red">
                  <p>
                    End this protocol before all steps are complete? It will be
                    recorded as ended early.
                  </p>
                  <div className="row">
                    <button
                      className="btn danger"
                      onClick={() => {
                        resolveEmergency(em.id, { endedEarly: true });
                        setEnding(false);
                      }}
                    >
                      End and record
                    </button>
                    <button className="btn" onClick={() => setEnding(false)}>
                      Keep protocol open
                    </button>
                  </div>
                </div>
              )}
            </Panel>
            <aside className="panel-stack">
              <Panel title="Onboard support" tone="red">
                <p>
                  The medical officer leads on site. Earth communications may be
                  delayed.
                </p>
                <button
                  className="btn danger full-width"
                  onClick={() => {
                    notifyCMO(
                      em.pid,
                      "Urgent assistance requested: " + em.title,
                      "red",
                    );
                    setMsg(
                      "Urgent notification added for the medical officer.",
                    );
                  }}
                >
                  <Icon name="medical" />
                  Request CMO assistance
                </button>
                {msg && (
                  <p className="small" role="status">
                    {msg}
                  </p>
                )}
              </Panel>
              <Panel title="Add a priority note">
                <label className="sr-only" htmlFor="emergency-note">
                  Priority note
                </label>
                <textarea
                  id="emergency-note"
                  rows="4"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record a change or observation…"
                />
                <button
                  className="btn"
                  disabled={!note.trim()}
                  onClick={() => {
                    sendReport(
                      em.pid,
                      "emergency",
                      em.title + ": " + note.trim(),
                    );
                    setNote("");
                    setMsg("Priority note queued.");
                  }}
                >
                  <Icon name="send" />
                  Send note
                </button>
              </Panel>
              <Panel title="Other protocols">
                {EMERGENCIES.filter((e) => e.id !== em.type).map((e) => (
                  <button
                    className="resource-link"
                    key={e.id}
                    onClick={() => {
                      startEmergency(pid, e.id);
                      go("emergency", {
                        emergencyId: activeEmergencies(state, pid).find(
                          (item) => item.type === e.id,
                        )?.id,
                      });
                      setMsg("");
                    }}
                  >
                    <Icon name={e.id === "spe" ? "sun" : "emergency"} />
                    <span>{e.title}</span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </Panel>
            </aside>
          </div>
          {active.length > 1 && (
            <Panel title="Active protocols">
              <div className="row">
                {active.map((e) => (
                  <button
                    key={e.id}
                    className="btn"
                    onClick={() => go("emergency", { emergencyId: e.id })}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
      {!!past.length && (
        <Panel title="Protocol history">
          {past.map((e) => (
            <div className="check-result" key={e.id}>
              <Status status={e.endedEarly ? "info" : "green"}>
                {e.endedEarly ? "Ended early" : "Resolved"}
              </Status>
              <p>
                {e.title} · {new Date(e.resolvedAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
