import { z } from "zod";

const httpsUrl = z.url().max(2048).refine(value => {
  const u = new URL(value);
  return u.protocol === "https:" && !u.username && !u.password;
}, "Use an HTTPS URL without credentials.");
export const liveDraftSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  titleZh: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).default(""),
  descriptionZh: z.string().trim().max(5000).default(""),
  hostName: z.string().trim().min(1).max(120),
  kolId: z.uuid(),
  platform: z.enum(["youtube", "facebook", "instagram", "tiktok", "external"]),
  externalUrl: httpsUrl,
  embedId: z.string().trim().max(200).nullable().default(null),
  status: z.enum(["scheduled", "live", "ended"]),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullable().default(null),
  posterUrl: httpsUrl.nullable().default(null),
  productIds: z.array(z.uuid()).max(30).refine(ids => new Set(ids).size === ids.length),
}).strict().superRefine((value, ctx) => {
  const host = new URL(value.externalUrl).hostname.toLowerCase();
  const hosts: Record<string, string[]> = { youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"], facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"], instagram: ["instagram.com", "www.instagram.com"], tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"] };
  if (hosts[value.platform] && !hosts[value.platform].includes(host)) ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "Use the selected platform's official URL." });
  if (value.endsAt && Date.parse(value.endsAt) < Date.parse(value.startsAt)) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must follow start time." });
});
export type LiveDraftPayload = z.infer<typeof liveDraftSchema>;
export type LiveDraft = { id: string; kol_id: string; payload: LiveDraftPayload; revision: number; state: "draft" | "requested" | "published"; published_revision: number | null; updated_at: string };
export type LiveControl = { room_id: string; revision: number; pinned_product_id: string | null };
export type LiveSourceCheck = { draft_revision: number; playback_mode: "embedded" | "external_link"; tested_origin: string; device_note: string; checked_at: string };
export const liveActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), revision: z.number().int().min(0), payload: liveDraftSchema }).strict(),
  z.object({ action: z.enum(["request", "publish"]), revision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("verify"), revision: z.number().int().positive(), mode: z.enum(["embedded", "external_link"]), deviceNote: z.string().trim().min(1).max(300), rightsConfirmed: z.literal(true), playbackConfirmed: z.literal(true) }).strict(),
  z.object({ action: z.literal("pin"), stateRevision: z.number().int().positive(), productId: z.uuid().nullable() }).strict(),
]);
export type LiveAction = z.infer<typeof liveActionSchema>;
