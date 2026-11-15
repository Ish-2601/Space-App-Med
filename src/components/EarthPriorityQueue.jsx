import React, { useState } from "react";
import { useStore } from "../backend/store.js";
import {
  SYNC_TIERS,
  sortedQueue,
  setJudgeDelay,
  setQueueBandwidth,
  queueDemoTransmission,
} from "../backend/earthQueue.js";
import { sandboxEnabled } from "../backend/sandbox.js";
import { Panel, Status } from "./ConsoleUI.jsx";

const sizeLabel = (bytes) =>
  bytes >= 1048576
    ? (bytes / 1048576).toFixed(1) + " MiB"
    : (bytes / 1024).toFixed(1) + " KiB";
export default function EarthPriorityQueue({ pid }) {
  const state = useStore();
  const [message, setMessage] = useState("");
  const packets = sortedQueue(state).filter((p) => p.pid === pid);
  return (
    <Panel
      title="3-tier bandwidth priority delta-sync"
      className="priority-queue"
      id="priority-queue"
    >
      <div className="row spread">
        <div>
          <h2>Vital signs get through first</h2>
          <p className="muted small">
            Local simulated transmission queue · pauses when the Earth link is
            down.
          </p>
        </div>
        <Status status={state.link.online ? "green" : "yellow"}>
          {state.link.online ? "Uplink available" : "Queue held offline"}
        </Status>
      </div>
      <div className="specialty-fields">
        <label>
          Simulated uplink bandwidth
          <select
            value={state.link.bandwidthKiB || 64}
            onChange={(e) => setQueueBandwidth(e.target.value)}
          >
            {[1, 8, 64, 256, 1024].map((n) => (
              <option key={n} value={n}>
                {n} KiB/s
              </option>
            ))}
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!state.link.judgesDemo40}
            onChange={(e) => setJudgeDelay(e.target.checked)}
          />
          40-Minute Mars Comm-Delay Judge’s Demo Mode
        </label>
      </div>
      <p className="small muted">
        {state.link.judgesDemo40
          ? "20 minutes outbound + 20 minutes return, played at 60×: 20 seconds each way after upload. New packets use this timing; packets already in flight keep theirs."
          : "Normal mission delay and configured demo speed apply."}{" "}
        Priority changes upload order, never the speed of light.
      </p>
      <div className="sync-tier-grid">
        {SYNC_TIERS.map((tier) => (
          <section className="sync-tier" key={tier.id}>
            <h3>{tier.title}</h3>
            <p className="small muted">{tier.detail}</p>
            <button
              className="btn small"
              onClick={() => {
                const saved = queueDemoTransmission(pid, tier.id);
                setMessage(
                  saved.private
                    ? "Demo request saved privately; the shared queue is unchanged."
                    : "Demo packet queued. Watch upload, propagation and acknowledgement below.",
                );
              }}
            >
              Queue P{tier.id} demo
            </button>
          </section>
        ))}
      </div>
      {message && <p role="status">{message}</p>}
      {sandboxEnabled(state) && (
        <p className="small muted">
          Sandbox demo requests stay private. This list only shows previously
          shared reports.
        </p>
      )}
      {!packets.length ? (
        <p>No packets yet. Send a report or queue a demo above.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <caption>
              Packet queue · highest priority first · oldest first within a tier
            </caption>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Payload</th>
                <th>Upload</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {packets.slice(0, 30).map((p) => (
                <tr key={p.id}>
                  <td>P{p.tier}</td>
                  <td>
                    {sizeLabel(p.bytes)}
                    {p.tier === 1 && (
                      <small>
                        {" "}
                        · {p.encodedBytes} encoded bytes in a 512-byte frame
                      </small>
                    )}
                    {p.sizeEstimated && <small> · simulated media size</small>}
                  </td>
                  <td>
                    <progress
                      aria-label={"Upload " + p.id}
                      max={p.bytes}
                      value={p.sentBytes}
                    />
                    <span>{Math.round((p.sentBytes / p.bytes) * 100)}%</span>
                  </td>
                  <td>
                    {p.state === "in-flight"
                      ? "Travelling to Earth"
                      : p.state === "delivered"
                        ? "Received at Earth"
                        : p.state === "acknowledged"
                          ? "ACK returned to ship"
                          : p.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details>
        <summary>How deltas and priorities work</summary>
        <p className="small">
          Emergency vital frames contain only the public vital fields that
          differ from the last acknowledged snapshot for this crew member. Every
          frame names its baseline. Clinical JSON follows at P2; media chunks
          yield to P1/P2 on the next one-second tick. Offline periods do not
          accumulate bandwidth. Private Sandbox logs are excluded, and no data
          leaves this browser.
        </p>
        <a
          href="https://ntrs.nasa.gov/citations/20220013418"
          target="_blank"
          rel="noreferrer"
        >
          NASA: Mars communication delays
        </a>
      </details>
    </Panel>
  );
}
