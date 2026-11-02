import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
const key=readFileSync(process.argv[2],'utf8').trim();assert.match(key,/^(sk|rk)_test_/);
const stripe=new Stripe(key,{apiVersion:'2026-10-28.endive'});assert.equal((await stripe.accounts.retrieve(null)).id,'acct_1UVopWQ0fHQKbZbH');
const rest=async path=>{const r=await fetch('http://127.0.0.1:54331/rest/v1/'+path);assert(r.ok);return r.json();};
const orders=await rest('orders?select=id,status,checkout_attempt_id,stripe_checkout_session_id,stripe_payment_intent_id,subtotal_amount,total_amount,currency,review_reason,checkout_policy&order=created_at.asc');
const observations=[];
for(const order of orders.filter(o=>o.checkout_policy?.payment?.accountId==='acct_1UVopWQ0fHQKbZbH'&&o.stripe_checkout_session_id)){
 const s=await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id,{expand:['payment_intent.latest_charge']});assert.equal(s.livemode,false);
 const pi=s.payment_intent&&typeof s.payment_intent==='object'?s.payment_intent:null;
 const charge=pi?.latest_charge&&typeof pi.latest_charge==='object'?pi.latest_charge:null;
 const {checkout_policy,...safeOrder}=order;
 observations.push({order:safeOrder,provider:{id:s.id,livemode:s.livemode,status:s.status,payment_status:s.payment_status,currency:s.currency,amount_total:s.amount_total,adaptive_pricing:s.adaptive_pricing,paymentIntent:pi?{id:pi.id,status:pi.status,amount_received:pi.amount_received,last_error_code:pi.last_payment_error?.code??null}:null,charge:charge?{id:charge.id,paid:charge.paid,status:charge.status,three_d_secure:charge.payment_method_details?.card?.three_d_secure??null}:null},events:await rest('checkout_events?select=id,event_type,outcome&order_id=eq.'+order.id),reservation:await rest('inventory_reservations?select=status,quantity,release_reason&order_id=eq.'+order.id)});
}
const receipt={observedAt:new Date().toISOString(),accountId:'acct_1UVopWQ0fHQKbZbH',realMoneyMoved:false,stock:await rest('products?select=id,stock_qty'),observations};
writeFileSync(process.argv[3],JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({orders:observations.map(o=>({order:o.order.id,status:o.order.status,stripe:o.provider.payment_status,intent:o.provider.paymentIntent?.status,error:o.provider.paymentIntent?.last_error_code,events:o.events.length})),stock:receipt.stock}));
