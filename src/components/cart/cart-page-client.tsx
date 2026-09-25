"use client";

import { cartLineKey, CHECKOUT_HOLD_REASON } from "@/lib/cart";
import { useMemo, useState } from "react";
import Link from "next/link";
import { isClosedAttempt } from "@/lib/checkout-attempt";
import { CheckoutVerification } from "@/components/cart/checkout-verification";
import { useCart } from "@/components/cart/cart-provider";
import { productTitle, productImageAlt } from "@/lib/product-copy";
import { productImage } from "@/lib/product-image";
import { formatLocalizedMoney } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/locale-provider";
import type { Product, LiveSession } from "@/types/commerce";

export function CartPageClient({ products, checkoutReady, sessions, compact = false, cancelledAttemptId }: { products: Product[]; checkoutReady: boolean; sessions: LiveSession[]; compact?: boolean; cancelledAttemptId?: string }) {
  const { t, localize, locale } = useLocale();
  const { items, setQuantity, removeItem, getCheckoutAttempt, clearCheckoutAttempt, turnstileSiteKey } = useCart();
  const [challengeAttempt,setChallengeAttempt]=useState<string|null>(null);
  const [proof,setProof]=useState<{attemptId:string;token:string}|null>(null);
  const [challengeRevision,setChallengeRevision]=useState(0);
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
    setError("");
    const attempt = getCheckoutAttempt();
    if(!turnstileSiteKey){setError(t("Checkout verification is not ready yet.","結帳驗證尚未準備完成。"));return;}
    if(challengeAttempt!==attempt.id||proof?.attemptId!==attempt.id){setProof(null);setChallengeAttempt(attempt.id);setError(t("Complete the verification below, then continue.","請完成下方驗證後繼續。"));return;}
    setBusy(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, checkoutAttemptId: attempt.id, turnstileToken:proof.token }),
      });
      const result = (await response.json()) as { ok?: boolean; url?: string; error?: string; code?: string; expiresAt?: string };
      if (result.code === "CHECKOUT_PAYMENT_PENDING") setPaymentPending(true);
      if (isClosedAttempt(result.code)) {
        clearCheckoutAttempt();
      }
      if(result.code==="CHECKOUT_VERIFICATION_REQUIRED"){setProof(null);setChallengeRevision(value=>value+1);setError(t("Please complete a fresh verification and retry the same checkout.","請重新驗證，然後重試同一筆結帳。"));setBusy(false);return;}
      if(["CHECKOUT_CLIENT_RATE_LIMIT","CHECKOUT_CLIENT_ACTIVE_LIMIT","CHECKOUT_STORE_ACTIVE_LIMIT"].includes(result.code??"")){setError(t("Checkout is temporarily busy or you have too many open attempts. Complete or close an existing unpaid checkout, or try later.","結帳暫時繁忙，或你的未完成請求過多。請完成或關閉現有的未付款結帳，或稍後再試。"));setBusy(false);return;}
      if(result.code==="CHECKOUT_CLIENT_CHANGED"){setError(t("Your connection changed. Resume using the original connection or check the existing checkout before paying again.","你的連線已變更。請使用原本的連線繼續，或先確認現有結帳狀態，勿重複付款。"));setBusy(false);return;}
      if (!response.ok || !result.url) throw new Error(t("Checkout could not be started. Check your payment status before trying again.", "暫時無法開始結帳，請先確認付款狀態，再重新嘗試。"));
      window.location.assign(result.url);
    } catch {
      setError(t("Checkout could not be started. Check your payment status before trying again.", "暫時無法開始結帳，請先確認付款狀態，再重新嘗試。"));
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
      if (!response.ok || !result.ok) throw new Error(t("Cancellation could not be confirmed. Please check your payment status.", "尚未確認取消，請核對付款狀態。"));
      if (result.status === "cancelled" || result.status === "failed") {
        clearCheckoutAttempt();
        setCancelled(true);
      } else {
        setPaymentPending(true);
        setError(t("Cancellation was not confirmed. Check your payment status before paying again.", "尚未確認取消，請先核對付款狀態，勿重複付款。"));
        if (result.sessionId && /^cs_(?:test_|live_)?[a-zA-Z0-9_]+$/.test(result.sessionId)) setConfirmationUrl(`/success?session_id=${encodeURIComponent(result.sessionId)}`);
      }
    } catch {
      setError(t("Cancellation could not be confirmed. Please check your payment status.", "尚未確認取消，請核對付款狀態。"));
    } finally { setBusy(false); }
  }

  const attemptNotice = cancelledAttemptId && checkoutReady ? <div className="notice">
    <p>{cancelled ? t("Unpaid checkout closed. You can start again when ready.", "未付款請求已關閉，可重新開始結帳。") : t("Returned from checkout. Check your status before paying again.", "已從結帳返回，請先確認狀態，勿重複付款。")}</p>
    {!cancelled && !paymentPending && <button className="text-button" type="button" disabled={busy} onClick={cancelAttempt}>{t("Close unpaid checkout", "關閉未付款請求")}</button>}
    {confirmationUrl && <Link className="text-link" href={confirmationUrl}>{t("Check order status →", "查看訂單狀態 →")}</Link>}
  </div> : null;

  const Heading = compact ? "h2" : "h1";

  if (!items.length) {
    return (
      <div className="empty-state">
        {attemptNotice}
        {error && <p className="form-error" role="alert">{error}</p>}
        <span className="empty-icon" aria-hidden="true">＋</span>
        <Heading>{t("Your bag is empty", "購物袋還是空的")}</Heading>
        <p>{t("Explore the room selections or discover something in the shop.", "探索直播間精選，或在商店挑一件真正喜歡的商品。")}</p>
        {!compact && <Link className="button" href="/shop">{t("Explore the shop", "選購商品")}</Link>}
      </div>
    );
  }

  return (
    <div className={`cart-layout${compact ? " compact-cart" : ""}`}>
      <div className="cart-lines">
        <div className="section-heading compact-heading">
          <div><span className="eyebrow">{t("YOUR CART", "購物袋")}</span><Heading>{t("Your bag", "我的購物袋")}</Heading></div>
          <span className="muted">{t(`${items.reduce((sum, item) => sum + item.quantity, 0)} items`, `${items.reduce((sum, item) => sum + item.quantity, 0)} 件`)}</span>
        </div>
        {rows.filter(row => !row.product).map(({item}) => <article className="notice warning" key={cartLineKey(item)}>
          <p>{t("Product unavailable", "商品已無法選購")}</p><button type="button" className="text-button" onClick={() => removeItem(cartLineKey(item))}>{t("Remove unavailable item", "移除商品")}</button>
        </article>)}
        {rows.map(({ item, product }) => product && (
          <article className="cart-line" key={cartLineKey(item)}>
            <img src={productImage(product)} alt={productImageAlt(product, locale, localize)} />
            <div className="cart-line-copy">
              <span className="product-category">{localize(product.category)}</span>
              {compact ? <strong>{productTitle(product, locale, localize)}</strong> : <Link href={`/product/${product.slug}`}>{productTitle(product, locale, localize)}</Link>}
              <span>{formatLocalizedMoney(product.priceAmount, product.currency, locale)}</span>
              <small className="attribution">{item.source ? t(`From: ${localize(sessions.find(s=>s.id===item.source?.liveSessionId)?.hostName ?? t("Room unavailable", "直播間無法使用"))}`, `來自：${localize(sessions.find(s=>s.id===item.source?.liveSessionId)?.hostName ?? t("Room unavailable", "直播間無法使用"))}`) : t("Direct selection", "直接選購")}</small>
              <div className="quantity-control" aria-label={t(`${productTitle(product, locale, localize)} quantity`, `${productTitle(product, locale, localize)}數量`)}>
                <button type="button" onClick={() => setQuantity(cartLineKey(item), item.quantity - 1)} aria-label={t("Decrease quantity", "減少數量")}>−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => setQuantity(cartLineKey(item), item.quantity + 1)} aria-label={t("Increase quantity", "增加數量")}>＋</button>
                <button className="text-button" type="button" onClick={() => removeItem(cartLineKey(item))}>{t("Remove", "移除")}</button>
              </div>
            </div>
            <strong>{formatLocalizedMoney(product.priceAmount * item.quantity, product.currency, locale)}</strong>
          </article>
        ))}
      </div>
      <aside className="order-summary">
        <span className="eyebrow">{t("ORDER SUMMARY", "訂單摘要")}</span>
        <h2>{t("Order subtotal", "訂單小計")}</h2>
        <div className="summary-row"><span>{t("Items", "商品")}</span><strong>{formatLocalizedMoney(subtotal, currency, locale)}</strong></div>
        <div className="summary-row"><span>{t("Shipping & tax", "運費與稅費")}</span><span>{t("At checkout", "結帳時計算")}</span></div>
        <div className="summary-total"><span>{t("Estimated subtotal", "預計小計")}</span><strong>{formatLocalizedMoney(subtotal, currency, locale)}</strong></div>
        {attemptNotice}
        {!checkoutReady && <p className="notice warning">{localize(CHECKOUT_HOLD_REASON)}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {checkoutReady&&challengeAttempt&&turnstileSiteKey&&<CheckoutVerification key={`${challengeAttempt}-${challengeRevision}`} attemptId={challengeAttempt} siteKey={turnstileSiteKey} onToken={token=>setProof(token?{attemptId:challengeAttempt,token}:null)}/>}
        <button className="button button-block" type="button" disabled={busy || !checkoutReady || paymentPending || rows.some(row => !row.product)} onClick={checkout}>
          {busy ? t("Processing…", "處理中…") : t("Checkout", "結帳")}
        </button>
        <p className="secure-note">{t("Your selections are saved in this browser.", "所選商品儲存在目前瀏覽器。")}</p>
      </aside>
    </div>
  );
}
