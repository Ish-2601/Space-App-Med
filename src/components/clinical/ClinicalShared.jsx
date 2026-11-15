import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../backend/store.js";
import {
  clinicalRecords,
  latestClinicalRecord,
  saveClinicalRecord,
} from "../../backend/clinicalStore.js";
import { sandboxEnabled, saveSandboxRecord } from "../../backend/sandbox.js";
import { CLINICAL_SOURCES } from "../../backend/clinicalModels.js";
import { Panel } from "../ConsoleUI.jsx";

export function useClinicalForm(pid, module, defaults) {
  const state = useStore();
  const [values, setValues] = useState(() => ({
    ...defaults,
    ...(latestClinicalRecord(state, pid, module)?.payload || {}),
  }));
  const [message, setMessage] = useState("");
  const dirty = useRef(false);
  const latestValues = useRef(values);
  latestValues.current = values;
  const change = (key, value) => {
    dirty.current = true;
    setValues((old) => ({ ...old, [key]: value }));
    setMessage("");
  };
  const privateMode = sandboxEnabled(state);
  useEffect(() => {
    if (!privateMode || !dirty.current) return;
    const timer = setTimeout(
      () =>
        saveSandboxRecord(pid, "clinical:" + module, values, { draft: true }),
      500,
    );
    return () => clearTimeout(timer);
  }, [values, pid, module, privateMode]);
  useEffect(
    () => () => {
      if (privateMode && dirty.current)
        saveSandboxRecord(pid, "clinical:" + module, latestValues.current, {
          draft: true,
        });
    },
    [pid, module, privateMode],
  );
  function save(extra = {}) {
    const record = saveClinicalRecord(pid, module, { ...values, ...extra });
    dirty.current = false;
    setValues((old) => ({ ...old, ...extra }));
    setMessage(
      privateMode
        ? "Saved in Private Sandbox only."
        : "Saved to this crew member's local clinical log.",
    );
    return record;
  }
  return { state, values, change, save, message, setMessage };
}
export function Field({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = "any",
  type = "number",
  options,
  ...rest
}) {
  return (
    <label className="clinical-field">
      {label}
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          {...rest}
        >
          {options.map((option) => (
            <option
              key={typeof option === "string" ? option : option.value}
              value={typeof option === "string" ? option : option.value}
            >
              {typeof option === "string" ? option : option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          maxLength={1500}
          onChange={(e) => onChange(name, e.target.value)}
          {...rest}
        />
      ) : (
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(name, e.target.value)}
          {...rest}
        />
      )}
    </label>
  );
}
export function Source({ id }) {
  const source = CLINICAL_SOURCES[id];
  return source ? (
    <a
      className="clinical-source"
      href={source[1]}
      target="_blank"
      rel="noreferrer"
    >
      {source[0]} ↗
    </a>
  ) : null;
}
export function History({ pid, module }) {
  const state = useStore(),
    records = clinicalRecords(state, pid, module).slice(0, 4);
  return records.length ? (
    <details className="clinical-history">
      <summary>Recent saved records ({records.length})</summary>
      <ol>
        {records.map((r) => (
          <li key={r.id}>
            Day {r.day} · {r.payload.summary || "Assessment recorded"}
            <span className="muted">
              {" "}
              ·{" "}
              {new Date(r.ts).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ol>
    </details>
  ) : null;
}
export function Tool({ title, children, source, note }) {
  return (
    <Panel
      title={title}
      className="clinical-tool"
      id={
        "tool-" +
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      }
    >
      <div className="clinical-tool-content">
        {children}
        {note && <p className="small muted clinical-model-note">{note}</p>}
        {source && <Source id={source} />}
      </div>
    </Panel>
  );
}
export function SavedForm({
  pid,
  module,
  title,
  defaults,
  fields,
  compute,
  render,
  source,
  note,
  children,
}) {
  const form = useClinicalForm(pid, module, defaults);
  let result = null,
    invalid = "";
  try {
    result = compute ? compute(form.values) : form.values;
  } catch (err) {
    invalid = err.message;
  }
  return (
    <Tool title={title} source={source} note={note}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (invalid) return form.setMessage(invalid);
          try {
            form.save({ summary: result.summary || title });
          } catch (err) {
            form.setMessage(err.message);
          }
        }}
      >
        <div className="clinical-fields">
          {fields.map((f) => (
            <Field
              key={f.name}
              {...f}
              value={form.values[f.name]}
              onChange={form.change}
              required
            />
          ))}
        </div>
        {render && result && render(result, form.values, form.change)}
        {children && children(form, result)}
        {invalid && (
          <p className="small" role="status">
            {invalid}
          </p>
        )}
        <button className="btn" type="submit" disabled={!!invalid}>
          Save assessment
        </button>
        {form.message && <p role="status">{form.message}</p>}
      </form>
      <History pid={pid} module={module} />
    </Tool>
  );
}
export function Gauge({ score, label }) {
  return (
    <div className="clinical-gauge">
      <strong>
        {score}
        <small>/100</small>
      </strong>
      <div>
        <span>{label}</span>
        <meter min="0" max="100" value={score} aria-label={label} />
        <small>Illustrative index · not a probability or diagnosis</small>
      </div>
    </div>
  );
}
export function Checklist({ items, values, change }) {
  return (
    <div className="clinical-checklist">
      {items.map(([id, text]) => (
        <label key={id}>
          <input
            type="checkbox"
            checked={!!values[id]}
            onChange={(e) => change(id, e.target.checked)}
          />
          {text}
        </label>
      ))}
    </div>
  );
}
export function useTick(active, interval = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [active, interval]);
  return now;
}
