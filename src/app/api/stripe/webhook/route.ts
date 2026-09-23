import { NextResponse } from "next/server";
import { getStripeWebhookSecret } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/lib/stripe/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ received: false, error: "Missing Stripe signature." }, { status: 400 });

  try {
    const payload = await request.text();
    const event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    console.error("Stripe webhook rejected:", message);
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
