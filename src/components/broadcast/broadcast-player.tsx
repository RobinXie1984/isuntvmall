import {filmForBroadcast,filmCopy,productFilmPlaybackUrl} from "@/lib/broadcasts/product-films";
import type { Locale } from "@/lib/i18n";
import { broadcastEmbed, publicBroadcastTitle, type Broadcast } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import "./broadcast.css";

export function BroadcastPlayer({ broadcast, locale, priority = false, autoPlay = false }: { broadcast: Broadcast; locale: Locale; priority?: boolean; autoPlay?: boolean }) {
  if(broadcast.kind==='broadcast'){
    const film=filmForBroadcast(broadcast),words=filmCopy(locale);
    return <div className="broadcast-player product-film-player">{film?<video controls playsInline muted preload="metadata" poster={film.poster} aria-label={film.brand}><source src={productFilmPlaybackUrl(film)} type="video/mp4"/></video>:<div className="brand-film-pending"><span aria-hidden="true">▷</span><div><h3>{words.pending}</h3><p>{words.note}</p></div></div>}<div className="broadcast-fallback"><a className="text-link" href={broadcast.url} target="_blank" rel="noopener noreferrer">{words.source} ↗</a></div></div>;
  }
  const copy = broadcastCopy(locale);
  const embed = broadcastEmbed(broadcast.url);
  const source = embed.src && autoPlay && embed.platform === "youtube" ? `${embed.src}&autoplay=1` : embed.src;
  return <div className="broadcast-player">
    {source ? <div className="broadcast-frame"><iframe src={source} title={publicBroadcastTitle(broadcast, locale)} loading={priority ? "eager" : "lazy"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div> : <div className="broadcast-link-only"><span aria-hidden="true">▷</span><p>{copy.externalOnly}</p></div>}
    <div className="broadcast-fallback"><a href={embed.href} target="_blank" rel="noopener noreferrer" className="text-link">{embed.platform === "youtube" ? copy.onYouTube : copy.onFacebook} <span aria-hidden="true">↗</span></a><p>{copy.fallback}</p></div>
  </div>;
}
