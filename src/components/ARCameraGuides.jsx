import React, { useEffect, useRef, useState } from "react";
import { AR_GUIDES, guideAlignment } from "../backend/arGuides.js";
import { useStore } from "../backend/store.js";
import {
  latestClinicalRecord,
  saveClinicalRecord,
} from "../backend/clinicalStore.js";
import { sandboxEnabled } from "../backend/sandbox.js";
import { Panel, Icon, Status } from "./ConsoleUI.jsx";

export function PulseROIOverlay({ visible = true }) {
  return (
    visible && (
      <svg
        className="ar-pulse-overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="Forehead and cheek pulse sampling regions"
        role="img"
      >
        <rect x="38" y="12" width="24" height="18" rx="2" />
        <rect
          x="23"
          y="40"
          width="15"
          height="18"
          rx="2"
          className="ar-cheek"
        />
        <rect
          x="62"
          y="40"
          width="15"
          height="18"
          rx="2"
          className="ar-cheek"
        />
        <text x="50" y="9" textAnchor="middle">
          FOREHEAD · ACTIVE ROI
        </text>
        <text x="50" y="65" textAnchor="middle">
          CHEEKS · POSITIONING GUIDE
        </text>
      </svg>
    )
  );
}

export default function ARCameraGuides({ person, onPulse, initialGuide }) {
  const state = useStore();
  const saved = latestClinicalRecord(state, person.id, "ar-guides", {
    includeDrafts: true,
  })?.payload;
  const [values, setValues] = useState(() => ({
    ...(saved || { guide: "onsd", x: 30, y: 65, angle: -15, overlay: true }),
    ...(AR_GUIDES[initialGuide] ? { guide: initialGuide } : {}),
  }));
  const [active, setActive] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const video = useRef(null),
    stream = useRef(null),
    generation = useRef(0);
  const guide = AR_GUIDES[values.guide] || AR_GUIDES.onsd;
  const result = guideAlignment(values.guide, values);
  function change(patch) {
    const next = { ...values, ...patch };
    setValues(next);
    saveClinicalRecord(person.id, "ar-guides", next, { draft: true });
    setMessage("");
  }
  function stopCamera() {
    generation.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setActive(false);
    setPending(false);
  }
  useEffect(
    () => () => {
      generation.current++;
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "No camera API is available. The interactive simulation remains available.",
      );
      return;
    }
    setPending(true);
    setMessage("");
    const request = ++generation.current;
    try {
      const feed = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (request !== generation.current) {
        feed.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = feed;
      video.current.srcObject = feed;
      await video.current.play().catch(() => {});
      if (request !== generation.current) return;
      setActive(true);
      setPending(false);
    } catch (error) {
      if (request !== generation.current) return;
      setPending(false);
      setMessage(
        error.name === "NotAllowedError"
          ? "Camera permission was declined. Continue with the simulation controls."
          : "Camera unavailable. Continue with the simulation controls.",
      );
    }
  }
  function place(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    change({
      x: Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100),
        ),
      ),
      y: Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100),
        ),
      ),
    });
  }
  return (
    <Panel
      title="AR camera alignment guides"
      className="ar-guides"
      id="ar-guides"
    >
      <p className="muted">
        Practise positioning before a self-check. Camera frames stay on this
        device; only the manual alignment settings are saved.
      </p>
      <div className="ar-guide-tabs" role="group" aria-label="Choose AR guide">
        {Object.entries(AR_GUIDES).map(([id, entry]) => (
          <button
            key={id}
            className="btn"
            aria-pressed={values.guide === id}
            onClick={() => change({ guide: id })}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <div className="ar-workspace">
        <div>
          <div className={"ar-camera " + (result.aligned ? "ar-aligned" : "")}>
            <video ref={video} playsInline muted hidden={!active} />
            <svg
              viewBox="0 0 400 300"
              role="img"
              aria-label={
                values.guide === "bladder"
                  ? "Torso, pelvis and bladder training diagram, not anatomical scale; tap to move the guide, or use the sliders"
                  : "Head alignment simulation; tap to move the guide, or use the sliders"
              }
              onPointerDown={place}
            >
              {!active && (
                <g className="ar-demo-anatomy">
                  {values.guide === "bladder" ? (
                    <>
                      <path d="M160 35Q145 55 115 70L130 130Q143 160 120 198Q105 230 125 260H175L200 232L225 260H275Q295 230 280 198Q257 160 270 130L285 70Q255 55 240 35" />
                      <path d="M147 165Q135 194 151 219L186 234M253 165Q265 194 249 219L214 234M147 165Q172 177 181 192M253 165Q228 177 219 192" />
                      <path d="M175 197Q174 179 200 184Q226 179 225 197Q223 220 200 224Q177 220 175 197ZM200 224V239" />
                      <circle cx="200" cy="145" r="3" />
                      <text x="15" y="58">
                        TORSO / PELVIS
                      </text>
                      <text x="248" y="205">
                        BLADDER
                      </text>
                      <text x="15" y="294">
                        TRAINING DIAGRAM · NOT ANATOMICAL SCALE
                      </text>
                    </>
                  ) : (
                    <>
                      <path d="M95 300Q100 220 155 210L160 185Q135 160 140 100Q145 45 200 40Q255 45 260 100Q265 160 240 185L245 210Q300 220 305 300" />
                      <ellipse cx="177" cy="126" rx="15" ry="9" />
                      <ellipse cx="223" cy="126" rx="15" ry="9" />
                      <path d="M190 160Q200 165 210 160M180 180Q200 190 220 180" />
                    </>
                  )}
                  <text x="15" y="280">
                    SIMULATED · MANUAL POSITIONING
                  </text>
                </g>
              )}
              {values.overlay && (
                <g className="ar-reticle">
                  <circle
                    cx={guide.targetX * 4}
                    cy={guide.targetY * 3}
                    r="24"
                    className="ar-target"
                  />
                  <path
                    d={`M${guide.targetX * 4 - 36} ${guide.targetY * 3}h72M${guide.targetX * 4} ${guide.targetY * 3 - 36}v72`}
                    className="ar-target"
                  />
                  <g
                    transform={`translate(${values.x * 4} ${values.y * 3}) rotate(${values.angle})`}
                  >
                    {guide.kind === "probe" && (
                      <>
                        <path d="M-12 -65h24v45l-7 12H-5l-7-12Z" />
                        <path d="M-30 12Q0 30 30 12M-40 25Q0 50 40 25" />
                      </>
                    )}
                    {guide.kind === "eyes" && (
                      <>
                        <circle cx="-24" cy="0" r="18" />
                        <circle cx="24" cy="0" r="18" />
                        <circle cx="-24" cy="0" r="7" />
                        <circle cx="24" cy="0" r="7" />
                        <path d="M-6 0H6" />
                      </>
                    )}
                    {guide.kind === "pulse" && (
                      <>
                        <rect x="-42" y="-28" width="84" height="40" rx="4" />
                        <rect x="-65" y="38" width="28" height="34" rx="4" />
                        <rect x="37" y="38" width="28" height="34" rx="4" />
                      </>
                    )}
                  </g>
                </g>
              )}
            </svg>
            <span className="ar-feed-label">
              {active
                ? "Live camera · manual guide"
                : "Interactive simulation · camera off"}
            </span>
          </div>
          <div className="row ar-camera-actions">
            <button
              className="btn"
              onClick={active || pending ? stopCamera : startCamera}
            >
              <Icon name="camera" />
              {pending
                ? "Cancel camera request"
                : active
                  ? "Stop camera"
                  : "Enable camera"}
            </button>
            <label className="radio">
              <input
                type="checkbox"
                checked={values.overlay}
                onChange={(event) => change({ overlay: event.target.checked })}
              />
              Show alignment reticle
            </label>
          </div>
        </div>
        <div className="ar-controls">
          <h3>{guide.title}</h3>
          <Status status={result.aligned ? "green" : "info"}>
            {result.aligned
              ? "Geometrically aligned"
              : "Adjust position and angle"}
          </Status>
          <p className="small muted">
            Green means the manual marker matches this training target. It does
            not validate probe contact, imaging safety, anatomy or signal
            quality.
          </p>
          {[
            ["x", "Horizontal position", 0, 100, "%"],
            ["y", "Vertical position", 0, 100, "%"],
            ["angle", "Guide angle", -45, 45, "°"],
          ].map(([key, label, min, max, unit]) => (
            <label key={key}>
              {label}{" "}
              <b>
                {values[key]}
                {unit}
              </b>
              <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                value={values[key]}
                onChange={(event) =>
                  change({ [key]: Number(event.target.value) })
                }
              />
            </label>
          ))}
          <p className="small">
            Training target: {guide.targetX}% across · {guide.targetY}% down ·{" "}
            {guide.angle}°. These coordinates describe this drawing, not a
            clinical scan prescription.
          </p>
          <button
            className="btn primary"
            onClick={() => {
              saveClinicalRecord(person.id, "ar-guides", {
                ...values,
                aligned: result.aligned,
                source: active ? "camera-manual" : "simulation",
              });
              setMessage(
                sandboxEnabled()
                  ? "Alignment saved privately. No clinical measurement or crew score changed."
                  : "Alignment saved. No clinical measurement or crew score changed.",
              );
            }}
          >
            Save positioning rehearsal
          </button>
          {values.guide === "pulse" && onPulse && (
            <button
              className="btn"
              onClick={() => {
                stopCamera();
                onPulse();
              }}
            >
              Open camera pulse self-check
            </button>
          )}
        </div>
      </div>
      {message && <p role="status">{message}</p>}
      <p className="alert info small">{guide.note}</p>
      <a
        className="small"
        href="https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf"
        target="_blank"
        rel="noreferrer"
      >
        NASA SANS examinations and crew training
      </a>
    </Panel>
  );
}
