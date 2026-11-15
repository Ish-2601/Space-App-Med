import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./ConsoleUI.jsx";

// First-visit onboarding: a welcome popup, then coach marks that shade the screen, highlight one
// thing at a time and say what to click. Afterwards a small "Tutorial" button stays at the bottom.
//
// Step fields: hash (route to be on), target (CSS selector to highlight), title, text,
// click (selector the user must click to continue; omit for a "Next" step), placement hint.
export const TOUR_STEPS = [
  { hash: "#/", target: ".crew-grid", title: "Meet your crew", text: "Four astronauts on a Mars-transit mission. Each card shows a health score and what needs attention." },
  { hash: "#/", target: ".crew-card:has(#crew-name-okafor)", click: ".crew-card:has(#crew-name-okafor) .crew-name, .crew-card:has(#crew-name-okafor) .crew-avatar", title: "Open T. Okafor", text: "Click T. Okafor's name to open his personal health app." },
  { hash: "#/okafor/today", target: ".telemetry-ribbon", title: "Mission at a glance", text: "Mission day, gravity, the Earth message delay and cabin air. Green dots are fine; amber and red need a look." },
  { hash: "#/okafor/today", target: ".hero-card", title: "Health score", text: "One score out of 100. It drops for each reading, symptom or check outside its range. The big button is the most useful thing to do now." },
  { hash: "#/okafor/today", target: ".next-steps", title: "Do this next", text: "The top 3 tasks, most urgent first, with how long each takes. Okafor's first task is to recheck his blood pressure." },
  { hash: "#/okafor/today", target: ".segmented", click: ".segmented button:nth-child(2)", title: "Switch sections", text: "Home keeps details tucked into tabs. Click “Live vitals & wearables”." },
  { hash: "#/okafor/today", target: ".vitals-grid", title: "Live vitals", text: "Every vital compared with Okafor's own baseline, with a 7-day trend line. Tap any card for the full chart." },
  { hash: "#/okafor/today", target: ".dock-pages .dock-item:nth-child(2)", click: ".dock-pages .dock-item:nth-child(2)", title: "Go to Body", text: "The bottom bar is always there. Click Body." },
  { hash: "#/okafor/body", target: ".bm-stage", title: "Body map", text: "Each badge is a body system: ✓ all good, ! needs attention, – not checked. Hover a badge to see its score." },
  { hash: "#/okafor/body", target: '.bm-badge[aria-label^="Eyes"]', click: '.bm-badge[aria-label^="Eyes"]', title: "Open the eyes", text: "Click the badge on the face to open Eyes and vision." },
  { hash: "#/okafor/body-eyes", target: ".console-main .page-title", title: "A body-system screen", text: "Each of the 10 systems has its score, readings, self-checks, guidance and its own specialized tool, here the SANS eye hub." },
  { hash: "#/okafor/body-eyes", target: ".dock-pages .dock-item:nth-child(3)", click: ".dock-pages .dock-item:nth-child(3)", title: "Emergency", text: "Something wrong? Click Emergency." },
  { hash: "#/okafor/emergency", target: ".tile-grid", click: ".tile-grid .tile:first-child", title: "Tap the symptoms", text: "No forms in an emergency, just tap what's happening. Click Headache." },
  { hash: "#/okafor/emergency", target: ".triage-results", title: "Most likely causes", text: "Ranked instantly from the symptoms and Okafor's live data, with why, what to do now, and one-tap protocols." },
  { hash: "#/okafor/emergency", target: ".triage-alert", title: "Alert the crew", text: "One tap alerts the medical officer. Earth is too far away to help in real time. (No need to press it now.)" },
  { hash: "#/okafor/emergency", target: ".tour-pill", title: "Judge tour", text: "A quick 6-stop tour of the highlights is always one click away up here." },
];

const KEY = "nasa-med-onboarding"; // "done" | "skipped"
const readFlag = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return "session";
  }
};
const writeFlag = (v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* storage blocked: the welcome shows again next visit */
  }
};
const PAD = 8;

export default function GuidedTour() {
  const [mode, setMode] = useState(() => (readFlag() ? "idle" : "welcome")); // welcome | touring | finished | idle
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [missing, setMissing] = useState(false);
  const [menu, setMenu] = useState(false);
  const step = TOUR_STEPS[i];
  const raf = useRef(0);
  const card = useRef(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 200 });

  const end = useCallback((flag) => {
    writeFlag(flag);
    setMode(flag === "done" ? "finished" : "idle");
    setRect(null);
  }, []);

  // Go to the step's screen, wait for its target, scroll it into view
  useEffect(() => {
    if (mode !== "touring") return;
    if (step.hash && window.location.hash !== step.hash && !(step.hash === "#/" && (window.location.hash === "" || window.location.hash === "#"))) {
      window.location.hash = step.hash;
    }
    setMissing(false);
    let tries = 0;
    let stopped = false;
    const find = () => {
      if (stopped) return;
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        const fixed = getComputedStyle(el).position === "fixed" || el.closest(".console-dock, .console-topbar");
        if (!fixed && (r.top < 70 || r.bottom > window.innerHeight - 110)) el.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      if (++tries > 40) setMissing(true);
      else setTimeout(find, 100);
    };
    find();
    return () => {
      stopped = true;
    };
  }, [mode, i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track the target's position (scrolling, resizing, layout changes). A timer is used instead of
  // animation frames because browsers pause animation frames in background windows.
  useEffect(() => {
    if (mode !== "touring") return;
    setRect(null);
    const update = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((old) => (old && Math.abs(old.top - r.top) < 0.5 && Math.abs(old.left - r.left) < 0.5 && Math.abs(old.width - r.width) < 0.5 && Math.abs(old.height - r.height) < 0.5 ? old : { top: r.top, left: r.left, width: r.width, height: r.height }));
        setMissing(false);
      } else setRect(null);
    };
    update();
    raf.current = setInterval(update, 120);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(raf.current);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [mode, i]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Click X" steps continue when the real element is clicked
  useEffect(() => {
    if (mode !== "touring" || !step.click) return;
    const onClick = (e) => {
      if (e.target.closest?.(step.click)) setTimeout(() => setI((n) => Math.min(n + 1, TOUR_STEPS.length - 1)), 250);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [mode, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "touring" && mode !== "welcome") return;
    const onKey = (e) => {
      if (e.key === "Escape") end("skipped");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, end]);

  useLayoutEffect(() => {
    if (card.current) {
      const r = card.current.getBoundingClientRect();
      if (Math.abs(r.width - cardSize.w) > 1 || Math.abs(r.height - cardSize.h) > 1) setCardSize({ w: r.width, h: r.height });
    }
  });

  const start = () => {
    setI(0);
    setMenu(false);
    setMode("touring");
  };
  const next = () => (i < TOUR_STEPS.length - 1 ? setI(i + 1) : end("done"));
  const back = () => setI(Math.max(0, i - 1));

  if (mode === "welcome") {
    return (
      <div className="gt-backdrop" role="dialog" aria-modal="true" aria-labelledby="gt-welcome-title">
        <div className="gt-welcome">
          <span className="gt-badge"><Icon name="star" size={16} /> First time here</span>
          <h2 id="gt-welcome-title">Welcome to Space App Med</h2>
          <p>A health companion for astronauts on long missions, when help from Earth is minutes away. This prototype uses simulated data for a 4-person crew on day 120 of a trip to Mars.</p>
          <ul className="gt-list">
            <li><b>2-minute guided tour.</b> We'll shade the screen and show you exactly what to click.</li>
            <li><b>Full tutorial.</b> 50 steps to learn and test every feature, any time from the Tutorial button at the bottom.</li>
          </ul>
          <div className="gt-actions">
            <button className="btn primary" onClick={start} autoFocus>
              Start the guided tour <Icon name="arrow" size={18} />
            </button>
            <button className="btn" onClick={() => end("skipped")}>Skip for now</button>
          </div>
          <p className="small muted">You can restart the tour from the Tutorial button at the bottom of the screen.</p>
        </div>
      </div>
    );
  }

  if (mode === "touring") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hole = rect && !missing ? { top: Math.max(0, rect.top - PAD), left: Math.max(0, rect.left - PAD), right: Math.min(vw, rect.left + rect.width + PAD), bottom: Math.min(vh, rect.top + rect.height + PAD) } : null;
    // Card position: below the target if there is room, otherwise above, otherwise centred
    const w = Math.min(380, vw - 24);
    let pos;
    if (!hole) pos = { left: (vw - w) / 2, top: Math.max(16, (vh - cardSize.h) / 2) };
    else {
      const left = Math.min(Math.max(12, (hole.left + hole.right) / 2 - w / 2), vw - w - 12);
      const below = hole.bottom + 14;
      const above = hole.top - 14 - cardSize.h;
      if (below + cardSize.h < vh - 8) pos = { left, top: below };
      else if (above > 8) pos = { left, top: above };
      else pos = { left, top: Math.max(8, vh - cardSize.h - 8) };
    }
    const shade = (style) => <div className="gt-shade" style={style} onClick={(e) => e.stopPropagation()} />;
    return (
      <div className="gt-layer" aria-live="polite">
        {hole ? (
          <>
            {shade({ top: 0, left: 0, width: vw, height: hole.top })}
            {shade({ top: hole.bottom, left: 0, width: vw, height: Math.max(0, vh - hole.bottom) })}
            {shade({ top: hole.top, left: 0, width: hole.left, height: hole.bottom - hole.top })}
            {shade({ top: hole.top, left: hole.right, width: Math.max(0, vw - hole.right), height: hole.bottom - hole.top })}
            <div className={"gt-ring" + (step.click ? " gt-ring-click" : "")} style={{ top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top }} />
            {/* "Next" steps: block clicks inside the highlight too, so the tour can't be derailed */}
            {!step.click && <div className="gt-shield" style={{ top: hole.top, left: hole.left, width: hole.right - hole.left, height: hole.bottom - hole.top }} />}
          </>
        ) : (
          shade({ top: 0, left: 0, width: vw, height: vh })
        )}
        <div ref={card} className="gt-card" role="dialog" aria-label={step.title} style={{ left: pos.left, top: pos.top, width: w }}>
          <div className="gt-card-head">
            <span className="gt-count tabular">{String(i + 1).padStart(2, "0")} / {String(TOUR_STEPS.length).padStart(2, "0")}</span>
            <button className="gt-x" aria-label="Close the tour" onClick={() => end("skipped")}>
              <Icon name="close" size={16} />
            </button>
          </div>
          <h3>{step.title}</h3>
          <p>{missing ? "This part isn't on screen right now. Press Next to continue." : step.text}</p>
          {step.click && !missing && (
            <p className="gt-do">
              <Icon name="arrow" size={16} /> Click the highlighted spot to continue
            </p>
          )}
          <div className="gt-dots" aria-hidden="true">
            {TOUR_STEPS.map((_, k) => <i key={k} className={k === i ? "on" : k < i ? "done" : ""} />)}
          </div>
          <div className="gt-actions">
            <button className="btn small" onClick={back} disabled={i === 0}>Back</button>
            <button className="text-button" onClick={() => end("skipped")}>Skip tour</button>
            {(!step.click || missing) && (
              <button className="btn primary small" onClick={next}>
                {i === TOUR_STEPS.length - 1 ? "Finish" : "Next"} <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // After the tour: a small button stays at the bottom of the screen
  return (
    <div className="gt-dock">
      {mode === "finished" && (
        <div className="gt-done" role="status">
          <p>
            <b>You're ready.</b> Replay the tour or open the full 50-step tutorial with test checklists here any time.
          </p>
          <button className="gt-x" aria-label="Dismiss" onClick={() => setMode("idle")}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      {menu && (
        <div className="gt-menu" role="menu">
          <button role="menuitem" onClick={start}>
            <Icon name="star" size={16} /> Replay the guided tour
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setMenu(false);
              const who = (window.location.hash.match(/^#\/([^/]+)/) || [])[1];
              window.location.hash = `#/${who && who !== "" ? who : "okafor"}/tutorial`;
            }}
          >
            <Icon name="book" size={16} /> Full tutorial and test run
          </button>
        </div>
      )}
      <button className="gt-pill" aria-expanded={menu} onClick={() => setMenu(!menu)}>
        <Icon name="help" size={18} /> Tutorial
      </button>
    </div>
  );
}
