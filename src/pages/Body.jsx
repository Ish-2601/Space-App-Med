import React, { useState } from "react";
import BodyMap from "../components/BodyMap.jsx";
import BodyPartDetail from "../components/BodyPartDetail.jsx";
import PhotoThumb from "../components/PhotoThumb.jsx";
import { useStore, partStatus, doseSummary } from "../backend/api.js";
import { bodyParts } from "../lib.js";
import {
  PageTitle,
  Panel,
  Status,
  Segments,
  Icon,
} from "../components/ConsoleUI.jsx";
export default function Body({ person, go, params = {} }) {
  const state = useStore(),
    [part, setPart] = useState(params.part || "eyes"),
    dose = doseSummary(state, person.id);
  const counts = Object.keys(bodyParts).reduce((c, k) => {
    const s = partStatus(state, person.id, k);
    c[s] = (c[s] || 0) + 1;
    return c;
  }, {});
  const photos = state.photos[person.id].slice(0, 3);
  return (
    <div>
      <PageTitle
        eyebrow={"Body · " + person.name}
        title="What's going on in my body"
      >
        <Status status="yellow">
          {(counts.red || 0) + (counts.yellow || 0)} need attention
        </Status>
        <Status status="green">{counts.green || 0} all good</Status>
        <Status status="info">{counts.unknown || 0} not checked</Status>
      </PageTitle>
      <div className="body-layout">
        <div className="panel-stack">
          <Panel title="Body map">
            <BodyMap
              partStatus={(k) => partStatus(state, person.id, k)}
              selected={part}
              onSelect={setPart}
            />
          </Panel>
          <div className="body-support">
            <Panel title="Radiation">
              <p className="dose-stat">
                <strong>{Math.round(dose.dose)}</strong>{" "}
                <span className="muted">of {dose.limit} mSv</span>
              </p>
              <Segments
                value={dose.dose}
                max={dose.limit}
                label="Career radiation dose"
              />
              <p className="small muted">
                {Math.round(dose.pct)}% of the modeled career limit ·{" "}
                {dose.rate} mSv/day here.
              </p>
              <button
                className="btn full-width"
                onClick={() => go("radiation")}
              >
                <Icon name="sun" />
                Storm shelter tool
              </button>
            </Panel>
            <Panel title="Photos">
              <div className="photo-preview">
                {photos.length ? (
                  photos.map((p) => (
                    <button
                      key={p.id}
                      className="photo-preview-button"
                      onClick={() => go("photos")}
                    >
                      <PhotoThumb id={p.id} size={70} />
                      <small>
                        {p.category} · {p.day}
                      </small>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <Icon name="camera" size={30} />
                    <span>No photos yet</span>
                  </div>
                )}
              </div>
              <p className="small muted">
                Track changes over time with a personal photo log.
              </p>
              <button className="btn full-width" onClick={() => go("photos")}>
                <Icon name="camera" />
                Open photo log
              </button>
            </Panel>
          </div>
        </div>
        <Panel
          aria-label={bodyParts[part].name}
          tone={partStatus(state, person.id, part)}
        >
          <BodyPartDetail key={part} partKey={part} person={person} go={go} />
        </Panel>
      </div>
    </div>
  );
}
