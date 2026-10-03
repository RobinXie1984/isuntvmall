import "server-only";
import { getStoreProfile, hasMerchantPolicies } from "@/lib/store-profile";
import { hasStripeConfig, hasSupabaseConfig } from "@/lib/env";
import { checkoutVerificationConfigured } from "@/lib/checkout/verification";
import { getStripe } from "./client";

export type PaymentIdentity = { accountId: string; livemode: boolean };
export function paymentConfiguration(): PaymentIdentity {
 const accountId = process.env.STRIPE_ACCOUNT_ID?.trim() ?? "";
 const mode = process.env.STRIPE_MODE;
 const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
 if (!hasStripeConfig() || !/^acct_[a-zA-Z0-9]+$/.test(accountId) || !["test", "live"].includes(mode ?? "") || !key.startsWith(`sk_${mode}_`)) throw new Error("PAYMENT_CONFIGURATION_REQUIRED");
 return { accountId, livemode: mode === "live" };
}
export function paymentOperationsConfigured() {
 try { paymentConfiguration(); return hasSupabaseConfig(); } catch { return false; }
}
// Stopping new sales must not stop settlement, cancellation or refunds on old orders.
export function checkoutReleaseReady() {
 const profile = getStoreProfile();
 return process.env.CHECKOUT_RELEASE_APPROVED === "true" && paymentOperationsConfigured() && hasMerchantPolicies() &&
  process.env.NEXT_PUBLIC_SITE_URL === profile.origin && checkoutVerificationConfigured();
}
export async function verifyPaymentIdentity(expected?: PaymentIdentity | null) {
 const configured = paymentConfiguration();
 if (expected && (expected.accountId !== configured.accountId || expected.livemode !== configured.livemode)) throw new Error("PAYMENT_IDENTITY_MISMATCH");
 const account = await getStripe().accounts.retrieve(null);
 if (account.id !== configured.accountId) throw new Error("PAYMENT_IDENTITY_MISMATCH");
 return configured;
}
export function assertProviderMode(identity: PaymentIdentity, object: { livemode: boolean; account?: string }) {
 if (object.livemode !== identity.livemode || (object.account && object.account !== identity.accountId)) throw new Error("PAYMENT_IDENTITY_MISMATCH");
}
export function frozenPaymentIdentity(policy: unknown): PaymentIdentity {
 const payment = (policy as { payment?: PaymentIdentity } | null)?.payment;
 if (!payment || !/^acct_[a-zA-Z0-9]+$/.test(payment.accountId) || typeof payment.livemode !== "boolean") throw new Error("PAYMENT_IDENTITY_MISSING");
 return payment;
}
