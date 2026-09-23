import "server-only";

function read(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function hasSupabaseConfig() {
  return Boolean(read("SUPABASE_URL") && (read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY")));
}

export function getSupabaseConfig() {
  const url = read("SUPABASE_URL");
  const secretKey = read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !secretKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  return { url, secretKey };
}

export function hasStripeConfig() {
  return Boolean(read("STRIPE_SECRET_KEY") && read("STRIPE_WEBHOOK_SECRET"));
}

export function getStripeSecretKey() {
  const value = read("STRIPE_SECRET_KEY");
  if (!value) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  return value;
}

export function getStripeWebhookSecret() {
  const value = read("STRIPE_WEBHOOK_SECRET");
  if (!value) throw new Error("Stripe webhook verification is not configured.");
  return value;
}

export function getSiteUrl(requestOrigin?: string) {
  const configured = read("NEXT_PUBLIC_SITE_URL");
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV !== "production" && requestOrigin) return new URL(requestOrigin).origin;
  throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production.");
}

export function getAdminConfig() {
  const password = read("ADMIN_PASSWORD");
  const sessionSecret = read("ADMIN_SESSION_SECRET");
  if (!password || !sessionSecret || sessionSecret.length < 32) return null;
  return { password, sessionSecret };
}

export function getDeploymentReadiness() {
  return {
    supabase: hasSupabaseConfig(),
    stripe: hasStripeConfig(),
    admin: Boolean(getAdminConfig()),
    siteUrl: Boolean(read("NEXT_PUBLIC_SITE_URL")),
  };
}
