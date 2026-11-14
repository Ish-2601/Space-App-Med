import React from "react";
import { useStore, CHECKLISTS, toggleChecklistItem, resetChecklist } from "../backend/api.js";

export default function Checklists({ person }) {
  const state = useStore();
  const pid = person.id;
  return (
    <div>
      <h2>Checklists</h2>
      <p className="muted">Readiness checks for spacewalks and gravity transitions (landing on the Moon, Mars or Earth).</p>
      <div className="grid3">
        {CHECKLISTS.map((list) => {
          const done = state.checklists[pid][list.id] || {};
          const count = list.items.filter((_, i) => done[i]).length;
          return (
            <div key={list.id} className="card">
              <h3>{list.title}</h3>
              <div className="muted small">{count}/{list.items.length} done{count === list.items.length ? " · ready ✅" : ""}</div>
              {list.items.map((item, i) => (
                <label key={item} className="radio block">
                  <input type="checkbox" checked={!!done[i]} onChange={() => toggleChecklistItem(pid, list.id, i)} /> {item}
                </label>
              ))}
              <button className="btn small" onClick={() => resetChecklist(pid, list.id)}>Reset</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
