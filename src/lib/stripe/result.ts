import "server-only";
import { paymentOperationsConfigured, verifyPaymentIdentity, frozenPaymentIdentity, assertProviderMode } from "./runtime";

import { hasStripeConfig, hasSupabaseConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getCheckoutResult(sessionId: string | undefined) {
  if (!paymentOperationsConfigured()) return null;
  if (!sessionId || !/^cs_(?:test_|live_)?[a-zA-Z0-9_]+$/.test(sessionId)) return null;
  if (!hasStripeConfig() || !hasSupabaseConfig()) return null;

  const identity = await verifyPaymentIdentity();
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  assertProviderMode(identity, session);
  const { data: order, error } = await getSupabaseAdmin()
    .from("orders")
    .select("id, status, total_amount, currency, customer_email, checkout_policy")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`Could not load order confirmation: ${error.message}`);

  if (!order) return null;
  const frozen = frozenPaymentIdentity(order.checkout_policy);
  if (frozen.accountId !== identity.accountId || frozen.livemode !== identity.livemode || session.client_reference_id !== order.id) throw new Error("Payment identity mismatch.");
  return {
    sessionId,
    paymentStatus: session.payment_status,
    orderStatus: order?.status ?? "unknown",
    orderId: order?.id ?? session.client_reference_id ?? null,
    totalAmount: order?.total_amount ?? session.amount_total,
    currency: order?.currency ?? session.currency ?? "usd",
    customerEmail: order?.customer_email ?? session.customer_details?.email ?? session.customer_email ?? null,
  };
}
