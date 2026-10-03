import { z } from "zod";
import { requireStaff, requirePermission } from "@/lib/staff/auth";
import { requireBatchOrigin } from "@/lib/batch/auth";
import { readBatchJson } from "@/lib/batch/contracts";
import { privateResponse, operationFailure } from "@/lib/admin/response";
import { financeRpc, reconcileOrder, executeApprovedRefund } from "@/lib/finance/stripe";
import { financeView, financeCsv, type FinanceList } from "@/lib/finance/presentation";
import { paymentOperationsConfigured } from "@/lib/stripe/runtime";
const schema = z.discriminatedUnion("action", [
 z.object({ action: z.literal("reconcile"), orderId: z.uuid() }).strict(),
 z.object({ action: z.literal("refund"), orderId: z.uuid(), refundRequestId: z.uuid(), requestId: z.uuid() }).strict(),
]);
export async function GET(request: Request) {
 try {
  const staff = await requireStaff(request); requirePermission(staff, "finance.manage");
  const url = new URL(request.url); const page = z.coerce.number().int().min(0).max(100000).parse(url.searchParams.get("page") ?? 0);
  const data = await financeRpc<FinanceList>("finance_list", { p_actor: staff.id, p_page: page });
  if (url.searchParams.get("format") === "csv") return new Response(financeCsv(data), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="reconciliation-page-${page + 1}.csv"`, "Cache-Control": "private, no-store", "Vary": "Cookie" } });
  return privateResponse(financeView(data, paymentOperationsConfigured() && process.env.STRIPE_REFUNDS_ENABLED === "true"));
 } catch (error) { return operationFailure(error); }
}
export async function POST(request: Request) {
 try {
  requireBatchOrigin(request); const staff = await requireStaff(request); requirePermission(staff, "finance.manage");
  const input = schema.parse(await readBatchJson(request, 8192));
  const data = input.action === "reconcile" ? await reconcileOrder(staff.id, input.orderId) : await executeApprovedRefund(staff.id, input.orderId, input.refundRequestId, input.requestId);
  // No provider raw payload, lease or idempotency secrets are exposed to the UI.
  void data; return privateResponse({ ok: true });
 } catch (error) { return operationFailure(error); }
}
