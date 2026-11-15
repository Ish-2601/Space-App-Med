import { getState, update } from "./store.js";
import { rowFor } from "./rules.js";
import { sandboxEnabled, saveSandboxRecord } from "./sandbox.js";

export const SYNC_TIERS = [
  {
    id: 1,
    title: "Priority 1: 0.5 KB Emergency Vitals Delta",
    detail:
      "A reserved 512-byte frame; only changed vital fields and a baseline identifier.",
  },
  {
    id: 2,
    title: "Priority 2: Clinical JSON",
    detail: "The requested report, text and public health summary.",
  },
  {
    id: 3,
    title: "Priority 3: High-Res Media",
    detail: "Photo attachments use spare bandwidth after clinical packets.",
  },
];
export const packetBytes = (payload) =>
  new TextEncoder().encode(JSON.stringify(payload)).length;
const VITALS = [
  "heartRate",
  "systolic",
  "diastolic",
  "spo2",
  "temp",
  "glucose",
];

export function publicVitals(state, pid) {
  const row = rowFor(state, pid);
  return Object.fromEntries(
    VITALS.filter((k) => Number.isFinite(row[k])).map((k) => [k, row[k]]),
  );
}

export function vitalsDelta(state, report) {
  const snapshot = publicVitals(state, report.pid);
  const baseline = state.earthSyncSnapshots?.[report.pid];
  const values = Object.fromEntries(
    Object.entries(snapshot).filter(([k, v]) => baseline?.values[k] !== v),
  );
  const payload = {
    v: 1,
    pid: report.pid,
    day: state.mission.day,
    base: baseline?.id || null,
    values,
  };
  if (packetBytes(payload) > 512)
    throw new Error("Emergency vital delta exceeds its 512-byte frame.");
  return { payload, snapshot };
}

export function prepareReportPackets(state, report) {
  if (report.packets || report.status !== "queued") return report.packets || [];
  const packets = [];
  const add = (tier, payload, bytes, extra = {}) =>
    packets.push({
      id: report.id + "-p" + tier,
      reportId: report.id,
      pid: report.pid,
      tier,
      payload,
      bytes,
      sentBytes: 0,
      state: "queued",
      createdAt: report.createdAt,
      ...extra,
    });
  if (report.priority || report.kind === "emergency") {
    const delta = vitalsDelta(state, report);
    add(1, delta.payload, 512, {
      encodedBytes: packetBytes(delta.payload),
      snapshot: delta.snapshot,
    });
  }
  const clinical = {
    version: 1,
    pid: report.pid,
    kind: report.kind,
    text: report.text,
    summary: report.summary,
    createdAt: report.createdAt,
  };
  add(2, clinical, Math.max(1, packetBytes(clinical)));
  if (report.photoIds?.length || report.demoMedia) {
    const media = {
      photoIds: [...(report.photoIds || [])],
      simulated: true,
      generatedDemo: !!report.demoMedia,
    };
    const sizes = report.demoMedia
      ? [1572864]
      : report.photoIds.map(
          (id) =>
            (state.photos[report.pid] || []).find((p) => p.id === id)?.bytes ||
            1572864,
        );
    add(
      3,
      media,
      sizes.reduce((a, b) => a + b, 0),
      { sizeEstimated: true },
    );
  }
  report.packets = packets;
  return packets;
}

export function sortedQueue(state) {
  return state.reports
    .flatMap((r) => r.packets || [])
    .slice()
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        a.createdAt - b.createdAt ||
        a.id.localeCompare(b.id),
    );
}

export function setJudgeDelay(enabled) {
  update((s) => {
    s.link.judgesDemo40 = !!enabled;
  });
}

export function setQueueBandwidth(kib) {
  const value = Number(kib);
  if (!Number.isFinite(value) || value < 1 || value > 1024)
    throw new Error("Bandwidth must be between 1 and 1024 KiB/s.");
  update((s) => {
    s.link.bandwidthKiB = value;
  });
}

export function queueDemoTransmission(pid, tier) {
  if (![1, 2, 3].includes(tier) || !getState().crew.some((p) => p.id === pid))
    throw new Error("Choose a crew member and priority.");
  if (sandboxEnabled())
    return saveSandboxRecord(pid, "transmission-demo", {
      tier,
      simulated: true,
    });
  return update((s) => {
    const report = {
      id:
        "demo-" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7),
      pid,
      kind: tier === 1 ? "emergency" : "message",
      text: "Judge demonstration · " + SYNC_TIERS[tier - 1].title,
      summary: null,
      hasRed: false,
      photoIds: [],
      priority: tier === 1,
      demoMedia: tier === 3,
      createdAt: Date.now(),
      status: "queued",
      sentAt: null,
      deliverAt: null,
      replyAt: null,
      reply: null,
    };
    s.reports.unshift(report);
    prepareReportPackets(s, report);
    return report;
  });
}

// A one-second transmit quantum preserves the existing link's tick contract.
// Packets already in flight still reach Earth if the ship later loses its uplink.
export function advanceDeltaQueue(state, now, delay, replyFor) {
  let changed = false;
  for (const report of state.reports) {
    if (!report.packets && report.status === "queued") {
      prepareReportPackets(state, report);
      changed = true;
    }
  }
  const packets = sortedQueue(state);
  if (state.link.online) {
    const elapsed =
      state.link.queueTickAt == null || !state.link.queueWasOnline
        ? 1
        : Math.max(0, Math.min(8, (now - state.link.queueTickAt) / 1000));
    let budget = Math.floor((state.link.bandwidthKiB || 64) * 1024 * elapsed);
    for (const packet of packets.filter(
      (p) => p.state === "queued" || p.state === "uploading",
    )) {
      if (budget <= 0) break;
      const amount = Math.min(budget, packet.bytes - packet.sentBytes);
      packet.sentBytes += amount;
      budget -= amount;
      packet.state =
        packet.sentBytes === packet.bytes ? "in-flight" : "uploading";
      if (packet.state === "in-flight")
        Object.assign(packet, {
          sentAt: now,
          deliverAt: now + delay,
          linkDelayMs: delay,
          judgeDemo: !!state.link.judgesDemo40,
        });
      changed = true;
    }
  }
  state.link.queueTickAt = now;
  state.link.queueWasOnline = state.link.online;
  for (const packet of packets) {
    if (packet.state === "in-flight" && now >= packet.deliverAt) {
      packet.state = "delivered";
      packet.ackAt = packet.deliverAt + packet.linkDelayMs;
      changed = true;
    }
    if (
      packet.state === "delivered" &&
      now >= packet.ackAt &&
      state.link.online
    ) {
      packet.state = "acknowledged";
      if (packet.tier === 1) {
        state.earthSyncSnapshots ||= {};
        const previous = state.earthSyncSnapshots[packet.pid];
        if (!previous || packet.createdAt >= previous.createdAt)
          state.earthSyncSnapshots[packet.pid] = {
            id: packet.id,
            values: { ...packet.snapshot },
            createdAt: packet.createdAt,
          };
      }
      changed = true;
    }
  }
  for (const report of state.reports) {
    const primary = report.packets?.find((p) => p.tier === 2);
    if (
      report.status === "queued" &&
      primary &&
      ["in-flight", "delivered", "acknowledged"].includes(primary.state)
    ) {
      Object.assign(report, {
        status: "sending",
        sentAt: primary.sentAt,
        deliverAt: primary.deliverAt,
        replyDelayMs: primary.linkDelayMs,
        judgeDemo: primary.judgeDemo,
      });
      changed = true;
    } else if (report.status === "sending" && now >= report.deliverAt) {
      Object.assign(report, {
        status: "delivered",
        replyAt:
          report.deliverAt +
          (report.judgeDemo ? 0 : 5000) +
          (report.replyDelayMs ?? delay),
      });
      changed = true;
    } else if (
      report.status === "delivered" &&
      now >= report.replyAt &&
      state.link.online
    ) {
      Object.assign(report, { status: "replied", reply: replyFor(report) });
      changed = true;
    }
  }
  return changed;
}
