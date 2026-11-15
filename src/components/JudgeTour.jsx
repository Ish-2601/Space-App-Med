import React, { useState } from "react";
import { Icon } from "./ConsoleUI.jsx";

// A short guided tour for first-time visitors and hackathon judges: one tap jumps to each highlight.
export const TOUR = [
  { page: "today", params: { catalogFocus: "wearables" }, title: "Home", text: "Health ring, top 3 next steps, wearable sync and the 5-second Quick Pulse." },
  { page: "body", params: { catalogFocus: "body-anatomy" }, title: "Body", text: "Interactive anatomy with live status badges, plus fluid-shift and EVA layers." },
  { page: "checks", params: {}, title: "Self-checks", text: "Camera heart rate, Amsler grid, near-vision chart, reaction test and hearing check." },
  { page: "emergency", params: {}, title: "Emergency", text: "Tap symptoms for ranked causes from live data, then run a step-by-step protocol." },
  { page: "crew", params: { catalogFocus: "crew-readiness" }, title: "CMO & Earth link", text: "Whole-crew readiness, notifications and the delayed Earth message queue." },
  { page: "catalog", params: {}, title: "1,000-item catalog", text: "Every spaceflight tool, test and countermeasure, searchable with jump links." },
];

export default function JudgeTour({ go }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const jump = (i) => {
    setStep(i);
    go(TOUR[i].page, TOUR[i].params);
  };
  return (
    <>
      <button className="tour-pill" aria-label="Judge tour" aria-expanded={open} onClick={() => (open ? setOpen(false) : (setOpen(true), jump(step)))}>
        <Icon name="star" size={16} /> <span className="tour-label">Judge tour</span>
      </button>
      {open && (
        <div className="tour-bar" role="dialog" aria-label="Guided tour">
          <div className="tour-head">
            <span className="micro-label">Guided tour · {step + 1} of {TOUR.length}</span>
            <button className="icon-button tour-close" aria-label="Close tour" onClick={() => setOpen(false)}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className="tour-text">
            <b>{TOUR[step].title}.</b> {TOUR[step].text}
          </p>
          <div className="tour-steps">
            {TOUR.map((t, i) => (
              <button key={t.title} className={"chip" + (i === step ? " on" : "")} aria-current={i === step ? "step" : undefined} onClick={() => jump(i)}>
                {i + 1}. {t.title}
              </button>
            ))}
          </div>
          <div className="tour-nav">
            <button className="btn" disabled={step === 0} onClick={() => jump(step - 1)}>Back</button>
            {step < TOUR.length - 1 ? (
              <button className="btn primary" onClick={() => jump(step + 1)}>
                Next: {TOUR[step + 1].title} <Icon name="arrow" size={16} />
              </button>
            ) : (
              <button className="btn primary" onClick={() => { setOpen(false); go("tutorial"); }}>
                Finish: open full tutorial <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
