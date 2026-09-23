import "server-only";

import type Stripe from "stripe";
import { assertCheckoutReleased, checkoutInputSchema, validateAttribution } from "@/lib/cart";
import { getProductsByIds, getLiveSessions } from "@/lib/data/store";
import { getSiteUrl, hasSupabaseConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function allowedCountries(): Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] {
  const supported = new Set([
    "HK", "SG", "MY", "US", "GB", "AU", "CA", "CN", "TW", "JP", "KR", "NZ", "TH", "PH", "VN", "ID", "DE", "FR", "IT", "ES", "NL",
  ]);
  return (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES || "HK,SG,MY,US,GB,AU,CA")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => supported.has(value)) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
}

export async function createCheckoutSession(input: unknown, requestOrigin: string) {
  assertCheckoutReleased();
  if (!hasSupabaseConfig()) throw new Error("Connect Supabase before accepting checkout.");
  const parsed = checkoutInputSchema.parse(input);
  parsed.items = validateAttribution(parsed.items, await getLiveSessions());

  const quantities = new Map<string, number>();
  for (const item of parsed.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

  const products = await getProductsByIds([...quantities.keys()]);
  if (products.length !== quantities.size) throw new Error("One or more products are unavailable.");
  const currencies = new Set(products.map((product) => product.currency));
  if (currencies.size !== 1) throw new Error("All cart items must use the same currency.");

  for (const product of products) {
    const quantity = quantities.get(product.id) ?? 0;
    if (product.stockQty < quantity) throw new Error(`${product.title} has only ${product.stockQty} left.`);
  }

  const items = parsed.items.map((line) => {
    const product=products.find(p=>p.id===line.productId)!;
    return { product_id:product.id, sku:product.sku, title:product.title, unit_amount:product.priceAmount, quantity:line.quantity, live_session_id:line.source?.liveSessionId ?? null, kol_id:line.source?.kolId ?? null };
  });
  const currency = products[0].currency;
  const subtotal = items.reduce((sum, item) => sum + item.unit_amount * item.quantity, 0);
  const supabase = getSupabaseAdmin();
  const { data: orderId, error: orderError } = await supabase.rpc("create_pending_order", {
    p_currency: currency,
    p_subtotal_amount: subtotal,
    p_items: items,
  });
  if (orderError || !orderId) throw new Error(`Could not create order: ${orderError?.message ?? "unknown error"}`);

  const siteUrl = getSiteUrl(requestOrigin);
  const shippingRate = process.env.STRIPE_SHIPPING_RATE_ID?.trim();

  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_creation: "always",
        billing_address_collection: "auto",
        phone_number_collection: { enabled: true },
        shipping_address_collection: { allowed_countries: allowedCountries() },
        ...(shippingRate ? { shipping_options: [{ shipping_rate: shippingRate }] } : {}),
        automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
        allow_promotion_codes: true,
        client_reference_id: String(orderId),
        metadata: { order_id: String(orderId) },
        line_items: products.map((product) => ({
          quantity: quantities.get(product.id),
          price_data: {
            currency: product.currency,
            unit_amount: product.priceAmount,
            product_data: {
              name: product.title,
              description: product.description.slice(0, 500) || undefined,
              metadata: { product_id: product.id, sku: product.sku },
              images: product.images[0]?.sourceUrl.startsWith("https://") ? [product.images[0].sourceUrl] : undefined,
            },
          },
        })),
        success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart?checkout=cancelled`,
      },
      { idempotencyKey: `suntv-order-${orderId}` },
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId);
    if (updateError) {
      await getStripe().checkout.sessions.expire(session.id);
      throw new Error(`Checkout was cancelled because the order could not be linked: ${updateError.message}`);
    }
    return { id: session.id, url: session.url };
  } catch (error) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
    throw error;
  }
}
