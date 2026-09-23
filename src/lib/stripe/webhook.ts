import "server-only";
import type Stripe from "stripe";
import { checkoutReleaseReady } from "@/lib/cart";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const idOf = (value: string | {id:string} | null | undefined) => typeof value === "string" ? value : value?.id ?? null;
export async function handleStripeEvent(event: Stripe.Event) {
 if(!checkoutReleaseReady())throw new Error("Checkout is on hold.");
 const supabase=getSupabaseAdmin();
 if(["checkout.session.completed","checkout.session.expired","checkout.session.async_payment_succeeded","checkout.session.async_payment_failed"].includes(event.type)){
  const session=event.data.object as Stripe.Checkout.Session;
  const orderId=session.metadata?.order_id;
  if(!orderId || !/^[0-9a-f-]{36}$/i.test(orderId) || session.client_reference_id!==orderId || session.mode!=="payment")throw new Error("Invalid checkout reference.");
  const shipping=session.collected_information?.shipping_details;
  const {data,error}=await supabase.rpc("process_checkout_event",{
   p_event_id:event.id,p_type:event.type,p_order_id:orderId,p_session_id:session.id,
   p_facts:{payment_status:session.payment_status,payment_intent_id:idOf(session.payment_intent),currency:session.currency,amount_subtotal:session.amount_subtotal,amount_total:session.amount_total,amount_shipping:session.total_details?.amount_shipping ?? null,amount_tax:session.total_details?.amount_tax ?? null,amount_discount:session.total_details?.amount_discount ?? null,customer_email:session.customer_details?.email ?? session.customer_email,customer_name:shipping?.name ?? session.customer_details?.name,shipping_address:shipping?.address ?? session.customer_details?.address ?? null},
  });
  if(error || data==='unknown_order')throw new Error("Checkout event could not be recorded.");
  return data;
 }
 if(["charge.refunded","charge.dispute.created","refund.created","refund.updated","refund.failed"].includes(event.type)){
  const object=event.data.object as {payment_intent?:string|{id:string}|null};
  const intent=idOf(object.payment_intent);
  if(!intent)throw new Error("Payment exception has no intent reference.");
  const {error}=await supabase.rpc("flag_payment_review",{p_event_id:event.id,p_type:event.type,p_payment_intent:intent});
  if(error)throw new Error("Payment exception could not be recorded.");
  return "review";
 }
 return "ignored";
}
