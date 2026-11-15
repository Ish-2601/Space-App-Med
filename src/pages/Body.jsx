import React from "react";
import BodyMap from "../components/BodyMap.jsx";
import BodyHealth from "./BodyHealth.jsx";
import {
  useStore,
  partStatus,
  bodyHealthScore,
  dueChecks,
} from "../backend/api.js";
import { HEALTH_AREAS, areaPage } from "../data/healthAreas.js";
import { PageTitle, Panel, Status, Icon } from "../components/ConsoleUI.jsx";

export default function Body({ person, go, params = {} }) {
  const state = useStore();
  // Older links can still open a specific area; new links have persistent URLs.
  if (HEALTH_AREAS[params.part])
    return <BodyHealth person={person} go={go} partKey={params.part} />;
  const due = dueChecks(state, person.id);
  const attention = Object.keys(HEALTH_AREAS).filter((id) =>
    ["yellow", "red"].includes(partStatus(state, person.id, id)),
  ).length;
  return (
    <div className="body-menu-screen">
      <PageTitle
        eyebrow={person.name + " · Body information"}
        title="Your body at a glance"
        description="Choose a point on your body or a health system to explore its readings, symptoms and diagnostic checks."
      >
        <Status status={attention ? "yellow" : "green"}>
          {attention
            ? attention + " systems need attention"
            : "No flagged systems"}
        </Status>
      </PageTitle>
      <div className="body-menu-layout">
        <Panel title="Body map" className="body-menu-figure">
          <BodyMap
            figureOnly
            partStatus={(key) => partStatus(state, person.id, key)}
            onSelect={(key) => go(areaPage(key))}
          />
          <p className="small muted">
            Select a point to open that system's health screen. Every reading
            belongs to {person.name}.
          </p>
          <div className="map-legend">
            <Status status="green">In range</Status>
            <Status status="yellow">Review</Status>
            <Status status="unknown">Not checked</Status>
          </div>
        </Panel>
        <div className="body-system-cards" aria-label="Body systems">
          {Object.entries(HEALTH_AREAS).map(([key, area]) => {
            const score = bodyHealthScore(state, person.id, key);
            const checks = due.filter(
              (c) => c.check.part === key && c.due,
            ).length;
            return (
              <button
                key={key}
                className="body-system-card"
                onClick={() => go(areaPage(key))}
              >
                <span className="system-card-title">
                  <span className="icon-tile">
                    <Icon name={area.icon} size={24} />
                  </span>
                  <span>
                    <b>{area.title}</b>
                    <small>{area.description}</small>
                  </span>
                  <Icon name="arrow" size={18} />
                </span>
                <span className="system-card-status">
                  <Status status={partStatus(state, person.id, key)} />
                  <strong>
                    {score == null ? "—" : score}
                    <small> / 100</small>
                  </strong>
                </span>
                <span className="system-card-foot">
                  {checks
                    ? checks +
                      " scheduled check" +
                      (checks === 1 ? "" : "s") +
                      " due"
                    : "Readings, self-checks and care"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="body-menu-tools">
        <button className="btn" onClick={() => go("checks")}>
          <Icon name="medical" />
          All diagnostics
        </button>
        <button className="btn" onClick={() => go("photos")}>
          <Icon name="camera" />
          Photo log
        </button>
        <button className="btn" onClick={() => go("trends")}>
          <Icon name="grid" />
          Health trends
        </button>
      </div>
    </div>
  );
}
