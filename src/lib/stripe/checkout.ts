import "server-only";
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { CHECKOUT_HOLD_REASON, checkoutInputSchema, checkoutReleaseReady } from "@/lib/cart";
import { getSiteUrl, hasSupabaseConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export class CheckoutError extends Error {
  constructor(public code: string, message: string, public httpStatus = 409) { super(message); }
}
function checkoutGate() {
  if (!checkoutReleaseReady()) throw new CheckoutError("CHECKOUT_HOLD", CHECKOUT_HOLD_REASON, 503);
  if (!hasSupabaseConfig()) throw new CheckoutError("CHECKOUT_HOLD", "Ordering is not configured.", 503);
}
interface Policy { siteUrl: string; shippingRate: string | null; automaticTax: boolean; countries: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] }
interface ReservedOrder {
 id: string; status: string; currency: string; subtotal_amount: number; reservation_expires_at: string;
 stripe_checkout_session_id: string | null; checkout_policy: Policy;
 order_items: Array<{ id:string;product_id:string;sku:string;title:string;unit_amount:number;quantity:number }>;
}
function policy(requestOrigin: string): Policy {
 const supported = new Set(["HK","SG","MY","US","GB","AU","CA","CN","TW","JP","KR","NZ","TH","PH","VN","ID","DE","FR","IT","ES","NL"]);
 const countries = (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES || "HK").split(",").map(s=>s.trim().toUpperCase()).filter(s=>supported.has(s)) as Policy["countries"];
 if(!countries.length) throw new CheckoutError("CHECKOUT_HOLD","Shipping destinations are not configured.",503);
 return {siteUrl:getSiteUrl(requestOrigin),shippingRate:process.env.STRIPE_SHIPPING_RATE_ID?.trim() || null,automaticTax:process.env.STRIPE_AUTOMATIC_TAX === "true",countries};
}
function retryError(): CheckoutError { return new CheckoutError("CHECKOUT_RETRY","Checkout could not be confirmed. Please retry the same attempt shortly.",503); }
async function release(orderId:string,reason:string) {
 const {data,error}=await getSupabaseAdmin().rpc("release_checkout",{p_order_id:orderId,p_reason:reason});
 if(error) throw retryError();
 return data as string | null;
}
function rpcError(message:string): CheckoutError {
 for(const code of ["CHECKOUT_CLIENT_RATE_LIMIT","CHECKOUT_CLIENT_ACTIVE_LIMIT","CHECKOUT_STORE_ACTIVE_LIMIT"]){if(message.includes(code))return new CheckoutError(code,"Checkout capacity is temporarily limited.",429);}
 if(message.includes("CHECKOUT_ADMISSION_DISABLED"))return new CheckoutError("CHECKOUT_HOLD","Checkout admission is paused.",503);
 if(message.includes("CHECKOUT_CLIENT_CHANGED"))return new CheckoutError("CHECKOUT_CLIENT_CHANGED","Resume from the same connection or check the existing payment attempt.",409);
 if(message.includes("CHECKOUT_PAYMENT_PENDING"))return new CheckoutError("CHECKOUT_PAYMENT_PENDING","Payment or order review is being confirmed. Do not pay again.");
 for(const code of ["CHECKOUT_ATTEMPT_CHANGED","CHECKOUT_ATTEMPT_CLOSED","OUT_OF_STOCK","PRODUCT_UNAVAILABLE","INVALID_ATTRIBUTION","QUANTITY_LIMIT","UNSUPPORTED_CURRENCY"]){
  if(message.includes(code))return new CheckoutError(code,code.startsWith("CHECKOUT_ATTEMPT") ? "This checkout attempt has ended or changed. Start a new attempt." : "A selected product cannot be reserved. Please review your shopping bag.");
 }
 return retryError();
}
export async function createCheckoutSession(input: unknown, requestOrigin: string, clientHash?: string) {
 checkoutGate();
 if(!clientHash||!/^[a-f0-9]{64}$/.test(clientHash))throw new CheckoutError("CHECKOUT_VERIFICATION_REQUIRED","Verification is required.",422);
 const parsed=checkoutInputSchema.parse(input);
 const normalized=parsed.items.map(i=>({product_id:i.productId,quantity:i.quantity,live_session_id:i.source?.liveSessionId ?? null,kol_id:i.source?.kolId ?? null})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 const fingerprint=createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
 const supabase=getSupabaseAdmin();
 const {data:orderId,error:reserveError}=await supabase.rpc("reserve_checkout",{p_attempt:parsed.checkoutAttemptId,p_fingerprint:fingerprint,p_lines:normalized,p_policy:policy(requestOrigin),p_client_hash:clientHash});
 if(reserveError || !orderId)throw rpcError(reserveError?.message ?? "Reservation failed");
 const {data,error}=await supabase.from("orders").select("id,status,currency,subtotal_amount,reservation_expires_at,stripe_checkout_session_id,checkout_policy,order_items(id,product_id,sku,title,unit_amount,quantity)").eq("id",orderId).single();
 if(error || !data)throw retryError();
 const order=data as ReservedOrder;
 const expiresAt=Math.floor(new Date(order.reservation_expires_at).getTime()/1000);
 const stripe=getStripe();
 if(order.stripe_checkout_session_id){
  let session:Stripe.Checkout.Session;
  try{session=await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);}catch{throw retryError();}
  if(session.client_reference_id !== order.id)throw retryError();
  if(session.status === "expired") {await release(order.id,"provider_expired");throw new CheckoutError("CHECKOUT_ATTEMPT_EXPIRED","Checkout expired. Start a new attempt.");}
  if(session.status !== "open" || session.payment_status !== "unpaid")throw new CheckoutError("CHECKOUT_PAYMENT_PENDING","Payment is being confirmed. Do not pay again; check your order status.");
  return {id:session.id,url:session.url,checkoutAttemptId:parsed.checkoutAttemptId,expiresAt:order.reservation_expires_at};
 }
 // Stripe requires expiry at least 30 minutes in the future. No new provider
 // call is made for an old attempt; this also bounds uncertain-create retries.
 if(expiresAt-Math.floor(Date.now()/1000)<30*60){
  // A prior uncertain create might have succeeded: only release when the same
  // idempotency key can be reconciled, or at natural reservation expiry. Keep
  // the hold here; no unsafe early release based solely on missing local link.
  throw new CheckoutError("CHECKOUT_RETRY","This attempt is still unresolved. Keep the same attempt until payment or expiry is confirmed.",503);
 }
 const p=order.checkout_policy;
 const params:Stripe.Checkout.SessionCreateParams={
  mode:"payment",payment_method_types:["card"],customer_creation:"always",billing_address_collection:"auto",
  phone_number_collection:{enabled:true},shipping_address_collection:{allowed_countries:p.countries},
  ...(p.shippingRate?{shipping_options:[{shipping_rate:p.shippingRate}]}:{}),automatic_tax:{enabled:p.automaticTax},
  allow_promotion_codes:false,client_reference_id:order.id,metadata:{order_id:order.id,checkout_attempt_id:parsed.checkoutAttemptId},expires_at:expiresAt,
  line_items:order.order_items.sort((a,b)=>a.id.localeCompare(b.id)).map(i=>({quantity:i.quantity,price_data:{currency:order.currency,unit_amount:i.unit_amount,product_data:{name:i.title,metadata:{product_id:i.product_id,sku:i.sku}}}})),
  success_url:`${p.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${p.siteUrl}/cart?checkout=cancelled&attempt=${parsed.checkoutAttemptId}`,
 };
 let session:Stripe.Checkout.Session;
 try{session=await stripe.checkout.sessions.create(params,{idempotencyKey:`suntv-reserved-${order.id}`});}
 catch(cause){
  const e=cause as {type?:string;statusCode?:number};
  // A connection error/5xx/429/conflict is ambiguous: preserve the hold and key.
  if(e.type === "StripeInvalidRequestError" && e.statusCode === 400){await release(order.id,"creation_failed");throw new CheckoutError("CHECKOUT_ATTEMPT_CLOSED","Checkout setup was rejected. Start a new attempt after the configuration is corrected.");}
  throw retryError();
 }
 const attached=await supabase.rpc("attach_reserved_session",{p_order_id:order.id,p_session_id:session.id});
 if(attached.error){
  try{const expired=await stripe.checkout.sessions.expire(session.id);if(expired.status === "expired")await release(order.id,"provider_expired");}catch{/* Keep hold on uncertain provider state. Signed webhook or expiry reconciles it. */}
  throw retryError();
 }
 return {id:session.id,url:session.url,checkoutAttemptId:parsed.checkoutAttemptId,expiresAt:order.reservation_expires_at};
}

export async function cancelCheckoutAttempt(attemptId:string){
 checkoutGate();
 const supabase=getSupabaseAdmin();
 const {data:order,error}=await supabase.from("orders").select("id,status,stripe_checkout_session_id,reservation_expires_at").eq("checkout_attempt_id",attemptId).maybeSingle();
 if(error)throw retryError();
 if(!order)return {code:"CHECKOUT_PAYMENT_PENDING",status:"unknown",sessionId:null};
 if(order.status!=="pending")return {code:["cancelled","failed"].includes(order.status)?"CHECKOUT_ATTEMPT_CLOSED":"CHECKOUT_PAYMENT_PENDING",status:order.status as string,sessionId:order.stripe_checkout_session_id as string | null};
 if(!order.stripe_checkout_session_id)throw retryError(); // create outcome may be uncertain
 try{
  const session=await getStripe().checkout.sessions.retrieve(order.stripe_checkout_session_id);
  const expired=session.status === "expired" ? session : session.status === "open" ? await getStripe().checkout.sessions.expire(session.id) : null;
  if(!expired || expired.status!=="expired")throw retryError();
 }catch{throw retryError();}
 const released=await release(order.id,"cancel_confirmed");
 const status=released==="released"?"cancelled":released ?? "unknown";
 return {code:["cancelled","failed"].includes(status)?"CHECKOUT_ATTEMPT_CLOSED":"CHECKOUT_PAYMENT_PENDING",status,sessionId:order.stripe_checkout_session_id as string | null};
}
