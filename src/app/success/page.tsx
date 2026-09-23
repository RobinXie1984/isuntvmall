import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/cart/clear-cart-on-success";
import { formatMoney } from "@/lib/format";
import { getCheckoutResult } from "@/lib/stripe/result";

export const dynamic = "force-dynamic";
export const metadata = { title: "付款结果" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const result = await getCheckoutResult((await searchParams).session_id);
  const paid = result?.paymentStatus === "paid" && result?.orderStatus === "paid";
  const review = result?.orderStatus === "review" || result?.orderStatus === "refunded";
  return (
    <div className="shell page-space confirmation-wrap">
      <ClearCartOnSuccess paid={paid} />
      <div className="confirmation-card">
        <span className={paid ? "confirmation-icon" : "confirmation-icon pending"}>{paid ? "✓" : "…"}</span>
        <span className="eyebrow">{paid ? "PAYMENT RECEIVED" : "PAYMENT STATUS"}</span>
        <h1>{paid ? "Order confirmed · 订单已确认" : review ? "Order under review · 订单待人工核对" : "Confirming payment · 正在确认付款"}</h1>
        <p>{paid ? "Your order has been recorded. 订单已记录。" : review ? "Payment requires manual reconciliation. Please do not pay again. 付款需要人工核对，请勿再次付款。" : "Payment is not yet confirmed. Please do not pay again. 付款尚未确认，请勿重复付款。"}</p>
        {result && <div className="confirmation-details"><div><span>订单</span><strong>{result.orderId ? String(result.orderId).slice(0, 8).toUpperCase() : "确认中"}</strong></div><div><span>订单状态</span><strong>{result.orderStatus}</strong></div>{result.totalAmount !== null && <div><span>金额</span><strong>{formatMoney(Number(result.totalAmount), result.currency)}</strong></div>}</div>}
        <div className="hero-actions"><Link className="button" href="/shop">继续逛逛</Link><Link className="button button-secondary" href="/live">回到直播</Link></div>
      </div>
    </div>
  );
}
