import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), membership: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ auth: { getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.membership }) }) }) }) }));
vi.mock("@/lib/env", () => ({ hasSupabaseConfig: () => true, getSupabaseConfig: () => ({ url: "https://example.supabase.co", secretKey: "unused" }), getSiteUrl: () => "https://www.isuntvmall.com" }));
import { requireBatchStaff, requireBatchOrigin, staffFromToken, staffCookieOptions } from "./auth";
const user = { id: "a", email: "editor@example.com", app_metadata: { role: "super_admin" }, user_metadata: { role: "super_admin" } };
beforeEach(() => { vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-key"); vi.stubEnv("BATCH_HELPER_ENABLED", "true"); vi.clearAllMocks(); mocks.getUser.mockResolvedValue({ data: { user }, error: null }); mocks.membership.mockResolvedValue({ data: { role: "catalog_editor", active: true }, error: null }); });
afterEach(() => vi.unstubAllEnvs());
describe("named batch staff boundary", () => {
  it("does not recognize the old shared admin cookie", async () => { await expect(requireBatchStaff(new Request("https://www.isuntvmall.com", { headers: { cookie: "suntv_admin=legacy" } }))).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" }); expect(mocks.getUser).not.toHaveBeenCalled(); });
  it("fails closed while batch deployment is disabled", async () => { vi.stubEnv("BATCH_HELPER_ENABLED", "false"); await expect(requireBatchStaff(new Request("https://www.isuntvmall.com"))).rejects.toMatchObject({ status: 503 }); });
  it("uses current database membership rather than supplied role metadata", async () => { expect(await staffFromToken("signed-token")).toMatchObject({ role: "catalog_editor" }); expect(mocks.getUser).toHaveBeenCalledWith("signed-token"); });
  it("denies revoked, absent, anonymous or invalid identity", async () => {
    mocks.membership.mockResolvedValueOnce({ data: { role: "super_admin", active: false } }); expect(await staffFromToken("token")).toBeNull();
    mocks.membership.mockResolvedValueOnce({ data: null }); expect(await staffFromToken("token")).toBeNull();
    mocks.getUser.mockResolvedValueOnce({ data: { user: { ...user, is_anonymous: true } } }); expect(await staffFromToken("token")).toBeNull();
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("invalid") }); expect(await staffFromToken("token")).toBeNull();
  });
  it("rejects forged origin headers even when forwarded host agrees", () => {
    expect(() => requireBatchOrigin(new Request("https://www.isuntvmall.com", { headers: { origin: "https://evil.test", "x-forwarded-host": "evil.test" } }))).toThrow();
    expect(() => requireBatchOrigin(new Request("https://www.isuntvmall.com", { headers: { origin: "https://www.isuntvmall.com" } }))).not.toThrow();
    expect(staffCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "strict", maxAge: 3600 });
  });
});
