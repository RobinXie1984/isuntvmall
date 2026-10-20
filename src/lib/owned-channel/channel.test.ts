import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { channelConfig, createChannelReader, publicChannelResponse } from "./server";
import { emptyChannel, selectChannel } from "./contracts";
import { pollChannel } from "./poll";
import { attachRecovery } from "./recovery";
import { ownedChannelCopy } from "./copy";

const now = Date.parse("2026-10-20T08:00:00Z");
const uid = "a".repeat(32), other = "b".repeat(32);
const row = (state: string, id = uid, created = "2026-10-20T07:00:00Z") => ({ uid: id, created, status: { state }, readyToStream: state === "ready", secret: "never-public" });
const payload = (...rows: unknown[]) => ({ success: true, result: rows });
const env = { MALL_LIVE_ENABLED: "true", CF_STREAM_ACCOUNT_ID: "c".repeat(32), CF_STREAM_INPUT_ID: "d".repeat(32), CF_STREAM_CUSTOMER_CODE: "example", CF_STREAM_READ_TOKEN: "private-test-token" };
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("one owned channel lifecycle", () => {
  it("follows real provider transitions without requiring editorial updates", () => {
    expect(selectChannel(payload(), "example", now).state).toBe("offline");
    expect(selectChannel(payload(row("live-inprogress")), "example", now).state).toBe("live");
    expect(selectChannel(payload(row("inprogress")), "example", now).state).toBe("processing");
    expect(selectChannel(payload(row("ready")), "example", now).state).toBe("replay");
    expect(selectChannel(payload(row("error")), "example", now).state).toBe("offline");
  });
  it("selects newest video independently of array order and strips provider fields", () => {
    const result = selectChannel(payload(row("ready", other, "2026-10-19T00:00:00Z"), row("live-inprogress")), "example", now);
    expect(result.videoId).toBe(uid);
    expect(Object.keys(result).sort()).toEqual(["checkedAt", "playerUrl", "state", "videoId"]);
    expect(JSON.stringify(result)).not.toContain("never-public");
  });
  it("does not label unfinished recordings as replay or silently serve an old recording", () => {
    expect(selectChannel(payload({ ...row("ready"), readyToStream: false }), "example", now).playerUrl).toBeNull();
    expect(selectChannel(payload(row("inprogress"), row("ready", other, "2026-10-19T00:00:00Z")), "example", now).state).toBe("processing");
  });
  it.each([null, { success: false, result: [] }, payload({ ...row("ready"), uid: "../bad" }), payload({ ...row("ready"), created: "wrong" }), payload(row("live-inprogress", uid, "2030-01-01T00:00:00Z"))])("rejects malformed or future provider data", data => {
    expect(() => selectChannel(data, "example", now)).toThrow();
  });
  it("does not accept arbitrary customer hosts", () => {
    expect(() => selectChannel(payload(), "example.attacker.test", now)).toThrow();
  });
  it("is disabled by default; missing or injected config fails closed", () => {
    expect(channelConfig({})).toBeNull();
    expect(() => channelConfig({ ...env, CF_STREAM_INPUT_ID: "../../secrets" })).toThrow();
    expect(() => channelConfig({ ...env, CF_STREAM_READ_TOKEN: "" })).toThrow();
    expect(() => channelConfig({ ...env, CF_STREAM_READ_TOKEN: "x\nHeader: y" })).toThrow();
  });
  it("coalesces concurrent viewers, expires cache and never preserves stale LIVE after failure", async () => {
    let time = now;
    const read = vi.fn().mockResolvedValue(selectChannel(payload(row("live-inprogress")), "example", now));
    const get = createChannelReader(read, () => time);
    const values = await Promise.all([get(env), get(env), get(env)]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(values.every(v => v.state === "live")).toBe(true);
    await get(env); expect(read).toHaveBeenCalledTimes(1);
    time += 10_001; read.mockRejectedValueOnce(Error("private upstream detail"));
    expect(await get(env)).toEqual(emptyChannel("unavailable", time));
    expect(read).toHaveBeenCalledTimes(2);
    expect((await get({ ...env, MALL_LIVE_ENABLED: "false" })).state).toBe("disabled");
  });
  it("binds reads to one configured input; sends credential only to Cloudflare", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    const fetch = vi.fn().mockResolvedValue(Response.json(payload(row("ready"))));
    vi.stubGlobal("fetch", fetch);
    const result = await createChannelReader()(env);
    expect(result.state).toBe("replay");
    expect(fetch.mock.calls[0][0]).toBe(`https://api.cloudflare.com/client/v4/accounts/${env.CF_STREAM_ACCOUNT_ID}/stream/live_inputs/${env.CF_STREAM_INPUT_ID}/videos`);
    expect(fetch.mock.calls[0][1].redirect).toBe("manual");
    expect(JSON.stringify(result)).not.toContain(env.CF_STREAM_READ_TOKEN);
  });
  it.each([301, 302, 307, 308, 401, 403, 429, 500])("handles provider HTTP %s without leaking errors", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider details", { status })));
    expect((await createChannelReader()(env)).state).toBe("unavailable");
  });
  it("bounds streamed provider bodies even without content length", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x".repeat(1_048_577))));
    expect((await createChannelReader()(env)).state).toBe("unavailable");
  });
  it("public status is disabled safely without configuration", async () => {
    vi.stubEnv("MALL_LIVE_ENABLED", "false");
    const response = await publicChannelResponse();
    expect((await response.json()).state).toBe("disabled");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("supplies complete separate copy for four languages", () => {
    for (const locale of ["en", "zh-Hant", "zh-Hans", "ja"] as const) {
      const copy = ownedChannelCopy(locale);
      expect(Object.values(copy).every(text => text.length > 0)).toBe(true);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(ownedChannelCopy("en")).sort());
    }
    expect(ownedChannelCopy("zh-Hans").title).toContain("们");
    expect(ownedChannelCopy("zh-Hant").title).toContain("們");
    expect(ownedChannelCopy("ja").title).toContain("チャンネル");
  });
});
describe("viewer polling and disconnect recovery", () => {
  it("polls sequentially, stops on teardown and skips hidden tabs", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    let visible = true;
    const fetch = vi.fn().mockImplementation(async () => Response.json(emptyChannel("offline", Date.now())));
    const accept = vi.fn();
    const stop = pollChannel(accept, { fetch, visible: () => visible, schedule: setTimeout, cancel: clearTimeout, now: Date.now });
    await vi.advanceTimersByTimeAsync(1); expect(accept).toHaveBeenCalledTimes(1);
    visible = false;
    await vi.advanceTimersByTimeAsync(15_000); expect(fetch).toHaveBeenCalledTimes(1);
    visible = true;
    await vi.advanceTimersByTimeAsync(15_000); expect(fetch).toHaveBeenCalledTimes(2);
    stop(); await vi.advanceTimersByTimeAsync(60_000); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("replaces stale LIVE and recovers automatically on the next successful response", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ...emptyChannel("live", now - 31_000) })).mockImplementation(async () => Response.json(emptyChannel("offline", Date.now())));
    const accept = vi.fn();
    const stop = pollChannel(accept, { fetch, visible: () => true, schedule: setTimeout, cancel: clearTimeout, now: Date.now });
    await vi.advanceTimersByTimeAsync(1); expect(accept.mock.calls[0][0].state).toBe("unavailable");
    await vi.advanceTimersByTimeAsync(15_000); expect(accept.mock.calls[1][0].state).toBe("offline"); stop();
  });
  it("aborts stalled requests and never updates after unmount", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    const fetch = vi.fn((_url, options) => new Promise<Response>((_resolve, reject) => options?.signal?.addEventListener("abort", () => reject(Error("aborted")))));
    const accept = vi.fn();
    const stop = pollChannel(accept, { fetch: fetch as typeof globalThis.fetch, visible: () => true, schedule: setTimeout, cancel: clearTimeout, now: Date.now });
    await vi.advanceTimersByTimeAsync(8001); expect(accept.mock.calls[0][0].state).toBe("unavailable");
    stop(); await vi.advanceTimersByTimeAsync(60_000); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uses the response clock so a visitor's wrong device clock does not hide a live stream", async () => {
    vi.useFakeTimers(); vi.setSystemTime(now + 3_600_000);
    const fetch = vi.fn().mockResolvedValue(Response.json(selectChannel(payload(row("live-inprogress")), "example", now), { headers: { Date: new Date(now).toUTCString() } }));
    const accept = vi.fn();
    const stop = pollChannel(accept, { fetch, visible: () => true, schedule: setTimeout, cancel: clearTimeout, now: Date.now });
    await vi.advanceTimersByTimeAsync(1); expect(accept.mock.calls[0][0].state).toBe("live"); stop();
  });
  it("retries player failures with a finite budget; playback recovery cancels pending retries", async () => {
    vi.useFakeTimers();
    const listeners = new Map<string, () => void>();
    const player = { paused: false, addEventListener: (n: string, cb: () => void) => { listeners.set(n, cb); }, removeEventListener: (n: string) => { listeners.delete(n); } };
    const retry = vi.fn(), budget = { remaining: 2 };
    const cleanup = attachRecovery(player, retry, budget, () => true);
    listeners.get("error")!(); listeners.get("error")!();
    await vi.advanceTimersByTimeAsync(10_000); listeners.get("playing")!();
    await vi.advanceTimersByTimeAsync(10_000); expect(retry).not.toHaveBeenCalled();
    for (let i = 0; i < 3; i++) { listeners.get("error")!(); await vi.advanceTimersByTimeAsync(15_001); }
    expect(retry).toHaveBeenCalledTimes(2);
    cleanup(); expect(listeners.size).toBe(0);
  });
});
