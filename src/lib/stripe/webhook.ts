import "server-only";

import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ShippingDetails = {
  name?: string | null;
  address?: Stripe.Address | null;
};

function sessionShipping(session: Stripe.Checkout.Session): ShippingDetails | null {
  const expanded = session as Stripe.Checkout.Session & {
    shipping_details?: ShippingDetails | null;
    collected_information?: { shipping_details?: ShippingDetails | null } | null;
  };
  return expanded.collected_information?.shipping_details ?? expanded.shipping_details ?? null;
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

export async function handleStripeEvent(event: Stripe.Event) {
  const supabase = getSupabaseAdmin();

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return;
    const shipping = sessionShipping(session);
    const { error } = await supabase.rpc("fulfill_order", {
      p_stripe_session_id: session.id,
      p_payment_intent_id: paymentIntentId(session),
      p_customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      p_customer_name: shipping?.name ?? session.customer_details?.name ?? null,
      p_shipping_address: shipping?.address ?? session.customer_details?.address ?? null,
      p_amount_subtotal: session.amount_subtotal,
      p_amount_shipping: session.total_details?.amount_shipping ?? null,
      p_amount_tax: session.total_details?.amount_tax ?? null,
      p_amount_total: session.amount_total,
    });
    if (error) throw new Error(`Order fulfillment failed: ${error.message}`);
    return;
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const nextStatus = event.type === "checkout.session.expired" ? "cancelled" : "failed";
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("stripe_checkout_session_id", session.id)
      .eq("status", "pending");
    if (error) throw new Error(`Could not update failed checkout: ${error.message}`);
  }
}
