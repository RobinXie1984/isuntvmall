"use client";

import { cartLineKey, CHECKOUT_HOLD_REASON } from "@/lib/cart";
import { useMemo, useState } from "react";
import Link from "next/link";
import { isClosedAttempt } from "@/lib/checkout-attempt";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/format";
import type { Product, LiveSession } from "@/types/commerce";

export function CartPageClient({ products, checkoutReady, sessions, compact = false, cancelledAttemptId }: { products: Product[]; checkoutReady: boolean; sessions: LiveSession[]; compact?: boolean; cancelledAttemptId?: string }) {
  const { items, setQuantity, removeItem, getCheckoutAttempt, clearCheckoutAttempt } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const rows = useMemo(
    () => items.map((item) => ({ item, product: products.find((product) => product.id === item.productId) })),
    [items, products],
  );
  const subtotal = rows.reduce((sum, row) => sum + (row.product?.priceAmount ?? 0) * row.item.quantity, 0);
  const currency = rows[0]?.product?.currency ?? "hkd";

  async function checkout() {
    if (!checkoutReady || busy) return;
    setBusy(true);
    setError("");
    try {
      const attempt = getCheckoutAttempt();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, checkoutAttemptId: attempt.id }),
      });
      const result = (await response.json()) as { ok?: boolean; url?: string; error?: string; code?: string; expiresAt?: string };
      if (result.code === "CHECKOUT_PAYMENT_PENDING") setPaymentPending(true);
      if (isClosedAttempt(result.code)) {
        clearCheckoutAttempt();
      }
      if (!response.ok || !result.url) throw new Error(result.error || "暂时无法开始结账。");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "暂时无法开始结账。");
      setBusy(false);
    }
  }

  async function cancelAttempt() {
    if (!checkoutReady || busy || !cancelledAttemptId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/cancel", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({checkoutAttemptId:cancelledAttemptId})});
      const result = await response.json() as {ok?:boolean;error?:string;status?:string;sessionId?:string | null};
      if (!response.ok || !result.ok) throw new Error(result.error || "Cancellation could not be confirmed. Please retry. 尚未确认取消，请重试。");
      if (result.status === "cancelled" || result.status === "failed") {
        clearCheckoutAttempt();
        setCancelled(true);
      } else {
        setPaymentPending(true);
        setError("Cancellation was not confirmed. Check your payment status before paying again. 尚未确认取消，请先核对付款状态，勿重复付款。");
        if (result.sessionId && /^cs_(?:test_|live_)?[a-zA-Z0-9_]+$/.test(result.sessionId)) setConfirmationUrl(`/success?session_id=${encodeURIComponent(result.sessionId)}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cancellation could not be confirmed. 尚未确认取消。");
    } finally { setBusy(false); }
  }

  const attemptNotice = cancelledAttemptId && checkoutReady ? <div className="notice">
    <p>{cancelled ? "Unpaid checkout closed. You can start again when ready. 未付款请求已关闭，可重新发起。" : "Returned from checkout. Check your status before paying again. 从结账返回，请先确认状态，勿重复付款。"}</p>
    {!cancelled && !paymentPending && <button className="text-button" type="button" disabled={busy} onClick={cancelAttempt}>Close unpaid checkout · 关闭未付款请求</button>}
    {confirmationUrl && <Link className="text-link" href={confirmationUrl}>Check order status · 查看订单状态 →</Link>}
  </div> : null;

  const Heading = compact ? "h2" : "h1";

  if (!items.length) {
    return (
      <div className="empty-state">
        {attemptNotice}
        {error && <p className="form-error" role="alert">{error}</p>}
        <span className="empty-icon">阳</span>
        <Heading>Your bag is empty · 购物袋还是空的</Heading>
        <p>从直播精选或全部商品里，先挑一件真正喜欢的。</p>
        {!compact && <Link className="button" href="/shop">去逛商品</Link>}
      </div>
    );
  }

  return (
    <div className={`cart-layout${compact ? " compact-cart" : ""}`}>
      <div className="cart-lines">
        <div className="section-heading compact-heading">
          <div><span className="eyebrow">YOUR CART</span><Heading>Your bag · 购物袋</Heading></div>
          <span className="muted">{items.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
        </div>
        {rows.filter(row => !row.product).map(({item}) => <article className="notice warning" key={cartLineKey(item)}>
          <p>Product unavailable · 商品已不可用</p><button type="button" className="text-button" onClick={() => removeItem(cartLineKey(item))}>Remove unavailable item · 移除</button>
        </article>)}
        {rows.map(({ item, product }) => product && (
          <article className="cart-line" key={cartLineKey(item)}>
            <img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt={product.images[0]?.altText || product.title} />
            <div className="cart-line-copy">
              <span className="product-category">{product.category}</span>
              {compact ? <strong>{product.title}</strong> : <Link href={`/product/${product.slug}`}>{product.title}</Link>}
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
        {attemptNotice}
        {!checkoutReady && <p className="notice warning">{CHECKOUT_HOLD_REASON}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-block" type="button" disabled={busy || !checkoutReady || paymentPending || rows.some(row => !row.product)} onClick={checkout}>
          {busy ? "正在前往 Stripe…" : "Checkout · 结账"}
        </button>
        <p className="secure-note">Your selections are saved in this browser. 选品保存在当前浏览器。</p>
      </aside>
    </div>
  );
}
