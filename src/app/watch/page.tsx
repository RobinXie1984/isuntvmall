import type { Metadata } from "next";
import Link from "next/link";
import { getBroadcasts } from "@/lib/broadcasts/store";
import { broadcastEmbed } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import { getLocale } from "@/lib/locale-server";
import { BroadcastCard } from "@/components/broadcast/broadcast-card";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getLocale();
  const copy = broadcastCopy(locale);
  return { title: copy.heading, description: copy.description };
}
export default async function WatchPage({ searchParams }: { searchParams: Promise<{ platform?: string; status?: string }> }) {
  const [{ locale }, broadcasts, filters] = await Promise.all([getLocale(), getBroadcasts(), searchParams]);
  const copy = broadcastCopy(locale);
  const platform = filters.platform === "youtube" || filters.platform === "facebook" ? filters.platform : "";
  const status = ["live", "recorded", "scheduled"].includes(filters.status ?? "") ? filters.status : "";
  const selection = broadcasts.filter(broadcast => (!platform || broadcastEmbed(broadcast.url).platform === platform) && (!status || broadcast.status === status));
  return <div className="shell page-space">
    <div className="page-intro"><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.heading}</h1><p>{copy.description}</p></div>
    <form className="broadcast-filters" action="/watch"><label>{copy.platform}<select name="platform" defaultValue={platform}><option value="">{copy.everyPlatform}</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option></select></label><label>{copy.status}<select name="status" defaultValue={status}><option value="">{copy.everyStatus}</option><option value="recorded">{copy.replay}</option><option value="live">{copy.live}</option><option value="scheduled">{copy.scheduled}</option></select></label><button type="submit" className="button">{copy.apply}</button></form>
    {selection.length ? <div className="broadcast-grid">{selection.map(broadcast => <BroadcastCard key={broadcast.id} broadcast={broadcast} locale={locale} />)}</div> : <p className="broadcast-empty">{copy.empty}</p>}
    <Link className="text-link broadcast-rooms-link" href="/live">{copy.rooms} →</Link>
  </div>;
}
