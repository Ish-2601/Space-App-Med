import React, { useState } from "react";
import { TUTORIAL, ALL_STEPS, SOURCE_TIERS } from "../data/tutorial.js";
import { PageTitle, Icon } from "../components/ConsoleUI.jsx";

// Full tutorial + test run. Results are saved in this browser only (a per-device convenience).
const KEY = "nasa-med-tutorial-results";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
const save = (r) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* storage blocked: results last for this visit only */
  }
};

export function testReport(results, who = "") {
  const lines = [`NASA Med test run${who ? " · " + who : ""} · ${new Date().toLocaleString()}`];
  const count = (r) => ALL_STEPS.filter((s) => results[s.id]?.result === r).length;
  lines.push(`Works: ${count("pass")} · Problems: ${count("fail")} · Not tested: ${ALL_STEPS.length - count("pass") - count("fail")}`, "");
  for (const c of TUTORIAL) {
    lines.push(`## ${c.title}`);
    for (const s of c.steps) {
      const r = results[s.id];
      lines.push(`${r?.result === "pass" ? "[OK]  " : r?.result === "fail" ? "[BUG] " : "[ -- ]"} ${s.title}${r?.note ? " — " + r.note : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export default function Tutorial({ person, go, onSwitch }) {
  const [results, setResults] = useState(load);
  const [chapter, setChapterState] = useState(() => {
    try {
      const c = localStorage.getItem(KEY + "-chapter");
      return TUTORIAL.some((t) => t.id === c) ? c : TUTORIAL[0].id;
    } catch {
      return TUTORIAL[0].id;
    }
  });
  const setChapter = (c) => {
    setChapterState(c);
    try {
      localStorage.setItem(KEY + "-chapter", c);
    } catch {
      /* not remembered */
    }
  };
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const set = (id, patch) => {
    const next = { ...results, [id]: { ...results[id], ...patch, ts: Date.now() } };
    setResults(next);
    save(next);
  };
  const passed = ALL_STEPS.filter((s) => results[s.id]?.result === "pass").length;
  const failed = ALL_STEPS.filter((s) => results[s.id]?.result === "fail").length;
  const tested = passed + failed;
  const ch = TUTORIAL.find((c) => c.id === chapter);
  const steps = ch.steps.filter((s) => !onlyOpen || !results[s.id]?.result);
  const offset = TUTORIAL.slice(0, TUTORIAL.indexOf(ch)).reduce((n, c) => n + c.steps.length, 0);

  const open = (s) => {
    if (s.go?.lobby) return onSwitch?.();
    go(s.go.page, s.go.params || {});
  };

  return (
    <div className="tutorial">
      <PageTitle
        eyebrow="Tutorial · test run"
        title="Learn and test every feature"
        description={`${ALL_STEPS.length} short steps in ${TUTORIAL.length} chapters. For each one: open it, try it, then mark whether it worked. Results are saved in this browser.`}
      >
        <div className="tutorial-actions">
          <button
            className="btn"
            onClick={async () => {
              const text = testReport(results, person?.name);
              try {
                await navigator.clipboard.writeText(text);
                setCopied("Test report copied. Paste it into your team chat.");
              } catch {
                setCopied("Copy failed in this browser. Select the report below and copy it.");
                console.info(text);
              }
            }}
          >
            <Icon name="send" size={18} /> Copy test report
          </button>
          <button
            className="btn"
            onClick={() => {
              if (window.confirm("Clear all test results on this device?")) {
                setResults({});
                save({});
              }
            }}
          >
            <Icon name="refresh" size={18} /> Reset results
          </button>
        </div>
      </PageTitle>
      {copied && <p className="small" role="status">{copied}</p>}

      <div className="tutorial-progress" aria-label="Test progress">
        <div className="tp-bar" role="progressbar" aria-valuenow={tested} aria-valuemin={0} aria-valuemax={ALL_STEPS.length}>
          <span className="tp-pass" style={{ width: `${(passed / ALL_STEPS.length) * 100}%` }} />
          <span className="tp-fail" style={{ width: `${(failed / ALL_STEPS.length) * 100}%` }} />
        </div>
        <p className="tp-numbers">
          <b className="tabular">{tested}</b> of {ALL_STEPS.length} tested ·{" "}
          <span className="tp-ok">{passed} {passed === 1 ? "works" : "work"}</span> ·{" "}
          <span className="tp-bad">{failed} {failed === 1 ? "problem" : "problems"}</span>
        </p>
        <label className="tp-filter">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> Show untested only
        </label>
      </div>

      <div className="tutorial-layout">
        <nav className="tutorial-chapters" aria-label="Chapters">
          {TUTORIAL.map((c, i) => {
            const done = c.steps.filter((s) => results[s.id]?.result).length;
            const bad = c.steps.some((s) => results[s.id]?.result === "fail");
            return (
              <button key={c.id} className={"tc" + (c.id === chapter ? " on" : "")} aria-current={c.id === chapter ? "true" : undefined} onClick={() => setChapter(c.id)}>
                <span className="tc-num tabular">{String(i + 1).padStart(2, "0")}</span>
                <span className="tc-title">{c.title}</span>
                <span className={"tc-count tabular" + (bad ? " bad" : done === c.steps.length ? " ok" : "")}>
                  {done}/{c.steps.length}
                </span>
              </button>
            );
          })}
        </nav>

        <section className="tutorial-steps" aria-label={ch.title}>
          <p className="tutorial-intro">{ch.intro}</p>
          {!steps.length && <p className="muted">Every step in this chapter has been tested.</p>}
          {steps.map((s) => {
            const r = results[s.id] || {};
            const n = offset + ch.steps.indexOf(s) + 1;
            return (
              <article key={s.id} className={"t-step" + (r.result ? " is-" + r.result : "")} id={"step-" + s.id}>
                <header className="t-head">
                  <span className="t-num tabular">{String(n).padStart(2, "0")}</span>
                  <h2>{s.title}</h2>
                  <button className="btn primary t-open" onClick={() => open(s)}>
                    {s.go?.lobby ? "Open the lobby" : "Open"} <Icon name="arrow" size={16} />
                  </button>
                </header>
                <p className="t-why">{s.why}</p>
                <div className="t-cols">
                  <div>
                    <p className="micro-label">Try it</p>
                    <ol className="t-try">{s.try.map((t) => <li key={t}>{t}</li>)}</ol>
                  </div>
                  <div className="t-expect">
                    <p className="micro-label">You should see</p>
                    <p>{s.expect}</p>
                  </div>
                </div>
                <footer className="t-foot">
                  <span className={"t-source tier-" + s.source.tier}>
                    <span className="t-tier">{SOURCE_TIERS[s.source.tier]}</span>
                    {s.source.url ? (
                      <a href={s.source.url} target="_blank" rel="noreferrer">{s.source.label} ↗</a>
                    ) : (
                      <span>{s.source.label}</span>
                    )}
                  </span>
                  <span className="t-verdict" role="group" aria-label={"Test result for " + s.title}>
                    <button className={"btn small" + (r.result === "pass" ? " pass-on" : "")} aria-pressed={r.result === "pass"} onClick={() => set(s.id, { result: r.result === "pass" ? null : "pass" })}>
                      <Icon name="check" size={16} /> Works
                    </button>
                    <button className={"btn small" + (r.result === "fail" ? " fail-on" : "")} aria-pressed={r.result === "fail"} onClick={() => set(s.id, { result: r.result === "fail" ? null : "fail" })}>
                      <Icon name="alert" size={16} /> Problem
                    </button>
                  </span>
                </footer>
                {r.result === "fail" && (
                  <label className="t-note">
                    What went wrong?
                    <textarea rows={2} value={r.note || ""} placeholder="What did you see instead?" onChange={(e) => set(s.id, { note: e.target.value })} />
                  </label>
                )}
              </article>
            );
          })}
          <div className="t-nav">
            {TUTORIAL.indexOf(ch) > 0 && (
              <button className="btn" onClick={() => setChapter(TUTORIAL[TUTORIAL.indexOf(ch) - 1].id)}>
                <Icon name="back" size={16} /> {TUTORIAL[TUTORIAL.indexOf(ch) - 1].title}
              </button>
            )}
            {TUTORIAL.indexOf(ch) < TUTORIAL.length - 1 && (
              <button className="btn primary" onClick={() => { setChapter(TUTORIAL[TUTORIAL.indexOf(ch) + 1].id); window.scrollTo?.(0, 0); }}>
                Next chapter: {TUTORIAL[TUTORIAL.indexOf(ch) + 1].title} <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
