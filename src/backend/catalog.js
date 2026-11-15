import { SPACEFLIGHT_CATALOG_1000 } from "../data/spaceflightCatalog1000.ts";
import { getState } from "./store.js";
import { sandboxEnabled } from "./sandbox.js";
import { clinicalRecords, saveClinicalRecord } from "./clinicalStore.js";

const byId = new Map(SPACEFLIGHT_CATALOG_1000.map((item) => [item.id, item]));
export const catalogItem = (id) => byId.get(Number(id));
export function catalogDisplayName(name) {
  return name
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\$/g, "")
    .replace(/_\{([^}]+)\}/g, "$1")
    .replace(/_([0-9])/g, "$1");
}
const normalize = (value) =>
  catalogDisplayName(String(value))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const searchable = new Map(
  SPACEFLIGHT_CATALOG_1000.map((item) => [
    item.id,
    normalize(
      [
        item.code,
        item.id,
        item.name,
        item.category,
        item.linkedBodySystem,
        item.itemType,
        item.whyNeeded,
      ].join(" "),
    ),
  ]),
);

export function filterCatalog({
  query = "",
  categoryId = "",
  bodySystem = "",
  packColor = "",
  itemType = "",
  ids,
  relatedIds = [],
} = {}) {
  const exactCode = String(query)
    .trim()
    .match(/^#(\d{1,4})$/);
  const tokens = normalize(exactCode ? "" : query)
    .replace(/#/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const permitted = ids ? new Set(ids) : null;
  const related = new Set(relatedIds);
  return SPACEFLIGHT_CATALOG_1000.filter(
    (item) =>
      (!exactCode || item.id === Number(exactCode[1])) &&
      (!categoryId || item.categoryId === Number(categoryId)) &&
      (!bodySystem ||
        item.linkedBodySystem === bodySystem ||
        related.has(item.id)) &&
      (!packColor || item.nasaPackColor === packColor) &&
      (!itemType || item.itemType === itemType) &&
      (!permitted || permitted.has(item.id)) &&
      tokens.every((token) => searchable.get(item.id).includes(token)),
  );
}

export function catalogActionFor(item) {
  if (item.categoryId === 10) return "launch";
  if (["Medication", "Nutrition", "Hygiene"].includes(item.itemType))
    return "dispense";
  if (["Exercise", "Behavioral"].includes(item.itemType)) return "log";
  return "check";
}
export const CATALOG_ACTION_LABELS = {
  launch: "Launch Module",
  dispense: "Dispense / Log Usage",
  log: "Log Usage",
  check: "Run Check",
};

export function catalogHistory(state, pid, itemId) {
  const records = sandboxEnabled(state)
    ? state.privateSandboxRecords || []
    : state.clinicalRecords || [];
  const modules = records
    .filter(
      (record) =>
        record.pid === pid &&
        !record.draft &&
        /^catalog-(9\d\d|1000)$/.test(
          record.module || record.kind?.replace(/^clinical:/, "") || "",
        ),
    )
    .map((record) => {
      const id = Number((record.module || record.kind).split("-").at(-1)),
        item = catalogItem(id);
      return {
        ...record,
        payload: {
          itemId: id,
          code: item.code,
          name: item.name,
          action: "module",
          result: record.payload.result?.headline || "Module evaluated",
          note: "",
        },
      };
    });
  return [...clinicalRecords(state, pid, "catalog-usage"), ...modules]
    .filter((record) => !itemId || record.payload.itemId === Number(itemId))
    .sort((a, b) => b.ts - a.ts);
}
export function catalogStock(state, itemId, pid) {
  const item = catalogItem(itemId);
  if (!item) throw new Error("Unknown catalog item.");
  const publicLogs = (state.clinicalRecords || []).filter(
    (record) => record.module === "catalog-usage" && !record.draft,
  );
  const privateLogs = sandboxEnabled(state)
    ? clinicalRecords(state, pid, "catalog-usage")
    : [];
  const consumed = [...publicLogs, ...privateLogs].reduce(
    (sum, record) =>
      sum +
      (record.payload.itemId === item.id && record.payload.action === "dispense"
        ? record.payload.quantity
        : 0),
    0,
  );
  return Math.max(0, item.stockQty - consumed);
}

export function logCatalogAction(pid, itemId, values = {}) {
  const state = getState(),
    item = catalogItem(itemId);
  if (!item || item.categoryId === 10)
    throw new Error("Choose a catalog supply or countermeasure.");
  if (!state.crew.some((person) => person.id === pid))
    throw new Error("Choose a crew member.");
  const action = catalogActionFor(item);
  const note = String(values.note || "").trim();
  if (note.length > 2000)
    throw new Error("Keep the log note within 2,000 characters.");
  let quantity = 0,
    minutes = 0,
    result = "";
  if (action === "dispense") {
    quantity = Number(values.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000)
      throw new Error(
        "Enter a whole number of inventory units from 1 to 1,000.",
      );
    if (item.itemType === "Medication" && values.authorized !== true)
      throw new Error(
        "Confirm this is an inventory rehearsal or an already approved medical plan. This catalog cannot prescribe treatment.",
      );
    if (quantity > catalogStock(state, item.id, pid))
      throw new Error(
        "Not enough simulated stock remains. Reduce the quantity.",
      );
  } else if (action === "log") {
    minutes = Number(values.minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 480)
      throw new Error("Enter a session duration between 1 and 480 minutes.");
    result = String(values.result || "");
    if (!["completed", "adapted", "stopped"].includes(result))
      throw new Error("Choose the session outcome.");
  } else {
    if (values.setupConfirmed !== true)
      throw new Error(
        "Complete the equipment setup and containment check first.",
      );
    result = String(values.result || "");
    if (!["ready", "review", "unavailable"].includes(result))
      throw new Error("Choose the equipment check result.");
  }
  return saveClinicalRecord(pid, "catalog-usage", {
    itemId: item.id,
    code: item.code,
    name: item.name,
    action,
    quantity,
    minutes,
    result,
    note,
    authorized: values.authorized === true,
    simulated: true,
  });
}

export function saveCatalogDraft(pid, itemId, values) {
  if (!catalogItem(itemId)) throw new Error("Unknown catalog item.");
  return saveClinicalRecord(pid, "catalog-draft-" + Number(itemId), values, {
    draft: true,
  });
}
