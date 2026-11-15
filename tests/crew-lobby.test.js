import { beforeEach, describe, expect, it } from "vitest";
import * as api from "../src/backend/api.js";
import { getPhoto } from "../src/backend/photoStore.js";

const state = () => api.getState();
const portrait = () => new Blob(["test photo"], { type: "image/png" });
const overview = (pid = "rivera") => api.crewOverview(state()).find((row) => row.person.id === pid);

beforeEach(async () => { await api.resetAll(); });

describe("crew profile photos", () => {
  it("keeps portraits separate from medical photos and from other crew members", async () => {
    const blob = portrait();
    const id = await api.saveProfilePhoto("chen", blob);
    expect(state().profilePhotos.chen).toBe(id);
    expect(await getPhoto(id)).toBe(blob);
    expect(state().profilePhotos.rivera).toBeUndefined();
    expect(state().photos.chen).toEqual([]);
  });

  it("loads older saved states without resetting existing mission data", async () => {
    delete state().profilePhotos;
    const history = state().history;
    const id = await api.saveProfilePhoto("chen", portrait());
    expect(state().profilePhotos.chen).toBe(id);
    expect(state().history).toBe(history);
  });

  it("replaces and removes photos without leaving old image blobs", async () => {
    const first = await api.saveProfilePhoto("chen", portrait());
    const second = await api.saveProfilePhoto("chen", portrait());
    expect(first).not.toBe(second);
    expect(await getPhoto(first)).toBeNull();
    expect(await getPhoto(second)).not.toBeNull();
    await api.deleteProfilePhoto("chen");
    expect(state().profilePhotos.chen).toBeUndefined();
    expect(await getPhoto(second)).toBeNull();
  });

  it("rejects unsupported, oversized and empty files without changing the portrait", async () => {
    const id = await api.saveProfilePhoto("chen", portrait());
    await expect(api.saveProfilePhoto("chen", new Blob(["text"], { type: "text/plain" }))).rejects.toThrow("Choose a JPG");
    await expect(api.saveProfilePhoto("chen", new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "image/png" }))).rejects.toThrow("5 MB");
    await expect(api.saveProfilePhoto("chen", new Blob([], { type: "image/png" }))).rejects.toThrow("5 MB");
    await expect(api.saveProfilePhoto("unknown", portrait())).rejects.toThrow("Crew member not found");
    expect(state().profilePhotos.chen).toBe(id);
  });

  it("clears portraits when all demo data is reset", async () => {
    const id = await api.saveProfilePhoto("chen", portrait());
    await api.resetAll();
    expect(state().profilePhotos).toEqual({});
    expect(await getPhoto(id)).toBeNull();
  });
});

describe("lobby checkup status", () => {
  async function finishHealthyChecks() {
    api.submitCheckIn("rivera", {});
    api.saveTest("rivera", "hr", { bpm: 66 });
    api.saveTest("rivera", "pvt", api.testsOf(state(), "rivera", "pvt").at(-1).result);
    await api.savePhoto("rivera", portrait(), { category: "face", rating: 0 });
    api.saveTest("rivera", "urine", { shade: 2 }); // hydration colour check (every 3 days) is also due on day 120
    expect(api.dueChecks(state(), "rivera").some((check) => check.due)).toBe(false);
    expect(overview().status).toBe("green");
  }

  it("requires attention for a missing check-in even with a healthy score", async () => {
    await finishHealthyChecks();
    delete state().checkins.rivera[state().mission.day];
    expect(overview().checkupRequired).toBe(true);
  });

  it("clears the checkup flag once a healthy crew member completes due checks", async () => {
    await finishHealthyChecks();
    expect(overview().checkupRequired).toBe(false);
    expect(overview().score).toBe(api.healthScore(state(), "rivera"));
  });

  it("flags a due scheduled check independently of current health alerts", async () => {
    await finishHealthyChecks();
    state().tests.rivera.find((test) => test.type === "hr").day -= 7;
    expect(overview().status).toBe("green");
    expect(overview().checkupRequired).toBe(true);
  });

  it("still requires a checkup if an alert appears after scheduled checks are complete", async () => {
    await finishHealthyChecks();
    api.submitCheckIn("rivera", { values: { systolic: 160 } });
    expect(overview().status).toBe("red");
    expect(overview().checkupRequired).toBe(true);
  });
});
