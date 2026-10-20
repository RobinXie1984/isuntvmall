import { channelSnapshotSchema, emptyChannel, type ChannelSnapshot } from "./contracts";

/** One in-flight request; clean teardown; no polling in background tabs. */
export function pollChannel(onValue: (value: ChannelSnapshot) => void, options: {
  fetch: typeof fetch; visible: () => boolean; schedule: typeof setTimeout; cancel: typeof clearTimeout; now: () => number;
}) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: AbortController | undefined;
  const tick = async () => {
    if (stopped) return;
    if (options.visible()) {
      abort = new AbortController();
      const timeout = options.schedule(() => abort?.abort(), 8000);
      try {
        const response = await options.fetch("/api/channel", { cache: "no-store", signal: abort.signal });
        if (!response.ok) throw new Error("CHANNEL_UNAVAILABLE");
        const value = channelSnapshotSchema.parse(await response.json());
        const serverTime = Date.parse(response.headers.get("Date") ?? "");
        const reference = Number.isFinite(serverTime) ? serverTime : options.now();
        if (value.checkedAt > reference + 60_000 || reference - value.checkedAt > 30_000) throw new Error("STALE_CHANNEL");
        if (!stopped) onValue(value);
      } catch { if (!stopped) onValue(emptyChannel("unavailable", options.now())); }
      finally { options.cancel(timeout); abort = undefined; }
    }
    if (!stopped) timer = options.schedule(tick, 15_000);
  };
  void tick();
  return () => { stopped = true; if (timer) options.cancel(timer); abort?.abort(); };
}
