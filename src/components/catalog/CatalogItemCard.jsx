import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../backend/store.js";
import { sandboxEnabled } from "../../backend/sandbox.js";
import { latestClinicalRecord } from "../../backend/clinicalStore.js";
import {
  catalogActionFor,
  catalogDisplayName,
  catalogHistory,
  catalogStock,
  CATALOG_ACTION_LABELS,
  logCatalogAction,
  saveCatalogDraft,
} from "../../backend/catalog.js";
import {
  getCatalogModule,
  launchCatalogModule,
} from "../../backend/catalogModules.js";
import CatalogModuleModal from "./CatalogModuleModal.jsx";
import { HEALTH_AREAS } from "../../data/healthAreas.js";

export function CatalogUsageDialog({ item, person, onClose }) {
  const state = useStore(),
    dialog = useRef(null),
    action = catalogActionFor(item);
  const previous = latestClinicalRecord(
    state,
    person.id,
    "catalog-draft-" + item.id,
  );
  const completed = catalogHistory(state, person.id, item.id)[0];
  const [values, setValues] = useState(() =>
    previous && (!completed || previous.ts > completed.ts)
      ? previous.payload
      : {
          quantity: 1,
          minutes: 10,
          result: action === "check" ? "ready" : "completed",
          note: "",
          authorized: false,
          setupConfirmed: false,
        },
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const edit = (key, value) => {
    const next = { ...values, [key]: value };
    setValues(next);
    setError("");
    try {
      saveCatalogDraft(person.id, item.id, next);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <dialog
      ref={dialog}
      className={
        "catalog-dialog" + (sandboxEnabled(state) ? " is-private" : "")
      }
      aria-labelledby={`catalog-action-${item.id}`}
      onCancel={onClose}
    >
      <div className="catalog-dialog-heading">
        <p className="eyebrow">
          #{item.code} ·{" "}
          {sandboxEnabled(state) ? "Private Sandbox" : "Onboard catalog log"}
        </p>
        <button
          className="btn small"
          onClick={onClose}
          aria-label="Close catalog action"
        >
          Close ×
        </button>
      </div>
      <h2 id={`catalog-action-${item.id}`}>{catalogDisplayName(item.name)}</h2>
      {saved ? (
        <div role="status" className="catalog-success">
          <b>
            {sandboxEnabled(state)
              ? "Saved privately."
              : "Saved to your local catalog history."}
          </b>
          <p>
            {action === "dispense"
              ? `${saved.payload.quantity} inventory unit(s) logged. ${catalogStock(state, item.id, person.id)} simulated units remain.`
              : action === "log"
                ? `${saved.payload.minutes} minutes · ${saved.payload.result}.`
                : `Equipment check: ${saved.payload.result}.`}
          </p>
          <p>
            No clinical readings, crew scores or Earth reports were changed.
          </p>
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setSaved(logCatalogAction(person.id, item.id, values));
              setError("");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <p className="catalog-notice">
            Prototype inventory rehearsal. Stock units are packages or devices,
            never a prescribed dose. Follow the mission-approved procedure for
            actual use.
          </p>
          {action === "dispense" && (
            <>
              <label>
                Inventory units
                <input
                  type="number"
                  min="1"
                  max={catalogStock(state, item.id, person.id)}
                  step="1"
                  required
                  value={values.quantity}
                  onChange={(e) => edit("quantity", e.target.value)}
                />
              </label>
              <p className="small muted">
                {catalogStock(state, item.id, person.id)} units available
                {sandboxEnabled(state)
                  ? " in your private inventory simulation"
                  : " in the shared catalog simulation"}
                .
              </p>
              {item.itemType === "Medication" && (
                <label className="catalog-check">
                  <input
                    type="checkbox"
                    checked={values.authorized}
                    onChange={(e) => edit("authorized", e.target.checked)}
                    required
                  />
                  This is an inventory rehearsal or an already approved medical
                  plan. I am not using the catalog to choose a medicine or dose.
                </label>
              )}
            </>
          )}
          {action === "log" && (
            <>
              <label>
                Session duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="480"
                  step="1"
                  required
                  value={values.minutes}
                  onChange={(e) => edit("minutes", e.target.value)}
                />
              </label>
              <label>
                Session outcome
                <select
                  value={values.result}
                  onChange={(e) => edit("result", e.target.value)}
                >
                  <option value="completed">Completed</option>
                  <option value="adapted">Adapted for recovery</option>
                  <option value="stopped">Stopped and recorded</option>
                </select>
              </label>
            </>
          )}
          {action === "check" && (
            <>
              <label className="catalog-check">
                <input
                  type="checkbox"
                  required
                  checked={values.setupConfirmed}
                  onChange={(e) => edit("setupConfirmed", e.target.checked)}
                />
                I checked the label, containment, power or expiry as applicable,
                and the approved setup instructions.
              </label>
              <label>
                Equipment check result
                <select
                  value={values.result}
                  onChange={(e) => edit("result", e.target.value)}
                >
                  <option value="ready">Ready for the approved workflow</option>
                  <option value="review">Needs crew review</option>
                  <option value="unavailable">
                    Unavailable or not serviceable
                  </option>
                </select>
              </label>
              <p className="small muted">
                This checklist does not operate or certify the physical device.
              </p>
            </>
          )}
          <label>
            Usage or check note
            <textarea
              maxLength="2000"
              rows="3"
              value={values.note}
              onChange={(e) => edit("note", e.target.value)}
              placeholder="Optional context for your local record"
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="catalog-actions">
            <button className="btn primary" type="submit">
              Save {sandboxEnabled(state) ? "private " : ""}
              {action === "dispense"
                ? "usage"
                : action === "log"
                  ? "session"
                  : "check"}
            </button>
            <button className="btn" type="button" onClick={onClose}>
              Close and keep draft
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

export default function CatalogItemCard({ item, person, go, compact = false }) {
  const state = useStore(),
    action = catalogActionFor(item);
  const [open, setOpen] = useState(false),
    [moduleOpen, setModuleOpen] = useState(false),
    [message, setMessage] = useState("");
  const latest = catalogHistory(state, person.id, item.id)[0];
  const launchNotice =
    action === "launch" ? getCatalogModule(item.id)?.launchNotice : "";
  const activate = () => {
    if (action !== "launch") {
      setOpen(true);
      return;
    }
    try {
      const result = launchCatalogModule(item.id, { pid: person.id, go });
      if (result?.standalone) setModuleOpen(true);
      else if (result?.message) setMessage(result.message);
    } catch (err) {
      setMessage(err.message);
    }
  };
  return (
    <article
      className={`catalog-item-card${compact ? " compact" : ""}`}
      data-catalog-id={item.id}
    >
      <div className="catalog-card-top">
        <span className="catalog-code">#{item.code}</span>
        <span
          className={`catalog-pack pack-${item.nasaPackColor.toLowerCase()}`}
        >
          {item.nasaPackColor} pack · demo
        </span>
      </div>
      <p className="catalog-type">
        {item.itemType} ·{" "}
        {HEALTH_AREAS[item.linkedBodySystem]?.short || "Mission health"}
      </p>
      <h3>{catalogDisplayName(item.name)}</h3>
      <p>{item.whyNeeded}</p>
      <details className="catalog-item-details">
        <summary>Storage, microgravity and catalog details</summary>
        <dl>
          <dt>Domain</dt>
          <dd>{item.category}</dd>
          <dt>Microgravity note</dt>
          <dd>{item.microgravityNote}</dd>
          <dt>Radiation / storage</dt>
          <dd>{item.radiationSensitivity}</dd>
          <dt>Source</dt>
          <dd>
            User-supplied concept catalog. Inclusion does not establish flight
            qualification, availability or clinical benefit.
          </dd>
        </dl>
      </details>
      <div className="catalog-stock">
        {action === "dispense" ? (
          <>
            <b>{catalogStock(state, item.id, person.id)}</b> simulated units
            left
          </>
        ) : action === "launch" ? (
          "Interactive app module"
        ) : (
          "Reusable equipment or countermeasure"
        )}
      </div>
      {latest && (
        <p className="small muted">
          Last {latest.payload.action}: mission day {latest.day}
          {latest.private ? " · private" : ""}
        </p>
      )}
      {launchNotice && <p className="catalog-launch-notice">{launchNotice}</p>}
      <button className="btn catalog-card-action" onClick={activate}>
        {CATALOG_ACTION_LABELS[action]} <span aria-hidden="true">→</span>
      </button>
      {action !== "launch" && (
        <button
          className="text-link catalog-related-link"
          onClick={() =>
            go(
              item.targetRoute,
              item.targetRoute === "medkit"
                ? { catalogFocus: "medkit-inventory" }
                : {},
            )
          }
        >
          Open related mission tool →
        </button>
      )}
      {message && (
        <p role="status" className="small">
          {message}
        </p>
      )}
      {open && (
        <CatalogUsageDialog
          item={item}
          person={person}
          onClose={() => setOpen(false)}
        />
      )}
      {moduleOpen && (
        <CatalogModuleModal
          item={item}
          person={person}
          go={go}
          onClose={() => setModuleOpen(false)}
        />
      )}
    </article>
  );
}
