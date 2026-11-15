import React from "react";
import {
  useStore,
  partStatus,
  rowFor,
  symptomsToday,
  SYMPTOMS,
  dueChecks,
  latestBodyDiagnostic,
  bodyHealthScore,
} from "../backend/api.js";
import { HEALTH_AREAS, areaPage } from "../data/healthAreas.js";
import BodyMap from "../components/BodyMap.jsx";
import BodyPartDetail from "../components/BodyPartDetail.jsx";
import SpecializedTools from "../components/clinical/SpecializedTools.jsx";
import {
  Back,
  PageTitle,
  Panel,
  Icon,
  Status,
} from "../components/ConsoleUI.jsx";

export default function BodyHealth({ person, go, partKey = "brain" }) {
  const state = useStore(),
    pid = person.id,
    area = HEALTH_AREAS[partKey];
  const row = rowFor(state, pid),
    score = bodyHealthScore(state, pid, partKey);
  const diagnostic = latestBodyDiagnostic(state, pid, partKey);
  const reported = symptomsToday(state, pid).map((s) => s.id);
  const checkedIn =
    state.checkins[pid][state.mission.day] &&
    !state.checkins[pid][state.mission.day].auto;
  const journalDone = state.journal[pid].some(
    (j) => j.day === state.mission.day,
  );
  const checks = dueChecks(state, pid).filter((c) => c.check.part === partKey);
  const openReview = () => go("review-" + partKey);
  return (
    <div>
      <Back onClick={() => go("body")}>Body overview</Back>
      <PageTitle
        eyebrow={person.name + " · Personal health"}
        title={area.title}
        description={area.description}
      >
        <Status status={partStatus(state, pid, partKey)} />
      </PageTitle>
      <div className="health-area-layout">
        <aside className="panel-stack">
          <Panel title="Body location" className="area-location">
            <div className="area-organ">
              <Icon name={area.icon} size={54} />
              <span>{area.short}</span>
            </div>
            <BodyMap
              figureOnly
              selected={partKey}
              partStatus={(key) => partStatus(state, pid, key)}
              onSelect={(key) => go(areaPage(key))}
            />
            <label className="area-switch">
              View another system
              <select
                value={partKey}
                onChange={(e) => go(areaPage(e.target.value))}
              >
                {Object.entries(HEALTH_AREAS).map(([id, a]) => (
                  <option key={id} value={id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
          </Panel>
          <Panel title="Stay healthy">
            <div className="area-tools">
              {area.tools.map(([page, label, icon]) => (
                <button
                  key={label}
                  className="btn"
                  onClick={() =>
                    go(
                      page,
                      page === "photos"
                        ? { category: partKey === "immune" ? "skin" : "eyes" }
                        : {},
                    )
                  }
                >
                  <Icon name={icon} />
                  {label}
                  <Icon name="arrow" size={16} />
                </button>
              ))}
              <button className="btn" onClick={() => go("medguide")}>
                <Icon name="help" />
                Symptom guidance
              </button>
            </div>
          </Panel>
        </aside>
        <div className="panel-stack">
          <Panel title={area.short + " health summary"}>
            <div className="area-score-row">
              <div>
                <p className="eyebrow">{area.short} screening score</p>
                <p className="area-score">
                  {score == null ? "—" : score}
                  <span> / 100</span>
                </p>
              </div>
              <button className="btn primary" onClick={openReview}>
                <Icon name="medical" />
                Take diagnostic check
              </button>
            </div>
            <p className="small muted">
              Prototype index based on recorded readings, symptoms and recent
              checks. It does not diagnose a condition; unmeasured factors are
              not scored.
            </p>
            {partKey === "brain" && (
              <div className="head-metrics">
                <div>
                  <small>Sleep quality</small>
                  <b>{diagnostic?.sleepQuality || "Not recorded"}</b>
                  <span>{row.sleep} hours last night</span>
                </div>
                <div>
                  <small>Stress · self-reported</small>
                  <b>
                    {diagnostic?.stress == null
                      ? "Not recorded"
                      : diagnostic.stress + " / 10"}
                  </b>
                  <span>0 calm · 10 very stressed</span>
                </div>
                <div>
                  <small>Mood</small>
                  <b>{row.mood} / 10</b>
                  <button className="text-button" onClick={openReview}>
                    Update mood
                  </button>
                </div>
                <div>
                  <small>Today's journal</small>
                  <b>{journalDone ? "Complete" : "Incomplete"}</b>
                  <button className="text-button" onClick={() => go("mind")}>
                    {journalDone ? "Open journal" : "Write an entry"}
                  </button>
                </div>
              </div>
            )}
            {area.symptoms.length > 0 && (
              <div className="area-issues">
                <h3>Primary issues</h3>
                {area.symptoms.map((id) => {
                  const present = reported.includes(id);
                  const reviewed =
                    checkedIn ||
                    state.bodyDiagnostics?.[pid]?.some(
                      (r) =>
                        r.day === state.mission.day &&
                        typeof r.answers[id] === "boolean",
                    );
                  return (
                    <div className="issue-row" key={id}>
                      <span>{SYMPTOMS.find((s) => s.id === id)?.label}</span>
                      <Status
                        status={
                          present ? "yellow" : reviewed ? "green" : "unknown"
                        }
                      >
                        {present
                          ? "Reported"
                          : reviewed
                            ? "Not reported"
                            : "Not checked"}
                      </Status>
                      <button
                        className="text-button"
                        onClick={() => go("medguide", { guide: id })}
                      >
                        Guidance <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="small muted">
              {diagnostic
                ? "Focused check saved today. You can review or update it at any time."
                : "No focused diagnostic check recorded today."}
            </p>
          </Panel>
          <Panel title="Diagnostics and self-checks">
            <div className="area-diagnostics">
              <button className="diagnostic-link" onClick={openReview}>
                <Icon name="medical" />
                <span>
                  <b>
                    {partKey === "brain"
                      ? "Head and wellbeing check"
                      : area.short + " readings and symptoms"}
                  </b>
                  <small>Review your current readings and symptoms</small>
                </span>
                <Icon name="arrow" />
              </button>
              {checks.map(({ check, applicable, due }) => (
                <button
                  className="diagnostic-link"
                  key={check.id}
                  onClick={() =>
                    check.photo
                      ? go("photos", { category: "face" })
                      : go("checks", {
                          check: check.id,
                          returnTo: areaPage(partKey),
                        })
                  }
                >
                  <Icon name="medical" />
                  <span>
                    <b>{check.title}</b>
                    <small>
                      {!applicable
                        ? "Available in gravity · see instructions"
                        : due
                          ? "Due for this mission day"
                          : "Up to date · available to repeat"}
                    </small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          </Panel>
          <SpecializedTools person={person} partKey={partKey} go={go} />
          <Panel title="Readings, trends and care">
            <BodyPartDetail
              key={partKey}
              partKey={partKey}
              person={person}
              go={go}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
