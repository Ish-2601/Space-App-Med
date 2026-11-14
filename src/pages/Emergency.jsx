import React from "react";
import { useStore, EMERGENCIES, activeEmergencies, startEmergency, toggleEmergencyStep, resolveEmergency } from "../backend/api.js";

export default function Emergency({ person }) {
  const state = useStore();
  const pid = person.id;
  const active = activeEmergencies(state, pid);
  const past = state.emergencies.filter((e) => e.pid === pid && e.resolvedAt);

  return (
    <div>
      <h2 className="danger-text">🚨 Emergency</h2>
      <p>Starting a protocol alerts the crew medical officer immediately and sends a priority report to Earth. With a long Earth delay, the crew acts first.</p>

      {active.map((em) => {
        const def = EMERGENCIES.find((e) => e.id === em.type);
        const done = def.steps.filter((_, i) => em.stepsDone[i]).length;
        return (
          <div key={em.id} className="alert red">
            <h3>{em.title} · in progress</h3>
            <div className="small">Started {new Date(em.startedAt).toLocaleTimeString()} · {done}/{def.steps.length} steps</div>
            {def.steps.map((s, i) => (
              <label key={s} className="radio block big-check">
                <input type="checkbox" checked={!!em.stepsDone[i]} onChange={() => toggleEmergencyStep(em.id, i)} /> {i + 1}. {s}
              </label>
            ))}
            <button className="btn" onClick={() => resolveEmergency(em.id)}>Mark resolved</button>
          </div>
        );
      })}

      <h3>Start a protocol</h3>
      <div className="grid2">
        {EMERGENCIES.map((e) => (
          <div key={e.id} className="card">
            <h3>{e.title}</h3>
            <p className="small">{e.when}</p>
            <button className="btn danger" onClick={() => startEmergency(pid, e.id)}>Start protocol</button>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h3>Resolved</h3>
          <ul>{past.map((e) => <li key={e.id}>{e.title} · {new Date(e.startedAt).toLocaleTimeString()}–{new Date(e.resolvedAt).toLocaleTimeString()}</li>)}</ul>
        </>
      )}
    </div>
  );
}
