import React from "react";
import {
  useStore,
  CHECKLISTS,
  toggleChecklistItem,
  resetChecklist,
} from "../backend/api.js";
import { PageTitle, Panel, Segments } from "../components/ConsoleUI.jsx";
export default function Checklists({ person, params = {} }) {
  const state = useStore(),
    pid = person.id,
    lists = [...CHECKLISTS].sort(
      (a, b) => (b.id === params.list ? 1 : 0) - (a.id === params.list ? 1 : 0),
    );
  return (
    <div>
      <PageTitle
        eyebrow="Help · Readiness"
        title="Ready for what comes next"
        description="Checklists for spacewalks and gravity transitions."
      />
      <div className="checklist-grid">
        {lists.map((list) => {
          const done = state.checklists[pid][list.id] || {},
            count = list.items.filter((_, i) => done[i]).length;
          return (
            <Panel
              key={list.id}
              id={"checklist-" + list.id}
              title={count === list.items.length ? "Complete" : "Checklist"}
              tone={count === list.items.length ? "green" : "neutral"}
            >
              <h2>{list.title}</h2>
              <p className="muted small">
                {count} of {list.items.length} complete
              </p>
              <Segments
                value={count}
                max={list.items.length}
                count={list.items.length}
                label={list.title + " progress"}
                tone="green"
              />
              {list.items.map((item, i) => (
                <div
                  className={"protocol-step " + (done[i] ? "done" : "")}
                  key={item}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={!!done[i]}
                      onChange={() => toggleChecklistItem(pid, list.id, i)}
                    />
                    <span>{item}</span>
                  </label>
                </div>
              ))}
              <button
                className="btn"
                onClick={() => resetChecklist(pid, list.id)}
              >
                Reset checklist
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
