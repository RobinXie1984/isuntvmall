import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBroadcastById } from "@/lib/broadcasts/store";
import { broadcastEmbed, broadcastTitle } from "@/lib/broadcasts/contracts";
import { broadcastCopy } from "@/lib/broadcasts/copy";
import { getProducts } from "@/lib/data/store";
import { getLocale } from "@/lib/locale-server";
import { BroadcastPlayer } from "@/components/broadcast/broadcast-player";
import { ProductCard } from "@/components/product/product-card";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ locale }, { id }] = await Promise.all([getLocale(), params]);
  const broadcast = await getBroadcastById(id);
  return { title: broadcast && broadcast.visible ? broadcastTitle(broadcast, locale) : broadcastCopy(locale).heading };
}
export default async function WatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ locale }, { id }] = await Promise.all([getLocale(), params]);
  const broadcast = await getBroadcastById(id);
  if (!broadcast || !broadcast.visible) notFound();
  const copy = broadcastCopy(locale);
  const products = broadcast.productIds.length ? (await getProducts()).filter(product => broadcast.productIds.includes(product.id)) : [];
  const platform = broadcastEmbed(broadcast.url).platform;
  return <div className="shell page-space">
    <Link className="text-link watch-detail-back" href="/watch">← {copy.back}</Link>
    <div className="watch-detail-intro"><span className="eyebrow">{platform === "youtube" ? "YouTube" : "Facebook"} · {broadcast.kind === "introduction" ? copy.introduction : broadcast.status === "live" ? copy.live : broadcast.status === "scheduled" ? copy.scheduled : copy.replay}</span><h1>{broadcastTitle(broadcast, locale)}</h1></div>
    <div className="watch-detail-player"><BroadcastPlayer broadcast={broadcast} locale={locale} priority /></div>
    <section className="watch-detail-products"><div className="section-heading"><h2>{copy.products}</h2><Link className="text-link" href="/shop">{copy.browseProducts} →</Link></div>{products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <p className="broadcast-empty">{copy.noProducts}</p>}</section>
  </div>;
}
