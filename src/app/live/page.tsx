import Link from "next/link";
import { LiveBadge } from "@/components/live/live-badge";
import { getLiveSessions } from "@/lib/data/store";
export const dynamic = "force-dynamic";
export const metadata = { title: "Watch & shop · 直播间" };
const order = { live:0, scheduled:1, preview:2, ended:3 };
export default async function LivePage() {
 const sessions=(await getLiveSessions()).sort((a,b)=>order[a.status]-order[b.status]);
 return <div className="shell page-space"><div className="page-intro"><span className="eyebrow">FIND YOUR ROOM</span><h1>Watch & shop · 逛直播间</h1><p>Independent hosts. Their own featured products. One persistent shopping bag.<br/>各位主播独立开播，商品按场次精选，购物袋跨直播间保留。</p></div><div className="room-grid">{sessions.map(s=><Link className="live-card" href={`/live/${s.slug}`} key={s.id}><div className="live-card-image"><img src={s.posterUrl || "/demo/live-hero.svg"} alt=""/><LiveBadge status={s.status}/></div><div><span className="eyebrow">{s.platform} · {s.products.length} products / 件精选</span><h2>{s.title}</h2><p>{s.description}</p><strong>{s.kol?.displayName ?? s.hostName}</strong><p className="text-link">Enter room · 进入 →</p></div></Link>)}</div>{!sessions.length && <p className="empty-inline">Our next rooms are being prepared. 新的直播间正在准备中。</p>}</div>;
}
