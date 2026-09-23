import "server-only";

import { hasStripeConfig, hasSupabaseConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function getCheckoutResult(sessionId: string | undefined) {
  if (!sessionId || !/^cs_(?:test_|live_)?[a-zA-Z0-9_]+$/.test(sessionId)) return null;
  if (!hasStripeConfig() || !hasSupabaseConfig()) return null;

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const { data: order, error } = await getSupabaseAdmin()
    .from("orders")
    .select("id, status, total_amount, currency, customer_email")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error) throw new Error(`Could not load order confirmation: ${error.message}`);

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
