"use client";

import { SourcePhoto } from "./source-photo";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { productTitle, productImageAlt } from "@/lib/product-copy";
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
        {product.sourceListing?<SourcePhoto product={product} alt={productImageAlt(product,locale,localize)} lazy/>:<img src={productImage(product)} alt={productImageAlt(product, locale, localize)} loading="lazy" />}
      </Link>
      <div className="product-card-copy">
        <span className="product-category">{localize(product.category)}</span>
        <Link className="product-title" href={productUrl}>{productTitle(product, locale, localize)}</Link>
        <div className="product-card-bottom">
          <div><strong>{product.sourceListing && new Set(product.sourceListing.variants.map(v=>v.priceAmount)).size > 1 && t("From ", "起價 ", "最低価格 ")}{formatLocalizedMoney(product.priceAmount, product.currency, locale)}</strong><small>{product.sourceListing ? t("SunTVMall collection", "SunTVMall 商品", "SunTVMall コレクション") : product.isDemo ? t("Sample product", "示範商品") : product.stockQty > 0 ? t(`${product.stockQty} in stock`, `${product.stockQty} 件現貨`, `在庫${product.stockQty}点`) : t("Sold out", "售罄")}</small></div>
          {product.sourceListing ? <Link className="button source-card-link" href={productUrl}>{t("Details", "詳情", "詳細")}</Link> : <AddToCartButton productId={product.id} source={source} disabled={product.stockQty < 1} compact />}
        </div>
      </div>
    </article>
  );
}
