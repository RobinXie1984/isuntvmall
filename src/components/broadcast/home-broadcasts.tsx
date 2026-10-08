import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { broadcastTitle, type Broadcast } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import { BroadcastCard } from "./broadcast-card";
import { BroadcastPlayer } from "./broadcast-player";
import "./broadcast.css";

export function FeaturedIntroduction({ broadcast, locale }: { broadcast: Broadcast; locale: Locale }) {
  const copy = broadcastCopy(locale);
  return <section className="shell featured-introduction" aria-labelledby="introduction-heading"><div className="introduction-copy"><span className="eyebrow">{copy.introduction}</span><h2 id="introduction-heading">{broadcastTitle(broadcast, locale)}</h2><p>{copy.introductionBody}</p><Link className="text-link" href="/watch">{copy.all} →</Link></div><BroadcastPlayer broadcast={broadcast} locale={locale} priority /></section>;
}
export function HomeBroadcasts({ broadcasts, locale }: { broadcasts: Broadcast[]; locale: Locale }) {
  const copy = broadcastCopy(locale);
  if (!broadcasts.length) return null;
  return <section className="home-broadcasts"><div className="shell section"><div className="section-heading"><div><span className="eyebrow">{copy.eyebrow}</span><h2>{copy.heading}</h2><p className="section-description">{copy.description}</p></div><Link className="text-link" href="/watch">{copy.all} →</Link></div><div className="broadcast-grid broadcast-grid-home">{broadcasts.slice(0,4).map(broadcast => <BroadcastCard key={broadcast.id} broadcast={broadcast} locale={locale} />)}</div></div></section>;
}
