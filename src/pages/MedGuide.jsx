import React, { useState } from "react";
import {
  MED_GUIDE,
  SYMPTOMS,
  EMERGENCIES,
  CHECKLISTS,
  logSymptom,
  notifyCMO,
  useStore,
} from "../backend/api.js";
import { bodyParts } from "../lib.js";
import { PageTitle, Panel, Icon, Status } from "../components/ConsoleUI.jsx";
export default function MedGuide({ person, go, params = {} }) {
  const state = useStore(),
    [q, setQ] = useState(""),
    [sel, setSel] = useState(params.guide || "headache"),
    [msg, setMsg] = useState("");
  const list = MED_GUIDE.filter((g) =>
    (g.title + " " + g.causes.join(" "))
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const g = MED_GUIDE.find((x) => x.id === sel);
  const logged = state.symptomLog[person.id].filter(
    (s) => s.day === state.mission.day,
  );
  return (
    <div>
      <PageTitle
        eyebrow="Help"
        title="Something's wrong?"
        description="Pick a symptom for possible causes, next steps, and when to get help."
      />
      <button className="fast-help" onClick={() => go("emergency")}>
        <span>
          More than one symptom, or it's serious?
          <small>Fast diagnosis: tap all symptoms and get the most likely causes using live data</small>
        </span>
        <Icon name="arrow" size={28} />
      </button>
      <Panel title="Symptom guides">
        <p className="muted small">The guide for one symptom: causes, self-care and when to escalate.</p>
        <label className="search-field">
          <Icon name="search" />
          <input
            aria-label="Search symptoms"
            placeholder="Search a symptom, like headache or dizziness"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="symptom-directory">
          {list.map((x) => (
            <button
              key={x.id}
              className={"symptom-choice " + (sel === x.id ? "selected" : "")}
              aria-pressed={sel === x.id}
              onClick={() => {
                setSel(x.id);
                setMsg("");
              }}
            >
              {x.title}
            </button>
          ))}
        </div>
        {!list.length && (
          <p className="muted">
            No match. Try another word or contact the medical officer.
          </p>
        )}
        {logged.length > 0 && (
          <p className="small muted">
            Logged today:{" "}
            {[
              ...new Set(
                logged.map(
                  (s) =>
                    SYMPTOMS.find((x) => x.id === s.symptom)?.label ||
                    s.symptom,
                ),
              ),
            ].join(" · ")}
          </p>
        )}
      </Panel>
      {g && (
        <Panel title="Guidance" tone="yellow" className="guidance-panel">
          <div className="row spread">
            <h2>{g.title}</h2>
            <button
              className="btn small"
              onClick={() => go("body", { part: g.part })}
            >
              <Icon name="body" size={16} />
              {bodyParts[g.part].name}
            </button>
          </div>
          <div className="guidance-columns">
            <section>
              <h3 className="eyebrow">Possible causes in space</h3>
              <ul className="quiet-list">
                {g.causes.map((c) => (
                  <li key={c}>
                    <Icon name="orbit" size={16} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="eyebrow">What to do now</h3>
              <ol className="instruction-steps">
                {g.selfCare.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </section>
            <section className="escalation-box">
              <h3 className="eyebrow">
                Escalate to the CMO or flight surgeon if
              </h3>
              <ul className="quiet-list">
                {g.escalate.map((c) => (
                  <li key={c}>
                    <Icon name="alert" size={17} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              {["jointpain", "chest", "breath"].includes(g.id) && (
                <button
                  className="btn danger"
                  onClick={() =>
                    go("emergency", {
                      type:
                        g.id === "jointpain"
                          ? "dcs"
                          : g.id === "breath"
                            ? "hypoxia"
                            : "chest",
                    })
                  }
                >
                  Open emergency protocol <Icon name="arrow" size={16} />
                </button>
              )}
            </section>
          </div>
          <div className="row">
            <button
              className="btn primary"
              onClick={() => {
                logSymptom(person.id, g.id);
                setMsg("Symptom logged for today.");
              }}
            >
              <Icon name="journal" />
              Log this symptom
            </button>
            <button
              className="btn"
              onClick={() => {
                notifyCMO(
                  person.id,
                  person.name + " reports: " + g.title,
                  "yellow",
                );
                setMsg("Medical officer notified.");
              }}
            >
              <Icon name="medical" />
              Notify CMO
            </button>
            <button
              className="btn"
              onClick={() => go("body", { part: g.part })}
            >
              <Icon name="body" />
              Show on body
            </button>
          </div>
          {msg && <p role="status">{msg}</p>}
          <p className="small muted">
            Guidance for a prototype. Not medical advice.
          </p>
        </Panel>
      )}
      <div className="help-resources">
        <Panel title="Emergency protocols">
          <div className="protocol-grid">
            {EMERGENCIES.map((e) => (
              <button
                key={e.id}
                className="protocol-choice"
                onClick={() => go("emergency", { type: e.id })}
              >
                <Icon
                  name={
                    e.id === "spe"
                      ? "sun"
                      : e.id === "co2"
                        ? "air"
                        : "emergency"
                  }
                />
                <b>{e.title}</b>
                <span>{e.when}</span>
                <small>Open protocol →</small>
              </button>
            ))}
          </div>
          <p className="small muted">
            Starting a protocol notifies the medical officer and queues a
            simulated priority report to Earth.
          </p>
        </Panel>
        <Panel title="Med kit">
          <table className="table compact-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {state.medkit.slice(0, 8).map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>
                    <Status status={m.stock <= m.min ? "yellow" : "green"}>
                      {m.stock}
                      {m.stock <= m.min ? " · Low" : ""}
                    </Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn full-width" onClick={() => go("medkit")}>
            Open med kit <Icon name="arrow" size={16} />
          </button>
        </Panel>
        <Panel title="Checklists">
          {CHECKLISTS.map((c) => (
            <button
              className="resource-link"
              key={c.id}
              onClick={() => go("checklists", { list: c.id })}
            >
              <Icon name="today" />
              <span>
                <b>{c.title}</b>
                <small>
                  {
                    Object.values(
                      state.checklists[person.id][c.id] || {},
                    ).filter(Boolean).length
                  }{" "}
                  of {c.items.length} complete
                </small>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </Panel>
      </div>
    </div>
  );
}
