import type { LivePlatform } from "@/types/commerce";

export type LiveEmbed =
  | { kind: "iframe"; src: string; title: string; allow: string }
  | { kind: "link"; href: string; reason: string };

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function extractYouTubeId(value: string) {
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(value)) return value;
  const url = safeHttpsUrl(value);
  if (!url) return null;
  if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
    return url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|live|shorts)\/([\w-]+)/)?.[1] ?? null;
  }
  return null;
}

export function buildLiveEmbed(platform: LivePlatform, externalUrl: string, embedId?: string | null): LiveEmbed {
  const safeUrl = safeHttpsUrl(externalUrl);
  if (!safeUrl) return { kind: "link", href: "#", reason: "直播链接无效" };

  if (platform === "instagram" && !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(safeUrl.hostname)) return {kind:"link",href:"#",reason:"Invalid Instagram URL / Instagram 网址无效"};
  if (platform === "instagram") return { kind: "link", href: safeUrl.toString(), reason: "Instagram viewing opens on the official platform. Instagram 直播请在官方平台观看。" };

  if (platform === "youtube") {
    const id = extractYouTubeId(embedId || externalUrl);
    if (id) {
      return {
        kind: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`,
        title: "YouTube livestream",
        allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share",
      };
    }
  }

  if (platform === "facebook" && ["facebook.com", "www.facebook.com", "fb.watch"].includes(safeUrl.hostname)) {
    return {
      kind: "iframe",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(safeUrl.toString())}&show_text=false`,
      title: "Facebook livestream",
      allow: "autoplay; encrypted-media; picture-in-picture; web-share",
    };
  }

  if (platform === "tiktok" && embedId && /^\d{8,24}$/.test(embedId)) {
    return {
      kind: "iframe",
      src: `https://www.tiktok.com/player/v1/${embedId}?autoplay=0&loop=0`,
      title: "TikTok video",
      allow: "fullscreen; autoplay; encrypted-media; picture-in-picture",
    };
  }

  return {
    kind: "link",
    href: safeUrl.toString(),
    reason: platform === "tiktok" ? "TikTok LIVE 将在官方应用或网页打开" : "此平台不允许安全嵌入，请前往原平台观看",
  };
}
