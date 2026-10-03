import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const m = vi.hoisted(() => ({ account: vi.fn(), profile: vi.fn(), policies: vi.fn() }));
vi.mock("./client", () => ({ getStripe: () => ({ accounts: { retrieve: m.account } }) }));
vi.mock("@/lib/store-profile", () => ({ getStoreProfile: m.profile, hasMerchantPolicies: m.policies }));
import { checkoutReleaseReady, paymentOperationsConfigured, verifyPaymentIdentity, assertProviderMode, frozenPaymentIdentity } from "./runtime";
beforeEach(() => {
 vi.stubEnv("STRIPE_ACCOUNT_ID", "acct_fixture"); vi.stubEnv("STRIPE_MODE", "test"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
 vi.stubEnv("SUPABASE_URL", "https://db.example"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture");
 vi.stubEnv("CHECKOUT_RELEASE_APPROVED", "false"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example");
 vi.stubEnv("TURNSTILE_SITE_KEY", "fixture"); vi.stubEnv("TURNSTILE_SECRET_KEY", "fixture"); vi.stubEnv("CHECKOUT_CLIENT_HASH_SECRET", "a".repeat(32));
 m.account.mockResolvedValue({ id: "acct_fixture" }); m.profile.mockReturnValue({ origin: "https://shop.example" }); m.policies.mockReturnValue(true);
});
afterEach(() => vi.unstubAllEnvs());
describe("merchant-owned Stripe boundary", () => {
 it("paused sales still permit existing payment operations", () => { expect(checkoutReleaseReady()).toBe(false); expect(paymentOperationsConfigured()).toBe(true); });
 it("credentials alone cannot enable sales", () => { m.policies.mockReturnValue(false); vi.stubEnv("CHECKOUT_RELEASE_APPROVED", "true"); expect(checkoutReleaseReady()).toBe(false); });
 it("requires approved profile, site, verification and identity configuration", () => { vi.stubEnv("CHECKOUT_RELEASE_APPROVED", "true"); expect(checkoutReleaseReady()).toBe(true); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://other.example"); expect(checkoutReleaseReady()).toBe(false); });
 it("test/live credential mismatch fails closed", () => { vi.stubEnv("STRIPE_MODE", "live"); expect(paymentOperationsConfigured()).toBe(false); });
 it("verifies actual provider account before payment operations", async () => { m.account.mockResolvedValue({ id: "acct_other" }); await expect(verifyPaymentIdentity()).rejects.toThrow("PAYMENT_IDENTITY_MISMATCH"); });
 it("cannot reroute old orders after changing configuration", async () => { await expect(verifyPaymentIdentity({ accountId: "acct_old", livemode: false })).rejects.toThrow("PAYMENT_IDENTITY_MISMATCH"); });
 it("rejects foreign-account and wrong-mode events", () => { for (const event of [{ livemode: true }, { livemode: false, account: "acct_other" }]) expect(() => assertProviderMode({ accountId: "acct_fixture", livemode: false }, event)).toThrow(); });
 it("legacy orders lacking frozen merchant identity stay on hold", () => { expect(() => frozenPaymentIdentity({})).toThrow("PAYMENT_IDENTITY_MISSING"); });
});
