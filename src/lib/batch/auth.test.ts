import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({})); vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const mocks = vi.hoisted(() => ({ staff: vi.fn() }));
vi.mock("@/lib/staff/auth", async () => { const { permissionAllowed } = await import("@/lib/staff/permissions"); return { STAFF_COOKIE: "isun_staff", staffConfigured: () => true, staffAuthClient: vi.fn(), requireStaffOrigin: vi.fn(), staffFromToken: mocks.staff, cookieToken: (r: Request) => r.headers.get("cookie")?.startsWith("isun_staff=") ? r.headers.get("cookie")!.slice(11) : undefined, staffCookieOptions: () => ({ httpOnly: true }), permissionAllowed }; });
import { requireBatchStaff, staffFromToken } from "./auth";
beforeEach(() => { vi.stubEnv("BATCH_HELPER_ENABLED", "true"); vi.clearAllMocks(); }); afterEach(() => vi.unstubAllEnvs());
describe("batch admission does not broaden with staff roles", () => {
 it.each(["super_admin", "operator", "catalog_editor", "kol", "order_operator", "analyst"])("explicitly evaluates %s", async role => { mocks.staff.mockResolvedValue({ id: "user", role, email: "member@example.test", kolId: role === "kol" ? "host" : null, aal: "aal2", sessionId: "session" }); expect(Boolean(await staffFromToken("token"))).toBe(["super_admin", "operator", "catalog_editor", "kol"].includes(role)); });
 it("fails closed while disabled", async () => { vi.stubEnv("BATCH_HELPER_ENABLED", "false"); await expect(requireBatchStaff(new Request("https://www.isuntvmall.com"))).rejects.toMatchObject({ status: 503 }); expect(mocks.staff).not.toHaveBeenCalled(); });
 it("rejects absent named staff", async () => { mocks.staff.mockResolvedValue(null); await expect(requireBatchStaff(new Request("https://www.isuntvmall.com", { headers: { cookie: "suntv_admin=legacy" } }))).rejects.toMatchObject({ code: "SIGN_IN_REQUIRED" }); });
});
