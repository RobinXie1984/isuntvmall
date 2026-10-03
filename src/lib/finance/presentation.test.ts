import { describe, expect, it } from "vitest";
import { financeCsv, financeView, type FinanceList } from "./presentation";
const row: FinanceList["items"][number] = { id: "order", status: "paid", currency: "hkd", total_amount: 1000, payment_intent_id: "pi_fixture", payment: { accountId: "acct_fixture", livemode: false }, snapshot: { id: "snapshot", checked_at: "2026-10-03T12:00:00Z", amount_captured: 1000, amount_refunded: 100, created_at: "2026-10-03T12:00:00Z", facts: { fee: null, net: null } }, refund_requests: [], commands: [] };
const data = (item = row): FinanceList => ({ count: 1, page: 0, items: [item] });
describe("financial presentation", () => {
 it.each(["=CMD()", "+CMD()", "@SUM(1)", "-1+CMD()", "\tCMD()", "\rCMD()", "  =CMD()", "\uFEFF=CMD()"])("neutralizes spreadsheet formula prefix %s", value => { expect(financeCsv(data({ ...row, status: value }))).toContain(`"'${value}"`); });
 it("escapes embedded quotes and preserves CSV row structure", () => { expect(financeCsv(data({ ...row, status: 'quoted,"text"' }))).toContain('"quoted,""text"""'); });
 it("unknown snapshot is not rendered as a zero payment", () => { const view = financeView(data({ ...row, snapshot: null }), true); expect(view.orders[0]).toMatchObject({ paidAmount: null, remainingAmount: null, canRefund: false }); });
 it("keeps unknown fees and net blank rather than zero", () => { expect(financeCsv(data())).toContain('"1000","100","","","2026-10-03T12:00:00Z"'); });
 it("template disabled gate and successful commands prevent another refund", () => { expect(financeView(data(), false).orders[0].canRefund).toBe(false); expect(financeView(data({ ...row, commands: [{ id: "command", order_id: "order", status: "succeeded", provider_refund_id: "re_fixture", created_at: "2026-10-03" }] }), true).orders[0].canRefund).toBe(false); });
 it("UI does not expose idempotency keys or lease tokens from raw command rows", () => { const raw = { ...row, commands: [{ id: "command", order_id: "order", status: "pending", provider_refund_id: "re_fixture", created_at: "2026-10-03", lease_token: "PRIVATE_LEASE", idempotency_key: "PRIVATE_KEY" }] }; expect(JSON.stringify(financeView(data(raw), true))).not.toContain("PRIVATE_"); });
});
