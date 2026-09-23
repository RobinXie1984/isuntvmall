import Link from "next/link";
import { LiveBadge } from "@/components/live/live-badge";
import { ProductCard } from "@/components/product/product-card";
import { getLiveSessions, getProducts } from "@/lib/data/store";
export const dynamic = "force-dynamic";
export default async function HomePage() {
 const [products,sessions]=await Promise.all([getProducts(),getLiveSessions()]);
 return <>
  <section className="home-hero"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
   <div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow light">ISUNTVMALL / WATCH. DISCOVER. SHOP.</span><h1>Good finds.<br/><em>Great company.</em></h1><p>好物，与懂它的人相遇。<br/>Discover independent hosts and their curated selections, all in one place.</p><div className="hero-actions"><Link className="button" href="/live">Explore rooms · 逛直播间 →</Link><Link className="button button-ghost" href="/shop">Shop · 商品</Link></div><div className="trust-line"><span>Your host</span><i/><span>Your selection</span><i/><span>One shopping bag</span></div></div>
   <div className="hero-room-stack">{sessions.slice(0,3).map((s,i)=><Link href={`/live/${s.slug}`} key={s.id} className="room-preview"><img src={s.posterUrl || "/demo/live-hero.svg"} alt=""/><div><span className="eyebrow light">ROOM 0{i+1} · {s.platform}</span><h2>{s.title}</h2><p>{s.hostName}</p><LiveBadge status={s.status}/></div><span aria-hidden="true">↗</span></Link>)}</div>
   </div></section>
  <section className="section shell"><div className="section-heading"><div><span className="eyebrow">THE EDIT</span><h2>Worth a closer look · 好物精选</h2></div><Link className="text-link" href="/shop">All products · 全部 →</Link></div><div className="product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
  <section className="story-strip"><div className="shell story-grid"><span className="story-number">↗</span><div><span className="eyebrow light">A DIFFERENT WAY TO DISCOVER</span><h2>Many hosts.<br/>Your kind of discovery.</h2></div><p>Choose a room. Explore its products. Keep your selections as you move between hosts. 多位主播，各有精选；自由切换，购物袋随你同行。</p></div></section>
 </>;
}
