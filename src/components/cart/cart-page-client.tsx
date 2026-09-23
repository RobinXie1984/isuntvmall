"use client";

import { cartLineKey, CHECKOUT_HOLD_REASON } from "@/lib/cart";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/format";
import type { Product, LiveSession } from "@/types/commerce";

export function CartPageClient({ products, checkoutReady, sessions }: { products: Product[]; checkoutReady: boolean; sessions: LiveSession[] }) {
  const { items, setQuantity, removeItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rows = useMemo(
    () => items.map((item) => ({ item, product: products.find((product) => product.id === item.productId) })).filter((row) => row.product),
    [items, products],
  );
  const subtotal = rows.reduce((sum, row) => sum + (row.product?.priceAmount ?? 0) * row.item.quantity, 0);
  const currency = rows[0]?.product?.currency ?? "hkd";

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "暂时无法开始结账。");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "暂时无法开始结账。");
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">阳</span>
        <h1>Your bag is empty · 购物袋还是空的</h1>
        <p>从直播精选或全部商品里，先挑一件真正喜欢的。</p>
        <Link className="button" href="/shop">去逛商品</Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-lines">
        <div className="section-heading compact-heading">
          <div><span className="eyebrow">YOUR CART</span><h1>Your bag · 购物袋</h1></div>
          <span className="muted">{items.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
        </div>
        {rows.map(({ item, product }) => product && (
          <article className="cart-line" key={cartLineKey(item)}>
            <img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt={product.images[0]?.altText || product.title} />
            <div className="cart-line-copy">
              <span className="product-category">{product.category}</span>
              <Link href={`/product/${product.slug}`}>{product.title}</Link>
              <span>{formatMoney(product.priceAmount, product.currency)}</span>
              <small className="attribution">{item.source ? `From / 来源: ${sessions.find(s=>s.id===item.source?.liveSessionId)?.hostName ?? "Room unavailable / 直播间不可用"}` : "Direct selection · 直接选购"}</small>
              <div className="quantity-control" aria-label={`${product.title} 数量`}>
                <button type="button" onClick={() => setQuantity(cartLineKey(item), item.quantity - 1)} aria-label="减少数量">−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => setQuantity(cartLineKey(item), item.quantity + 1)} aria-label="增加数量">＋</button>
                <button className="text-button" type="button" onClick={() => removeItem(cartLineKey(item))}>移除</button>
              </div>
            </div>
            <strong>{formatMoney(product.priceAmount * item.quantity, product.currency)}</strong>
          </article>
        ))}
      </div>
      <aside className="order-summary">
        <span className="eyebrow">ORDER SUMMARY</span>
        <h2>订单小计</h2>
        <div className="summary-row"><span>商品</span><strong>{formatMoney(subtotal, currency)}</strong></div>
        <div className="summary-row"><span>运费与税费</span><span>结账时计算</span></div>
        <div className="summary-total"><span>预计小计</span><strong>{formatMoney(subtotal, currency)}</strong></div>
        {!checkoutReady && <p className="notice warning">{CHECKOUT_HOLD_REASON}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-block" type="button" disabled={busy || !checkoutReady} onClick={checkout}>
          {busy ? "正在前往 Stripe…" : "Checkout · 结账"}
        </button>
        <p className="secure-note">Your selections are saved in this browser. 选品保存在当前浏览器。</p>
      </aside>
    </div>
  );
}
