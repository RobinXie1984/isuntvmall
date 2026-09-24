"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { productImage } from "@/lib/product-image";
import { formatLocalizedMoney } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/locale-provider";
import type { CartSource, Product } from "@/types/commerce";

export function ProductCard({ product, source }: { product: Product; source?: CartSource }) {
  const { t, localize, locale } = useLocale();
  const productUrl = `/product/${product.slug}${source ? `?room=${source.liveSessionId}` : ""}`;
  return (
    <article className="product-card">
      <Link className="product-image-wrap" href={productUrl}>
        {product.featured && <span className="corner-label">{t("Selected", "精選")}</span>}
        <img src={productImage(product)} alt={localize(product.images[0]?.altText || product.title)} loading="lazy" />
      </Link>
      <div className="product-card-copy">
        <span className="product-category">{localize(product.category)}</span>
        <Link className="product-title" href={productUrl}>{localize(product.title)}</Link>
        <div className="product-card-bottom">
          <div><strong>{formatLocalizedMoney(product.priceAmount, product.currency, locale)}</strong><small>{product.isDemo ? t("Sample product", "示範商品") : product.stockQty > 0 ? t(`${product.stockQty} in stock`, `${product.stockQty} 件現貨`) : t("Sold out", "售罄")}</small></div>
          <AddToCartButton productId={product.id} source={source} disabled={product.stockQty < 1} compact />
        </div>
      </div>
    </article>
  );
}
