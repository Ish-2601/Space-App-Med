import React, { useState } from "react";
import { useStore, sendReport, setLinkOnline, ENVIRONMENTS, earthDelayMs, delayText } from "../backend/api.js";
import useNow from "../components/useNow.js";
import PhotoThumb from "../components/PhotoThumb.jsx";

const STATUS_TEXT = { queued: "⏳ Queued (waiting for link)", sending: "📡 Travelling to Earth", delivered: "📥 Delivered · flight surgeon reviewing", replied: "✅ Reply received" };

export default function EarthLink({ person }) {
  const state = useStore();
  const now = useNow();
  const pid = person.id;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const env = ENVIRONMENTS[state.mission.environment];
  const photoCount = state.photos[pid].length;
  const reports = state.reports.filter((r) => r.pid === pid);
  const secs = (ms) => Math.max(0, Math.ceil(ms / 1000));

  return (
    <div>
      <h2>Earth link</h2>
      <p>
        One-way delay: <b>{delayText(env)}</b> ({env.label}). Demo time runs fast: delivery takes {secs(earthDelayMs(state))} s.
        Link: <b>{state.link.online ? "up" : "down"}</b>{" "}
        <button className="btn small" onClick={() => setLinkOnline(!state.link.online)}>{state.link.online ? "Simulate link loss" : "Restore link"}</button>
      </p>
      <p className="muted small">Everything works offline. Reports wait in the queue until the link is back.</p>

      <div className="row">
        <button className="btn primary" onClick={() => sendReport(pid, "health")}>Send my health report</button>
        {photoCount > 0 && (
          <button className="btn" onClick={() => sendReport(pid, "health", "", state.photos[pid].slice(0, 3).map((p) => p.id))}>Send report + latest {Math.min(3, photoCount)} photo(s)</button>
        )}
      </div>
      <textarea rows="3" placeholder="Message to the flight surgeon" value={text} onChange={(e) => { setText(e.target.value); setError(""); }} />
      <button className="btn" onClick={() => { if (!text.trim()) { setError("Write a message first"); return; } sendReport(pid, "message", text.trim()); setText(""); }}>Send message</button>
      {error && <p className="error">{error}</p>}

      <h3>Your reports and messages</h3>
      {reports.length === 0 && <p className="muted">Nothing sent yet.</p>}
      {reports.map((r) => (
        <div key={r.id} className={"card report" + (r.priority ? " priority" : "")}>
          <div className="row spread">
            <b>{r.kind === "health" ? "Health report" : r.kind === "emergency" ? "🚨 Emergency report" : r.kind === "psych" ? "Private conference request" : "Message"}</b>
            <span className="small">
              {STATUS_TEXT[r.status]}
              {r.status === "sending" && ` · arrives in ${secs(r.deliverAt - now)} s`}
              {r.status === "delivered" && ` · reply in ~${secs(r.replyAt - now)} s`}
            </span>
          </div>
          <div className="muted small">Sent {new Date(r.createdAt).toLocaleTimeString()}</div>
          {r.text && <p>{r.text}</p>}
          {r.summary && <details><summary className="small">Report contents</summary><pre>{r.summary}</pre></details>}
          {r.photoIds?.length > 0 && <div className="gallery">{r.photoIds.map((id) => <PhotoThumb key={id} id={id} size={90} />)}</div>}
          {r.reply && <p className="note">{r.reply}</p>}
        </div>
      ))}
    </div>
  );
}
