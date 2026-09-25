import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {LiveBadge} from "@/components/live/live-badge";
import {LivePlayer} from "@/components/live/live-player";
import {WatchShop} from "@/components/live/watch-shop";
import {checkoutReleaseReady} from "@/lib/cart";
import {LiveRoomSelection} from "@/components/live/live-room-selection";
import {getLiveSessionBySlug,getLiveSessions,getProducts} from "@/lib/data/store";
import {getLocale} from "@/lib/locale-server";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {t,localize,locale}=await getLocale();const s=await getLiveSessionBySlug((await params).slug);return s?{title:locale==="zh-Hant"&&s.titleZh?s.titleZh:localize(s.title),description:locale==="zh-Hant"&&s.descriptionZh?s.descriptionZh:localize(s.description)}:{title:t("Room unavailable","直播間不存在")};}
export default async function LiveDetailPage({params}:{params:Promise<{slug:string}>}){const {t,localize,locale}=await getLocale();const session=await getLiveSessionBySlug((await params).slug);if(!session)notFound();const [sessions,products]=await Promise.all([getLiveSessions(),getProducts()]);const others=sessions.filter(s=>s.id!==session.id);
return <div className="live-page"><div className="shell live-breadcrumb"><Link href="/live">← {t("All rooms","全部直播間")}</Link><span>{session.platform.toUpperCase()}</span></div><WatchShop products={products} sessions={sessions} checkoutReady={checkoutReleaseReady()} player={<LivePlayer session={session}/>} details={<div className="room-description"><LiveBadge status={session.status}/><h1>{locale==="zh-Hant"&&session.titleZh?session.titleZh:localize(session.title)}</h1><p>{locale==="zh-Hant"&&session.descriptionZh?session.descriptionZh:localize(session.description)}</p><div className="host-profile"><span className="host-avatar" aria-hidden="true">{localize(session.hostName).slice(0,1)}</span><div><strong>{localize(session.kol?.displayName??session.hostName)}</strong><p>{localize(session.kol?.bio??"")}</p></div></div>{session.status!=="preview"&&<a className="text-link" href={session.externalUrl} target="_blank" rel="noopener noreferrer">{t(`Watch on ${session.platform}`,`前往 ${session.platform} 觀看`)} ↗</a>}</div>} selection={<LiveRoomSelection session={session}/>}/><section className="section shell"><div className="section-heading"><h2>{t("Keep exploring","繼續探索")}</h2></div><div className="room-switcher">{others.map(s=><Link key={s.id} href={`/live/${s.slug}`}><LiveBadge status={s.status}/><strong>{locale==="zh-Hant"&&s.titleZh?s.titleZh:localize(s.title)}</strong><span>{localize(s.hostName)} →</span></Link>)}</div></section></div>;}
