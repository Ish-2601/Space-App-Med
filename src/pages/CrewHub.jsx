import React from "react";
import EarthLink from "./EarthLink.jsx";
import Habitat from "./Habitat.jsx";
import Mind from "./Mind.jsx";
import CrewAvatar from "../components/CrewAvatar.jsx";
import { PageTitle, Panel, Status, Icon } from "../components/ConsoleUI.jsx";
import { useStore, crewOverview, alertsFor } from "../backend/api.js";

export default function CrewHub({ person, go, onOpenPerson }) {
  const state = useStore();
  return (
    <>
      <PageTitle
        eyebrow="CREW"
        title="Other people and the ship"
        description="Connected by a small ship. Supported across a long distance."
      />
      <div className="main-with-aside crew-hub">
        <div className="panel-stack">
          <Panel title="Earth link">
            <EarthLink person={person} embedded />
          </Panel>
          <Panel title="Ship">
            <Habitat go={go} embedded />
          </Panel>
        </div>
        <div className="panel-stack">
          <Panel title="Crew">
            {crewOverview(state).map((r) => (
              <button
                className="crew-summary-row"
                key={r.person.id}
                onClick={() => onOpenPerson(r.person.id)}
              >
                <CrewAvatar person={r.person} compact />
                <span>
                  <b>
                    {r.person.name}
                    {r.person.id === person.id ? " (you)" : ""}
                  </b>
                  <small>{r.person.role}</small>
                </span>
                <Status status={r.status} />
                <strong>{r.score}</strong>
              </button>
            ))}
            <button className="text-button" onClick={() => go("crew")}>
              Medical officer view <Icon name="arrow" size={16} />
            </button>
          </Panel>
          <Panel title="Your health signals">
            {alertsFor(state, person.id)
              .filter((a) => a.level !== "info")
              .slice(0, 4)
              .map((a) => (
                <div key={a.id} className="signal-row">
                  <Icon name="info" />
                  <div>
                    <b>{a.title}</b>
                    <button
                      className="text-button"
                      onClick={() =>
                        go(a.page || "body", { part: a.part || "brain" })
                      }
                    >
                      Review <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </Panel>
          <Panel title="Mind">
            <Mind person={person} go={go} embedded />
          </Panel>
        </div>
      </div>
    </>
  );
}
