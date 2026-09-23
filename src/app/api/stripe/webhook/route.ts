import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { checkoutReleaseReady } from "@/lib/cart";
import { getStripeWebhookSecret } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/lib/stripe/webhook";
export const runtime = "nodejs";
export async function POST(request: Request) {
 if(!checkoutReleaseReady())return NextResponse.json({received:false,error:"Checkout is on hold."},{status:503});
 const signature=request.headers.get("stripe-signature");
 if(!signature)return NextResponse.json({received:false,error:"Missing signature."},{status:400});
 let event:Stripe.Event;
 try{event=getStripe().webhooks.constructEvent(await request.text(),signature,getStripeWebhookSecret());}
 catch{return NextResponse.json({received:false,error:"Invalid signature."},{status:400});}
 try{await handleStripeEvent(event);return NextResponse.json({received:true});}
 catch{return NextResponse.json({received:false,error:"Event processing requires retry."},{status:500});}
}
