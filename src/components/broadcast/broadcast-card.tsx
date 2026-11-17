import {filmForBroadcast,filmCopy} from "@/lib/broadcasts/product-films";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { broadcastEmbed, publicBroadcastTitle, type Broadcast } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import { broadcastThumbnail } from "@/lib/broadcasts/thumbnails";
import { BroadcastThumbnail } from "./broadcast-thumbnail";
import "./broadcast.css";

export function BroadcastCard({ broadcast, locale }: { broadcast: Broadcast; locale: Locale }) {
  const copy = broadcastCopy(locale);
  const title = publicBroadcastTitle(broadcast, locale);
  const platform = broadcastEmbed(broadcast.url).platform;
  const film=filmForBroadcast(broadcast);
  const thumbnail = broadcastThumbnail(broadcast);
  return <article className="broadcast-card">
    <Link href={`/watch/${encodeURIComponent(broadcast.id)}`} className="broadcast-card-visual" aria-label={`${copy.watch}: ${title}`}>
      {broadcast.kind === "broadcast" ? film ? <img src={film.poster} alt="" loading="lazy"/> : <span className="broadcast-neutral"><span aria-hidden="true">▷</span><span>{filmCopy(locale).pending}</span></span> : <BroadcastThumbnail key={thumbnail.src} {...thumbnail} platform={platform} />}
      <span className="broadcast-play" aria-hidden="true">▷</span>
    </Link>
    <div className="broadcast-card-meta"><span>{broadcast.kind === "broadcast" ? filmCopy(locale).ready : "YouTube"}</span><span className={broadcast.status === "live" ? "broadcast-status-live" : undefined}>{film ? `${film.seconds.toFixed(1)} s` : broadcast.kind === "broadcast" ? filmCopy(locale).pending : copy.replay}</span></div>
    <h3><Link href={`/watch/${encodeURIComponent(broadcast.id)}`}>{title}</Link></h3>
    <Link className="text-link" href={`/watch/${encodeURIComponent(broadcast.id)}`}>{copy.watch} <span aria-hidden="true">→</span></Link>
  </article>;
}
