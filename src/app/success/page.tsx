import {getLocale} from "@/lib/locale-server";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/cart/clear-cart-on-success";
import { formatMoney } from "@/lib/format";
import { getCheckoutResult } from "@/lib/stripe/result";

export const dynamic = "force-dynamic";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Payment status","付款狀態"),robots:{index:false,follow:false}};}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const {t,localize}=await getLocale();
  const result = await getCheckoutResult((await searchParams).session_id);
  const paid = result?.paymentStatus === "paid" && result?.orderStatus === "paid";
  const review = result?.orderStatus === "review" || result?.orderStatus === "refunded";
  return (
    <div className="shell page-space confirmation-wrap">
      <ClearCartOnSuccess paid={paid} />
      <div className="confirmation-card">
        <span className={paid ? "confirmation-icon" : "confirmation-icon pending"}>{paid ? "✓" : "…"}</span>
        <span className="eyebrow">{paid ? t("PAYMENT RECEIVED","已收到付款") : t("PAYMENT STATUS","付款狀態")}</span>
        <h1>{paid ? t("Order confirmed","訂單已確認") : review ? t("Order under review","訂單待人工核對") : t("Confirming payment","正在確認付款")}</h1>
        <p>{paid ? t("Your order has been recorded.","訂單已記錄。") : review ? t("Payment requires manual reconciliation. Please do not pay again.","付款需要人工核對，請勿再次付款。") : t("Payment is not yet confirmed. Please do not pay again.","付款尚未確認，請勿重複付款。")}</p>
        {result && <div className="confirmation-details"><div><span>{t("Order","訂單")}</span><strong>{result.orderId ? String(result.orderId).slice(0, 8).toUpperCase() : t("Pending","確認中")}</strong></div><div><span>{t("Order status","訂單狀態")}</span><strong>{localize(result.orderStatus??"pending")}</strong></div>{result.totalAmount !== null && <div><span>{t("Amount","金額")}</span><strong>{formatMoney(Number(result.totalAmount), result.currency)}</strong></div>}</div>}
        <div className="hero-actions"><Link className="button" href="/shop">{t("Continue shopping","繼續選購")}</Link><Link className="button button-secondary" href="/live">{t("Back to rooms","返回直播間")}</Link></div>
      </div>
    </div>
  );
}
