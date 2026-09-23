import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatMoney } from "@/lib/format";
import type { CartSource, Product } from "@/types/commerce";

export function ProductCard({ product, source }: { product: Product; source?: CartSource }) {
  const productUrl = `/product/${product.slug}${source ? `?room=${source.liveSessionId}` : ""}`;
  return (
    <article className="product-card">
      <Link className="product-image-wrap" href={productUrl}>
        {product.featured && <span className="corner-label">严选</span>}
        <img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt={product.images[0]?.altText || product.title} loading="lazy" />
      </Link>
      <div className="product-card-copy">
        <span className="product-category">{product.category}</span>
        <Link className="product-title" href={productUrl}>{product.title}</Link>
        <div className="product-card-bottom">
          <div><strong>{formatMoney(product.priceAmount, product.currency)}</strong><small>{product.isDemo ? "Sample · 演示商品" : product.stockQty > 0 ? `${product.stockQty} in stock · 件现货` : "Sold out · 售罄"}</small></div>
          <AddToCartButton productId={product.id} source={source} disabled={product.stockQty < 1} compact />
        </div>
      </div>
    </article>
  );
}
