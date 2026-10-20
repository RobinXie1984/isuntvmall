import { z } from "zod";

export const channelStates = ["disabled", "offline", "live", "processing", "replay", "unavailable"] as const;
export type ChannelState = typeof channelStates[number];
const id = z.string().regex(/^[a-f0-9]{32}$/);
const video = z.object({
  uid: id,
  created: z.iso.datetime({ offset: true }),
  status: z.object({ state: z.string().max(80) }),
  readyToStream: z.boolean().optional(),
});
export const providerVideos = z.object({ success: z.literal(true), result: z.array(video).max(1000) });
const playerUrl = z.string().regex(/^https:\/\/customer-[a-z0-9]+\.cloudflarestream\.com\/[a-f0-9]{32}\/iframe\?autoplay=false$/);
export const channelSnapshotSchema = z.object({
  state: z.enum(channelStates),
  checkedAt: z.number().finite().nonnegative(),
  videoId: id.nullable(),
  playerUrl: playerUrl.nullable(),
}).strict();
export type ChannelSnapshot = z.infer<typeof channelSnapshotSchema>;
export function emptyChannel(state: ChannelState, now = Date.now()): ChannelSnapshot {
  return { state, checkedAt: now, videoId: null, playerUrl: null };
}
/** Only this input's provider records determine status. Never trust editorial labels. */
export function selectChannel(payload: unknown, customer: string, now = Date.now()): ChannelSnapshot {
  if (!/^[a-z0-9]+$/.test(customer)) throw new Error("INVALID_CHANNEL_CONFIG");
  const rows = providerVideos.parse(payload).result;
  // Reject future data rather than making a fictitious LIVE claim.
  if (rows.some(row => Date.parse(row.created) > now + 60_000)) throw new Error("INVALID_CHANNEL_CLOCK");
  const ordered = [...rows].sort((a, b) => Date.parse(b.created) - Date.parse(a.created) || a.uid.localeCompare(b.uid));
  const active = ordered.find(row => row.status.state === "live-inprogress");
  const latest = active ?? ordered[0];
  if (!latest) return emptyChannel("offline", now);
  const state: ChannelState = active ? "live"
    : latest.status.state === "ready" && latest.readyToStream === true ? "replay"
    : ["queued", "inprogress", "pendingupload", "downloading", "live-ended", "not-found", "not-started"].includes(latest.status.state) ? "processing" : "offline";
  if (state !== "live" && state !== "replay") return emptyChannel(state, now);
  return { state, checkedAt: now, videoId: latest.uid, playerUrl: `https://customer-${customer}.cloudflarestream.com/${latest.uid}/iframe?autoplay=false` };
}
