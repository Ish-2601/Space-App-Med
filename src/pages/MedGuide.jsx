import React, { useState } from "react";
import { MED_GUIDE, SYMPTOMS, logSymptom, notifyCMO, useStore } from "../backend/api.js";
import { bodyParts } from "../lib.js";

export default function MedGuide({ person, go, params }) {
  const state = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(params.guide || null);
  const [msg, setMsg] = useState("");
  const list = MED_GUIDE.filter((g) => (g.title + g.causes.join(" ")).toLowerCase().includes(q.toLowerCase()));
  const g = MED_GUIDE.find((x) => x.id === sel);
  const logged = state.symptomLog[person.id].filter((s) => s.day === state.mission.day);

  return (
    <div className="grid2">
      <div>
        <h2>Med guide</h2>
        <input placeholder="Search symptoms" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="list">
          {list.map((x) => (
            <button key={x.id} className={"part" + (sel === x.id ? " active" : "")} onClick={() => { setSel(x.id); setMsg(""); }}>
              {x.title}
            </button>
          ))}
          {list.length === 0 && <p className="muted">No match. Try another word, or notify the CMO.</p>}
        </div>
        {logged.length > 0 && (
          <>
            <h3>Logged today</h3>
            <ul>{logged.map((s) => <li key={s.id}>{SYMPTOMS.find((x) => x.id === s.symptom)?.label || s.symptom}</li>)}</ul>
          </>
        )}
      </div>
      <div className="card">
        {!g && <p className="muted">Pick a symptom to see likely space-related causes, what you can do, and when to escalate.</p>}
        {g && (
          <>
            <h2>{g.title}</h2>
            <p className="muted small">Body area: {bodyParts[g.part].name}</p>
            <h3>Possible space-related causes</h3>
            <ul>{g.causes.map((c) => <li key={c}>{c}</li>)}</ul>
            <h3>What you can do now</h3>
            <ol>{g.selfCare.map((c) => <li key={c}>{c}</li>)}</ol>
            <h3 className="danger-text">Escalate to the CMO / flight surgeon if</h3>
            <ul>{g.escalate.map((c) => <li key={c}>{c}</li>)}</ul>
            <div className="row">
              {SYMPTOMS.some((s) => s.id === g.id) && (
                <button className="btn" onClick={() => { logSymptom(person.id, g.id); setMsg("Symptom logged for today."); }}>Log this symptom</button>
              )}
              <button className="btn" onClick={() => { notifyCMO(person.id, `${person.name} reports: ${g.title}`, "yellow"); setMsg("CMO notified."); }}>Notify CMO</button>
              <button className="btn" onClick={() => go("body", { part: g.part })}>Show on body map</button>
              {g.id === "jointpain" && <button className="btn danger" onClick={() => go("emergency")}>Start DCS emergency protocol</button>}
            </div>
            {msg && <p className="muted">{msg}</p>}
            <p className="muted small">Guidance for a prototype, not medical advice.</p>
          </>
        )}
      </div>
    </div>
  );
}
