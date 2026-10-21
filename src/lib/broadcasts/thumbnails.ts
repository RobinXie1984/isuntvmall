import curated from "./curated-thumbnails.json";

export type ThumbnailPresentation = { src: string; width?: number; height?: number; cropTop?: number };

/** Bind editorial images to their exact source, never just a mutable broadcast ID. */
export function broadcastThumbnail(broadcast: { url: string; thumbnailUrl: string }): ThumbnailPresentation {
  if (broadcast.thumbnailUrl.trim()) return { src: broadcast.thumbnailUrl };
  try {
    const url = new URL(broadcast.url);
    if (url.protocol !== "https:" || url.host !== "www.facebook.com" || url.username || url.password) return { src: "" };
    const source = url.origin + url.pathname.replace(/\/?$/, "/");
    return curated.find(image => image.sourceUrl === source) ?? { src: "" };
  } catch {
    return { src: "" };
  }
}
