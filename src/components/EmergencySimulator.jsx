import React, { useState } from "react";
import {
  useStore,
  EMERGENCIES,
  activeEmergencies,
  startEmergency,
  resolveEmergency,
} from "../backend/api.js";
import { Panel, Icon } from "./ConsoleUI.jsx";
import { sandboxEnabled } from "../backend/sandbox.js";

export default function EmergencySimulator({ person, go }) {
  const state = useStore();
  const [type, setType] = useState("faint");
  const active = activeEmergencies(state, person.id);
  const simulation = active.find((e) => e.simulated);
  return (
    <Panel title="Emergency simulator" className="home-simulator">
      <p className="muted small">
        Test the emergency banner and response steps with this profile. Reports
        stay inside the prototype.
      </p>
      {sandboxEnabled(state) && (
        <p className="small muted">
          Private Sandbox records this scenario privately without starting a
          shared crew alert. Switch sandbox off to rehearse the shared protocol
          and banner.
        </p>
      )}
      {simulation ? (
        <>
          <p role="status">
            <b>Simulation active:</b> {simulation.title}
          </p>
          <div className="row">
            <button
              className="btn"
              onClick={() => go("emergency", { emergencyId: simulation.id })}
            >
              Open simulated protocol
            </button>
            <button
              className="btn"
              onClick={() =>
                resolveEmergency(simulation.id, { endedEarly: true })
              }
            >
              End simulation
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="simulator-picker">
            Scenario
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {EMERGENCIES.filter((e) => !["spe", "co2"].includes(e.id)).map(
                (e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ),
              )}
            </select>
          </label>
          <button
            className="btn"
            disabled={active.length > 0}
            onClick={() => startEmergency(person.id, type, { simulated: true })}
          >
            <Icon name="alert" />
            Simulate emergency
          </button>
          {active.length > 0 && (
            <p className="small muted">
              Finish the active protocol before starting a simulation.
            </p>
          )}
        </>
      )}
      <button className="text-button" onClick={() => go("mission")}>
        Storm, cabin air and other demo controls <Icon name="arrow" size={16} />
      </button>
    </Panel>
  );
}
