import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveBadge } from "@/components/live/live-badge";
import { LivePlayer } from "@/components/live/live-player";
import { WatchShop } from "@/components/live/watch-shop";
import { checkoutReleaseReady } from "@/lib/cart";
import { ProductCard } from "@/components/product/product-card";
import { getLiveSessionBySlug, getLiveSessions, getProducts } from "@/lib/data/store";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
 const s=await getLiveSessionBySlug((await params).slug);return s?{title:s.title,description:s.description}:{title:"Room unavailable"};
}
export default async function LiveDetailPage({params}:{params:Promise<{slug:string}>}) {
 const session=await getLiveSessionBySlug((await params).slug);if(!session)notFound();
 const [sessions, products] = await Promise.all([getLiveSessions(), getProducts()]);
 const others=sessions.filter(s=>s.id!==session.id);
 const source=session.kol?{liveSessionId:session.id,kolId:session.kol.id}:undefined;
 return <div className="live-page"><div className="shell live-breadcrumb"><Link href="/live">← All rooms · 全部直播间</Link><span>{session.platform.toUpperCase()}</span></div>
  <WatchShop products={products} sessions={sessions} checkoutReady={checkoutReleaseReady()} player={<LivePlayer session={session}/>} details={<div className="room-description"><LiveBadge status={session.status}/><h1>{session.title}</h1><p>{session.description}</p><div className="host-profile"><span className="host-avatar" aria-hidden="true">{session.hostName.slice(0,1)}</span><div><strong>{session.kol?.displayName ?? session.hostName}</strong><p>{session.kol?.bio}</p></div></div>{session.status!=="preview" && <a className="text-link" href={session.externalUrl} target="_blank" rel="noopener noreferrer">Watch on {session.platform} · 原平台观看 ↗</a>}</div>} selection={<><div className="section-heading"><div><span className="eyebrow">IN THIS ROOM</span><h2>Shop the selection<br/>本场精选</h2></div></div>{session.products.length?<div className="room-product-grid">{session.products.map(p=><ProductCard key={p.id} product={p} source={source}/>)}</div>:<p className="empty-inline">Products are being prepared · 商品准备中</p>}<p className="secure-note">Selections keep their room source in your bag. 商品保留主播来源。</p></>}/>
  <section className="section shell"><div className="section-heading"><h2>Keep exploring · 换个直播间</h2></div><div className="room-switcher">{others.map(s=><Link key={s.id} href={`/live/${s.slug}`}><LiveBadge status={s.status}/><strong>{s.title}</strong><span>{s.hostName} →</span></Link>)}</div></section>
 </div>;
}
