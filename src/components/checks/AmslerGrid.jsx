import React, { useRef, useState } from "react";
import { saveTest } from "../../backend/api.js";
import { Icon, Status } from "../ConsoleUI.jsx";
const N = 20;

// Every grid square on a straight line from square a to square b (Bresenham), including both ends.
export function lineBetween(a, b, n = N) {
  let [r0, c0] = [Math.floor(a / n), a % n];
  const [r1, c1] = [Math.floor(b / n), b % n];
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dc - dr;
  const out = [];
  for (;;) {
    out.push(r0 * n + c0);
    if (r0 === r1 && c0 === c1) return out;
    const e2 = 2 * err;
    if (e2 > -dr) (err -= dr, (c0 += sc));
    if (e2 < dc) (err += dc, (r0 += sr));
  }
}
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

  // Click-and-drag marking (mouse, pen or finger). The first square decides the mode:
  // pressing on an empty square paints marks, pressing on a marked square erases them.
  const drag = useRef(null); // { on: boolean, last: index } while the pointer is held down
  const setCells = (list, on) =>
    setMarks((m) => {
      const cur = new Set(m[eye]);
      let changed = false;
      for (const i of list) {
        if (on && !cur.has(i)) (cur.add(i), (changed = true));
        if (!on && cur.has(i)) (cur.delete(i), (changed = true));
      }
      return changed ? { ...m, [eye]: [...cur] } : m;
    });
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const i = el?.dataset?.cell;
    return i == null ? null : Number(i);
  };
  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return; // left button / touch / pen only
    const i = cellAt(e.clientX, e.clientY);
    if (i == null) return;
    e.preventDefault(); // no text selection or page scroll while drawing
    const on = !marks[eye].includes(i);
    drag.current = { on, last: i };
    setFocus(i);
    setCells([i], on);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i == null || i === d.last) return;
    setCells(lineBetween(d.last, i), d.on); // fill squares a fast movement skipped over
    d.last = i;
  }
  const endDrag = () => (drag.current = null);
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
        Hold the screen about 30–35 cm away. Cover your{" "}
        <b>{eye === "left" ? "right" : "left"}</b> eye. Keep looking at the
        centre dot.
      </p>
      <div
        className="amsler"
        role="group"
        aria-label={"Amsler grid, " + eye + " eye"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {Array.from({ length: N * N }, (_, i) => (
          <button
            key={i}
            data-cell={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            className={
              "amsler-cell" + (marks[eye].includes(i) ? " marked" : "")
            }
            tabIndex={focus === i ? 0 : -1}
            onFocus={() => setFocus(i)}
            onKeyDown={(e) => move(e, i)}
            // Mouse and touch are handled by the pointer events above;
            // a click with detail 0 comes from the keyboard (Space / Enter).
            onClick={(e) => e.detail === 0 && toggle(i)}
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
