import { z } from "zod";
import type { Locale } from "@/lib/i18n";

export function broadcastEmbed(value: string): { src: string | null; platform: "youtube" | "facebook"; href: string } {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("INVALID_VIDEO_URL");
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
    const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]+)\/?$/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error("INVALID_VIDEO_URL");
    return { platform: "youtube", href: `https://www.youtube.com/watch?v=${id}`, src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  }
  if (["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"].includes(url.hostname) && url.pathname !== "/") {
    url.searchParams.delete("mibextid");
    // A post or untyped share link is not evidence of a video. Keep it link-only.
    const video = /\/videos\/\d+|\/reel\/\d+|^\/share\/v\/[^/]+\/?$/.test(url.pathname) || (["/watch", "/watch/", "/video.php"].includes(url.pathname) && /^\d+$/.test(url.searchParams.get("v") ?? "")) || url.hostname === "fb.watch";
    return { platform: "facebook", href: url.toString(), src: video ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&width=1280` : null };
  }
  throw new Error("INVALID_VIDEO_URL");
}

export function validThumbnail(value: string) {
  if (!value) return true;
  if (/^\/(?:products|editorial|brand|demo)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value) && !value.includes("..")) return true;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.port && !/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[)/.test(u.hostname) && /\.(?:png|jpe?g|webp)$/i.test(u.pathname); } catch { return false; }
}
const title = z.string().trim().min(1).max(180);
export const broadcastPayloadSchema = z.object({
  kind: z.enum(["introduction", "broadcast"]),
  title, titleZh: title, titleHans: title, titleJa: title,
  url: z.string().trim().max(2000).refine(value => { try { broadcastEmbed(value); return true; } catch { return false; } }),
  thumbnailUrl: z.string().trim().max(2000).refine(validThumbnail).default(""),
  position: z.number().int().min(0).max(10000),
  visible: z.boolean(), status: z.enum(["recorded", "live", "scheduled"]),
  productIds: z.array(z.uuid()).max(100).refine(ids => new Set(ids).size === ids.length),
}).strict();
export const broadcastSaveSchema = z.object({ id: z.uuid(), revision: z.number().int().min(0), payload: broadcastPayloadSchema }).strict();
export type BroadcastPayload = z.infer<typeof broadcastPayloadSchema>;
export type Broadcast = BroadcastPayload & { id: string; revision: number };
export function broadcastTitle(b: Broadcast, locale: Locale) {
  return ({ en: b.title, "zh-Hant": b.titleZh, "zh-Hans": b.titleHans, ja: b.titleJa })[locale];
}
