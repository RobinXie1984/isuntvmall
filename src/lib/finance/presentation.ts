import type { FinancePageView } from "./view";
export type FinanceList = { count: number; page: number; items: Array<{
 id: string; status: string; currency: string; total_amount: number | null; payment_intent_id: string | null; payment: { accountId: string; livemode: boolean } | null;
 snapshot: { id: string; checked_at: string; amount_captured: number; amount_refunded: number; created_at: string; facts?: { fee?: number | null; net?: number | null } } | null;
 refund_requests: Array<{ id: string; status: string }>;
 commands: Array<{ id: string; order_id: string; status: string; provider_refund_id: string | null; created_at: string }>;
}> };
export function financeView(data: FinanceList, enabled: boolean): FinancePageView {
 return { page: data.page, hasMore: (data.page + 1) * 25 < data.count,
  orders: data.items.map(o => ({ id: o.id, status: o.status, currency: o.currency,
   paidAmount: o.snapshot?.amount_captured ?? null, remainingAmount: o.snapshot ? o.snapshot.amount_captured - o.snapshot.amount_refunded : null,
   merchantAccountId: o.payment?.accountId ?? null, mode: o.payment ? (o.payment.livemode ? "live" : "test") : null,
   paymentReference: o.payment_intent_id, reconciledAt: o.snapshot?.checked_at ?? null,
   refundRequests: o.refund_requests.map(r => ({ ...r, reason: "" })), refundState: o.commands.at(-1)?.status ?? null,
   canRefund: enabled && ["paid", "review"].includes(o.status) && Boolean(o.snapshot) && !o.commands.some(c => c.status === "succeeded" || c.status === "processing") })),
  commands: data.items.flatMap(o => o.commands.map(c => ({ id: c.id, orderId: o.id, status: c.status, providerReference: c.provider_refund_id, createdAt: c.created_at }))),
  snapshots: data.items.flatMap(o => o.snapshot ? [{ id: o.snapshot.id, orderId: o.id, status: "recorded", createdAt: o.snapshot.created_at }] : []) };
}
function csvCell(value: unknown) {
 const text = value == null ? "" : String(value);
 // Spreadsheet applications interpret formula-looking cells even when quoted.
 const safe = /^\s*[=+@\-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
 return `"${safe.replaceAll('"', '""')}"`;
}
export function financeCsv(data: FinanceList) {
 const rows: unknown[][] = [["order_id", "order_status", "currency", "account_id", "mode", "payment_intent", "captured_minor", "refunded_minor", "fee_minor", "net_minor", "checked_at"]];
 for (const o of data.items) rows.push([o.id, o.status, o.currency, o.payment?.accountId, o.payment ? (o.payment.livemode ? "live" : "test") : null, o.payment_intent_id, o.snapshot?.amount_captured, o.snapshot?.amount_refunded, o.snapshot?.facts?.fee, o.snapshot?.facts?.net, o.snapshot?.checked_at]);
 return rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
