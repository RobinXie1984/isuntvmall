import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { assertProviderMode, frozenPaymentIdentity, verifyPaymentIdentity, type PaymentIdentity } from "@/lib/stripe/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { BatchError } from "@/lib/batch/contracts";

const idOf = (v: string | { id: string } | null) => typeof v === "string" ? v : v?.id;
const safeCodes = new Set(["FINANCE_FORBIDDEN", "FINANCE_BUSY", "ORDER_NOT_FOUND", "PAYMENT_IDENTITY_MISMATCH", "PAYMENT_IDENTITY_MISSING", "INVALID_RECONCILIATION", "REFUND_APPROVAL_REQUIRED", "REFUND_IN_PROGRESS", "RECONCILIATION_REQUIRED", "REFUND_ALREADY_COMPLETED", "PAID_ORDER_REQUIRED", "REQUEST_CHANGED", "REFUND_FACTS_MISMATCH", "REFUND_COMMAND_NOT_FOUND"]);
export async function financeRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
 const { data, error } = await getSupabaseAdmin().rpc(name, args);
 if (error) throw new BatchError(safeCodes.has(error.message) ? error.message : "FINANCE_OPERATION_FAILED", 409);
 return data as T;
}
type Order = { id: string; checkout_policy: unknown; stripe_payment_intent_id: string | null; total_amount: number | null; currency: string };
export type RefundCommand = { id: string; order_id: string; account_id: string; livemode: boolean; payment_intent_id: string; charge_id: string; amount: number; currency: string; expected_refunded_before: number; idempotency_key: string; provider_refund_id: string | null; status: string; lease_token: string; action: "create" | "reconcile" | "none" };
async function orderForFinance(orderId: string) {
 const { data, error } = await getSupabaseAdmin().from("orders").select("id,checkout_policy,stripe_payment_intent_id,total_amount,currency").eq("id", orderId).single();
 if (error || !data) throw new BatchError("ORDER_NOT_FOUND", 404);
 return data as Order;
}
async function providerFacts(order: Order, identity: PaymentIdentity) {
 if (!order.stripe_payment_intent_id) throw new BatchError("PAYMENT_IDENTITY_MISSING", 409);
 const stripe = getStripe();
 const intent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
 assertProviderMode(identity, intent);
 if (intent.id !== order.stripe_payment_intent_id) throw new BatchError("PAYMENT_IDENTITY_MISMATCH", 409);
 if (intent.status !== "succeeded" || !idOf(intent.latest_charge)) throw new BatchError("PAID_ORDER_REQUIRED", 409);
 const charge = await stripe.charges.retrieve(idOf(intent.latest_charge)!);
 assertProviderMode(identity, charge);
 if (charge.id !== idOf(intent.latest_charge) || idOf(charge.payment_intent) !== intent.id || charge.amount_captured !== order.total_amount || charge.currency !== order.currency || !charge.paid) throw new BatchError("PAYMENT_IDENTITY_MISMATCH", 409);
 const refunds = await stripe.refunds.list({ payment_intent: intent.id, limit: 100 });
 // A truncated list cannot prove that no pending or externally-created refund exists.
 if (refunds.has_more) throw new BatchError("RECONCILIATION_REQUIRED", 409);
 for (const refund of refunds.data) if (idOf(refund.payment_intent) !== intent.id || idOf(refund.charge) !== charge.id || refund.currency !== order.currency) throw new BatchError("PAYMENT_IDENTITY_MISMATCH", 409);
 let fee: number | null = null, net: number | null = null, balanceCurrency: string | null = null;
 const balanceTransactionId = idOf(charge.balance_transaction) ?? null;
 if (balanceTransactionId) {
  const balance = await stripe.balanceTransactions.retrieve(balanceTransactionId);
  // Settlement currency can differ from order currency; never combine unlike amounts.
  balanceCurrency = balance.currency;
  if (balance.currency === order.currency) { fee = balance.fee; net = balance.net; }
 }
 return { paymentIntentId: intent.id, chargeId: charge.id, currency: charge.currency, amountCaptured: charge.amount_captured, amountRefunded: charge.amount_refunded,
  paymentStatus: intent.status, refunds: refunds.data.map(r => ({ id: r.id, amount: r.amount, currency: r.currency, status: r.status })), checkedAt: new Date().toISOString(), fee, net, balanceTransactionId, balanceCurrency, providerRefunds: refunds.data };
}
export async function reconcileOrder(actor: string, orderId: string) {
 const order = await orderForFinance(orderId);
 const identity = await verifyPaymentIdentity(frozenPaymentIdentity(order.checkout_policy));
 const { providerRefunds: _refunds, ...facts } = await providerFacts(order, identity);
 void _refunds;
 return financeRpc("finance_record_reconciliation", { p_actor: actor, p_order: orderId, p_account_id: identity.accountId, p_livemode: identity.livemode, p_facts: facts });
}
export function refundFacts(refund: Stripe.Refund, identity: PaymentIdentity) {
 return { accountId: identity.accountId, livemode: identity.livemode, paymentIntentId: idOf(refund.payment_intent), refundId: refund.id, amount: refund.amount, currency: refund.currency, status: refund.status };
}
export async function executeApprovedRefund(actor: string, orderId: string, refundRequestId: string, requestId: string) {
 // This server flag is independent of new sales; off by default in every template.
 if (process.env.STRIPE_REFUNDS_ENABLED !== "true") throw new BatchError("REFUNDS_DISABLED", 503);
 const order = await orderForFinance(orderId);
 const identity = await verifyPaymentIdentity(frozenPaymentIdentity(order.checkout_policy));
 const prepared = await financeRpc<RefundCommand>("finance_refund_prepare", { p_actor: actor, p_order: orderId, p_refund_request: refundRequestId, p_request: requestId });
 if (prepared.order_id !== order.id || prepared.payment_intent_id !== order.stripe_payment_intent_id || prepared.currency !== order.currency || prepared.account_id !== identity.accountId || prepared.livemode !== identity.livemode) throw new BatchError("PAYMENT_IDENTITY_MISMATCH", 409);
 const command = await financeRpc<RefundCommand>("finance_refund_claim", { p_actor: actor, p_command: prepared.id });
 if (command.action === "none") return { id: command.id, status: command.status };
 try {
  const facts = await providerFacts(order, identity);
  let refund = command.provider_refund_id ? await getStripe().refunds.retrieve(command.provider_refund_id) : facts.providerRefunds.find(r => r.metadata?.commerce_command_id === command.id);
  if (!refund) {
   if (command.action !== "create" || facts.amountRefunded !== command.expected_refunded_before || facts.amountCaptured - facts.amountRefunded !== command.amount || facts.refunds.some(r => ["pending", "requires_action"].includes(r.status ?? ""))) throw new BatchError("RECONCILIATION_REQUIRED", 409);
   refund = await getStripe().refunds.create({ payment_intent: command.payment_intent_id, amount: command.amount, reason: "requested_by_customer", metadata: { commerce_command_id: command.id, order_id: command.order_id } }, { idempotencyKey: command.idempotency_key });
  }
  const completed = await financeRpc<RefundCommand>("finance_refund_complete", { p_actor: actor, p_command: command.id, p_lease: command.lease_token, p_outcome: refund.status === "requires_action" ? "pending" : refund.status ?? "unknown", p_facts: refundFacts(refund, identity), p_error_code: null });
  return { id: completed.id, status: completed.status };
 } catch {
  // Includes unknown network outcomes and provider-response/DB-write races. Never
  // mark as failed or generate a new key on an ambiguous outcome.
  const recovered = await financeRpc<RefundCommand>("finance_refund_complete", { p_actor: actor, p_command: command.id, p_lease: command.lease_token, p_outcome: "unknown", p_facts: {}, p_error_code: "PROVIDER_RECONCILIATION_REQUIRED" }).catch(() => null);
  // A webhook may have confirmed success while the provider response was lost.
  if (recovered?.status === "succeeded") return { id: recovered.id, status: recovered.status };
  // If even the recovery write fails, retain the explicit unknown result; the
  // durable command/lease and original key remain available for reconciliation.
  throw new BatchError("REFUND_OUTCOME_UNKNOWN", 409);
 }
}
