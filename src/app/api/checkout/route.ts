import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/http";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(null, "Invalid request origin.", 403);
  try {
    const session = await createCheckoutSession(await request.json(), new URL(request.url).origin);
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    return errorResponse(error, "Checkout could not be started.");
  }
}
