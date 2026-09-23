import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductCard } from "@/components/product/product-card";
import { getProductBySlug, getProducts, getLiveSessions } from "@/lib/data/store";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.title, description: product.description } : { title: "商品不存在" };
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{room?:string}> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const roomId=(await searchParams).room;
  const room=roomId ? (await getLiveSessions()).find(s=>s.id===roomId && s.kol?.status==="active" && s.products.some(p=>p.id===product.id)) : undefined;
  const source=room?.kol ? {liveSessionId:room.id,kolId:room.kol.id} : undefined;
  const related = (await getProducts()).filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);

  return (
    <div className="shell page-space">
      <div className="product-detail">
        <div className="product-detail-image"><img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt={product.images[0]?.altText || product.title} />{product.featured && <span className="corner-label">阳光严选</span>}</div>
        <div className="product-detail-copy"><span className="eyebrow">{product.category} · {product.sku}</span><h1>{product.title}</h1><p className="product-price">{formatMoney(product.priceAmount, product.currency)}</p><p className="product-description">{product.description}</p><div className="stock-line"><span className={product.stockQty > 0 ? "stock-dot" : "stock-dot out"} />{product.isDemo ? "Sample product · 演示商品，非实际库存" : product.stockQty > 0 ? `现货 ${product.stockQty} 件` : "暂时售罄"}</div>{room && <p className="attribution">From / 来源: {room.hostName}</p>}<AddToCartButton source={source} productId={product.id} disabled={product.stockQty < 1} /><div className="product-promises"><div><b>01</b><span><strong>商品展示</strong><small>直播现场看细节</small></span></div><div><b>02</b><span><strong>安全付款</strong><small>支付尚未开放</small></span></div><div><b>03</b><span><strong>清楚订单</strong><small>预览阶段不接收订单</small></span></div></div></div>
      </div>
      {related.length > 0 && <section className="section no-side-padding"><div className="section-heading"><div><span className="eyebrow">MORE TO EXPLORE</span><h2>同类好物</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  );
}
