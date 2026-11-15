import React, { useRef, useState } from "react";
import { saveTest } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";
const N = 20;
export default function AmslerGrid({ person, onSaved }) {
  const [eye, setEye] = useState("left"),
    [marks, setMarks] = useState({ left: [], right: [] }),
    [saved, setSaved] = useState(null),
    [focus, setFocus] = useState(210);
  const cells = useRef([]);
  const toggle = (i) =>
    setMarks((m) => ({
      ...m,
      [eye]: m[eye].includes(i)
        ? m[eye].filter((x) => x !== i)
        : [...m[eye], i],
    }));
  function finish() {
    if (eye === "left") setEye("right");
    else {
      setSaved(saveTest(person.id, "amsler", marks));
      onSaved?.();
    }
  }
  function move(e, i) {
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: N, ArrowUp: -N }[
      e.key
    ];
    if (delta !== undefined) {
      e.preventDefault();
      const next = Math.max(0, Math.min(N * N - 1, i + delta));
      setFocus(next);
      cells.current[next]?.focus();
    }
  }
  if (saved)
    return (
      <div className="measurement-complete" role="status">
        <Icon name="check" size={40} />
        <h2>Amsler grid saved</h2>
        <Status status={saved.status} />
        <p>{saved.summary}</p>
        {saved.status !== "green" && (
          <p className="muted">
            The medical officer has been notified. Review your eye status on the
            body map.
          </p>
        )}
        <button
          className="btn"
          onClick={() => {
            setSaved(null);
            setMarks({ left: [], right: [] });
            setEye("left");
          }}
        >
          Test again
        </button>
      </div>
    );
  return (
    <div>
      <div className="row spread amsler-heading">
        <h2>Testing {eye} eye</h2>
        <span className="muted small">Eye {eye === "left" ? 1 : 2} of 2</span>
      </div>
      <p className="muted small">
        Cover your <b>{eye === "left" ? "right" : "left"}</b> eye. Keep looking
        at the centre dot.
      </p>
      <div
        className="amsler"
        role="group"
        aria-label={"Amsler grid, " + eye + " eye"}
      >
        {Array.from({ length: N * N }, (_, i) => (
          <button
            key={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            className={
              "amsler-cell" + (marks[eye].includes(i) ? " marked" : "")
            }
            tabIndex={focus === i ? 0 : -1}
            onFocus={() => setFocus(i)}
            onKeyDown={(e) => move(e, i)}
            onClick={() => toggle(i)}
            aria-label={
              "Row " + (Math.floor(i / N) + 1) + ", column " + ((i % N) + 1)
            }
            aria-pressed={marks[eye].includes(i)}
          />
        ))}
        <div className="amsler-dot" />
      </div>
      <div className="row spread">
        <p className="muted small">
          <b>{marks[eye].length}</b> squares marked · {eye} eye
        </p>
        <button
          className="text-button"
          onClick={() => setMarks({ ...marks, [eye]: [] })}
        >
          <Icon name="refresh" size={16} />
          Clear
        </button>
      </div>
      {marks[eye].length > 0 && (
        <p className="alert yellow small">
          Distortion marked. Saving both eyes will add this result to your
          record and notify the medical officer.
        </p>
      )}
      <div className="row spread">
        {eye === "right" && (
          <button className="text-button" onClick={() => setEye("left")}>
            <Icon name="back" size={15} />
            Review left eye
          </button>
        )}
        <button className="btn primary full-width" onClick={finish}>
          {eye === "left"
            ? "Done with left eye · test right eye"
            : "Done with right eye · save result"}
          <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}
