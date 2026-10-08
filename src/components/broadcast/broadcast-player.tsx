import type { Locale } from "@/lib/i18n";
import { broadcastEmbed, broadcastTitle, type Broadcast } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import "./broadcast.css";

export function BroadcastPlayer({ broadcast, locale, priority = false }: { broadcast: Broadcast; locale: Locale; priority?: boolean }) {
  const copy = broadcastCopy(locale);
  const embed = broadcastEmbed(broadcast.url);
  return <div className="broadcast-player">
    {embed.src ? <div className="broadcast-frame"><iframe src={embed.src} title={broadcastTitle(broadcast, locale)} loading={priority ? "eager" : "lazy"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div> : <div className="broadcast-link-only"><span aria-hidden="true">▷</span><p>{copy.externalOnly}</p></div>}
    <div className="broadcast-fallback"><a href={embed.href} target="_blank" rel="noopener noreferrer" className="text-link">{embed.platform === "youtube" ? copy.onYouTube : copy.onFacebook} <span aria-hidden="true">↗</span></a><p>{copy.fallback}</p></div>
  </div>;
}
