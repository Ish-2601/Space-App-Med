import React, { useState } from "react";
import {
  useStore,
  sendReport,
  ENVIRONMENTS,
  earthDelayMs,
  delayText,
} from "../backend/api.js";
import useNow from "../components/useNow.js";
import PhotoThumb from "../components/PhotoThumb.jsx";
import EarthPriorityQueue from "../components/EarthPriorityQueue.jsx";
import { PageTitle, Icon, Status } from "../components/ConsoleUI.jsx";

const STAGES = ["Queued", "Travelling to Earth", "Delivered", "Reply received"];
export default function EarthLink({ person, embedded = false, params = {} }) {
  const state = useStore(),
    now = useNow(),
    pid = state.crew.some((p) => p.id === params.pid) ? params.pid : person.id;
  const [text, setText] = useState(""),
    [attach, setAttach] = useState(false),
    [error, setError] = useState("");
  const env = ENVIRONMENTS[state.mission.environment];
  const photos = state.photos[pid].slice(0, 2);
  const reports = state.reports.filter((r) => r.pid === pid);
  function send(kind) {
    if (kind === "message" && !text.trim()) {
      setError("Write a message first.");
      return;
    }
    sendReport(pid, kind, text.trim(), attach ? photos.map((p) => p.id) : []);
    setText("");
    setError("");
  }
  return (
    <div className="earth-link">
      {!embedded && (
        <PageTitle
          eyebrow={
            "Crew · Earth link · " + state.crew.find((p) => p.id === pid).name
          }
          title="A little closer to home"
          description="Reports wait on this device when the link is down."
        />
      )}
      <div className="row spread">
        <p className="eyebrow">Message to the flight surgeon</p>
        <Status status={state.link.online ? "green" : "yellow"}>
          {state.link.online ? "Link up" : "Offline"}
        </Status>
      </div>
      <label className="sr-only" htmlFor="earth-message">
        Message to the flight surgeon
      </label>
      <textarea
        id="earth-message"
        rows="3"
        placeholder="Write a message. It waits in the queue if the link is down."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError("");
        }}
      />
      {photos.length > 0 && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={attach}
            onChange={(e) => setAttach(e.target.checked)}
          />
          Attach my {photos.length} latest photo{photos.length > 1 ? "s" : ""}
        </label>
      )}
      <div className="row">
        <button className="btn primary" onClick={() => send("health")}>
          <Icon name="send" />
          Send health report
        </button>
        <button className="btn" onClick={() => send("message")}>
          <Icon name="message" />
          Send message
        </button>
      </div>
      <p className="muted small">
        One-way delay{" "}
        {state.link.judgesDemo40 ? "20 min · judge demo" : delayText(env)} ·
        Demo delivery takes {Math.ceil(earthDelayMs(state) / 1000)} seconds.
        This is a simulated Earth link.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <EarthPriorityQueue pid={pid} />
      <h4 className="eyebrow section-label">Your reports and messages</h4>
      {!reports.length && (
        <div className="empty-state">
          <Icon name="send" size={30} />
          <p>No transmissions yet.</p>
          <span>Your reports and replies will appear here.</span>
        </div>
      )}
      <div className="report-list">
        {reports.map((r) => {
          const stage = ["queued", "sending", "delivered", "replied"].indexOf(
            r.status,
          );
          return (
            <article key={r.id} className="transmission">
              <div className="row spread">
                <div>
                  <b>
                    {r.kind === "health"
                      ? "Health report"
                      : r.kind === "emergency"
                        ? "Priority report"
                        : r.kind === "psych"
                          ? "Private conference request"
                          : "Message"}
                  </b>
                  <div className="small muted">
                    Sent{" "}
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <Status status={stage === 3 ? "green" : "info"}>
                  {STAGES[stage]}
                </Status>
              </div>
              {r.text && <p>{r.text}</p>}
              <ol className="transmission-track">
                {STAGES.map((label, i) => (
                  <li
                    key={label}
                    className={i <= stage ? "reached" : ""}
                    aria-current={i === stage ? "step" : undefined}
                  >
                    <i />
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
              {r.status === "sending" && (
                <p className="small muted">
                  <Icon name="clock" size={14} /> Arrives in{" "}
                  {Math.max(0, Math.ceil((r.deliverAt - now) / 1000))} s
                </p>
              )}
              {r.status === "delivered" && (
                <p className="small muted">
                  Simulated reply in about{" "}
                  {Math.max(0, Math.ceil((r.replyAt - now) / 1000))} s
                </p>
              )}
              {r.summary && (
                <details>
                  <summary>Report contents</summary>
                  <pre>{r.summary}</pre>
                </details>
              )}
              {r.photoIds?.length > 0 && (
                <div className="gallery">
                  {r.packets?.some(
                    (p) =>
                      p.tier === 3 &&
                      !["delivered", "acknowledged"].includes(p.state),
                  ) && (
                    <p className="small muted">
                      Onboard attachment preview · media is still pending.
                      Report delivery refers to clinical JSON.
                    </p>
                  )}
                  {r.photoIds.map((id) => (
                    <PhotoThumb key={id} id={id} size={72} />
                  ))}
                </div>
              )}
              {r.reply && (
                <div className="transmission-reply">
                  <p className="eyebrow">Flight surgeon · simulated reply</p>
                  {r.reply}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
