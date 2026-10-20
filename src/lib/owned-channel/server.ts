import "server-only";
import { channelSnapshotSchema, emptyChannel, selectChannel, type ChannelSnapshot } from "./contracts";

export const CHANNEL_TTL_MS = 10_000;
export function channelConfig(env: Record<string, string | undefined> = process.env) {
  if (env.MALL_LIVE_ENABLED !== "true") return null;
  const account = env.CF_STREAM_ACCOUNT_ID ?? "";
  const input = env.CF_STREAM_INPUT_ID ?? "";
  const customer = env.CF_STREAM_CUSTOMER_CODE ?? "";
  const token = env.CF_STREAM_READ_TOKEN ?? "";
  if (!/^[a-f0-9]{32}$/.test(account) || !/^[a-f0-9]{32}$/.test(input) || !/^[a-z0-9]{1,80}$/.test(customer) || !token || /[\r\n]/.test(token)) throw new Error("CHANNEL_NOT_CONFIGURED");
  return { account, input, customer, token };
}
type Config = NonNullable<ReturnType<typeof channelConfig>>;
async function readProvider(config: Config): Promise<ChannelSnapshot> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.account}/stream/live_inputs/${config.input}/videos`, {
    headers: { Authorization: `Bearer ${config.token}` },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
  });
  if (!response.ok || Number(response.headers.get("content-length")) > 1_048_576) throw new Error("CHANNEL_PROVIDER_UNAVAILABLE");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("CHANNEL_PROVIDER_UNAVAILABLE");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 1_048_576) { await reader.cancel(); throw new Error("CHANNEL_RESPONSE_TOO_LARGE"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return selectChannel(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), config.customer);
}
/** Cache only the public projection, never a token or a provider response. */
export function createChannelReader(read = readProvider, clock = Date.now) {
  let cached: { key: string; until: number; value: ChannelSnapshot } | undefined;
  let pending: { key: string; promise: Promise<ChannelSnapshot> } | undefined;
  return async (env: Record<string, string | undefined> = process.env): Promise<ChannelSnapshot> => {
    let config: Config | null;
    try { config = channelConfig(env); } catch { return emptyChannel("unavailable", clock()); }
    if (!config) return emptyChannel("disabled", clock());
    const key = `${config.account}/${config.input}/${config.customer}`;
    if (cached?.key === key && cached.until > clock()) return cached.value;
    if (pending?.key === key) return pending.promise;
    const promise = (async () => {
      let value: ChannelSnapshot;
      try { value = await read(config); } catch { value = emptyChannel("unavailable", clock()); }
      // Never serve an old LIVE snapshot after failed refresh.
      cached = { key, until: clock() + CHANNEL_TTL_MS, value };
      return value;
    })();
    pending = { key, promise };
    try { return await promise; } finally { if (pending?.promise === promise) pending = undefined; }
  };
}
const readChannel = createChannelReader();
export async function getOwnedChannel() { return readChannel(); }

/** Workers Cache API shares short-lived status across isolates in one location.
 * Next development falls back to the coalesced in-process reader. */
export async function publicChannelResponse() {
  const unavailable = () => Response.json(emptyChannel("unavailable"), { headers: { "Cache-Control": "no-store" } });
  let config: Config | null;
  try { config = channelConfig(); } catch { return unavailable(); }
  const headers = { "Cache-Control": "public, max-age=0, s-maxage=10", "X-Content-Type-Options": "nosniff" };
  if (!config) return Response.json(emptyChannel("disabled"), { headers: { ...headers, "Cache-Control": "no-store" } });
  const edge = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const key = new Request(`https://mall-channel-cache.invalid/v1/${config.account}/${config.input}/${config.customer}`);
  try {
    const hit = await edge?.match(key);
    if (hit) {
      const value = channelSnapshotSchema.parse(await hit.json());
      if (Date.now() - value.checkedAt < CHANNEL_TTL_MS && value.checkedAt <= Date.now()) return Response.json(value, { headers });
    }
  } catch { /* A cache failure must not become a page failure. */ }
  const value = await getOwnedChannel();
  const response = Response.json(value, { headers });
  try { await edge?.put(key, response.clone()); } catch { /* Best effort cache only. */ }
  return response;
}
