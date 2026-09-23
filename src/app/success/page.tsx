import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/cart/clear-cart-on-success";
import { formatMoney } from "@/lib/format";
import { getCheckoutResult } from "@/lib/stripe/result";

export const dynamic = "force-dynamic";
export const metadata = { title: "付款结果" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const result = await getCheckoutResult((await searchParams).session_id);
  const paid = result?.paymentStatus === "paid";
  return (
    <div className="shell page-space confirmation-wrap">
      <ClearCartOnSuccess paid={paid} />
      <div className="confirmation-card">
        <span className={paid ? "confirmation-icon" : "confirmation-icon pending"}>{paid ? "✓" : "…"}</span>
        <span className="eyebrow">{paid ? "PAYMENT RECEIVED" : "PAYMENT STATUS"}</span>
        <h1>{paid ? "谢谢，订单已收到。" : "正在确认付款"}</h1>
        <p>{paid ? `我们会把订单确认发送到 ${result?.customerEmail || "你的邮箱"}。` : "付款结果尚未确认，请不要重复付款。稍后可查看邮件或联系运营人员。"}</p>
        {result && <div className="confirmation-details"><div><span>订单</span><strong>{result.orderId ? String(result.orderId).slice(0, 8).toUpperCase() : "确认中"}</strong></div><div><span>订单状态</span><strong>{result.orderStatus}</strong></div>{result.totalAmount !== null && <div><span>金额</span><strong>{formatMoney(Number(result.totalAmount), result.currency)}</strong></div>}</div>}
        <div className="hero-actions"><Link className="button" href="/shop">继续逛逛</Link><Link className="button button-secondary" href="/live">回到直播</Link></div>
      </div>
    </div>
  );
}
