import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const m = vi.hoisted(() => ({ staff: vi.fn(), rpc: vi.fn(), broadcasts: vi.fn(), products: vi.fn() }));
vi.mock("@/lib/staff/auth", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/staff/auth")>(), requireStaff: m.staff }));
vi.mock("@/lib/env", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/env")>(), getSiteUrl: () => "https://shop.example" }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ rpc: m.rpc }) }));
vi.mock("@/lib/broadcasts/store", () => ({ getBroadcasts: m.broadcasts }));
vi.mock("@/lib/data/store", () => ({ getProducts: m.products }));
import { GET, POST } from "@/app/api/admin/broadcasts/route";
import { StaffError } from "@/lib/staff/permissions";
const id = "11111111-1111-4111-8111-111111111111";
const videoId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";
const staff = { id, role: "super_admin", aal: "aal2", kolId: null, email: "fixture@example.test", sessionId: "44444444-4444-4444-8444-444444444444" };
const payload = { kind: "broadcast", title: "Video", titleZh: "影片", titleHans: "视频", titleJa: "動画", url: "https://youtu.be/7CL0PxKA5iE", thumbnailUrl: "", position: 0, visible: false, status: "recorded", productIds: [] as string[] };
const body = () => ({ id: videoId, revision: 1, payload });
const get = () => new Request("https://shop.example/api/admin/broadcasts");
const post = (data: unknown = body(), origin: string | null = "https://shop.example", contentType = "application/json") => new Request("https://shop.example/api/admin/broadcasts", { method: "POST", headers: { "Content-Type": contentType, ...(origin ? { origin } : {}) }, body: JSON.stringify(data) });
beforeEach(() => { vi.resetAllMocks(); m.staff.mockResolvedValue(staff); m.rpc.mockResolvedValue({ data: null, error: null }); m.broadcasts.mockResolvedValue([{ id: videoId, revision: 2, ...payload }]); m.products.mockResolvedValue([{ id: productId }]); });
describe("broadcast administration authority boundary", () => {
  it.each(["super_admin", "admin", "operator"])("allows %s with MFA to read private records and save", async role => {
    m.staff.mockResolvedValue({ ...staff, role });
    const response = await GET(get()); expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(m.broadcasts).toHaveBeenCalledWith(true);
    expect((await POST(post())).status).toBe(200);
    expect(m.rpc).toHaveBeenCalledWith("storefront_broadcast_save", { p_actor: id, p_id: videoId, p_revision: 1, p_payload: payload });
  });
  it.each(["order_operator", "catalog_editor", "kol", "analyst"])("%s cannot inspect hidden videos or publish", async role => {
    m.staff.mockResolvedValue({ ...staff, role });
    expect((await GET(get())).status).toBe(403); expect((await POST(post())).status).toBe(403);
    expect(m.broadcasts).not.toHaveBeenCalled(); expect(m.rpc).not.toHaveBeenCalled();
  });
  it.each(["super_admin", "admin", "operator"])("requires MFA for %s even if session resolution returns aal1", async role => {
    m.staff.mockResolvedValue({ ...staff, role, aal: "aal1" });
    expect((await GET(get())).status).toBe(403); expect((await POST(post())).status).toBe(403);
    expect(m.rpc).not.toHaveBeenCalled(); expect(m.broadcasts).not.toHaveBeenCalled();
  });
  it("does not expose hidden records to an absent or revoked session", async () => {
    m.staff.mockRejectedValue(new StaffError("SIGN_IN_REQUIRED", 401));
    expect((await GET(get())).status).toBe(401); expect((await POST(post())).status).toBe(401);
    expect(m.broadcasts).not.toHaveBeenCalled(); expect(m.rpc).not.toHaveBeenCalled();
  });
  it.each(["https://foreign.example", null])("rejects origin %s before checking session or saving", async origin => {
    expect((await POST(post(body(), origin))).status).toBe(403);
    expect(m.staff).not.toHaveBeenCalled(); expect(m.rpc).not.toHaveBeenCalled();
  });
  it("rejects caller-supplied actors in the envelope and payload", async () => {
    for (const data of [{ ...body(), actorId: id }, { ...body(), payload: { ...payload, p_actor: id } }]) expect((await POST(post(data))).status).toBe(422);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("checks actual request bytes and requires JSON", async () => {
    expect((await POST(post({ ...body(), padding: "x".repeat(17000) }))).status).toBe(413);
    expect((await POST(post(body(), "https://shop.example", "text/plain"))).status).toBe(415);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("rejects invalid links, missing translations, duplicate product references and invalid ordering", async () => {
    for (const patch of [{ url: "javascript:alert(1)" }, { url: "https://facebook.com.evil.test/a" }, { titleJa: "" }, { productIds: [productId, productId] }, { position: -1 }, { thumbnailUrl: "https://example.test/a.svg" }]) expect((await POST(post({ ...body(), payload: { ...payload, ...patch } }))).status).toBe(422);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("allows no products but refuses unpublished or unknown product references", async () => {
    expect((await POST(post())).status).toBe(200);
    m.rpc.mockClear();
    const response = await POST(post({ ...body(), payload: { ...payload, productIds: [id] } }));
    expect(response.status).toBe(422); expect(await response.json()).toMatchObject({ code: "PRODUCT_NOT_APPROVED" });
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("allows the same approved product in different broadcasts", async () => {
    for (const currentId of [videoId, "55555555-5555-4555-8555-555555555555"]) expect((await POST(post({ id: currentId, revision: 0, payload: { ...payload, productIds: [productId] } }))).status).toBe(200);
    expect(m.rpc).toHaveBeenCalledTimes(2);
  });
  it("reports stale revisions without leaking upstream details", async () => {
    m.rpc.mockResolvedValue({ error: { message: "STALE_BROADCAST private upstream detail" } });
    const response = await POST(post());
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ ok: false, code: "STALE_BROADCAST" });
    expect(m.broadcasts).not.toHaveBeenCalled();
  });
  it("sanitizes failed writes and duplicate introduction conflicts", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "private SQL details", code: "23505" } });
    expect(await (await POST(post())).json()).toEqual({ ok: false, code: "INTRODUCTION_EXISTS" });
    m.rpc.mockResolvedValueOnce({ error: { message: "private SQL details", code: "unknown" } });
    expect(await (await POST(post())).json()).toEqual({ ok: false, code: "BROADCAST_SAVE_FAILED" });
  });
  it("returns failure if saved-state readback fails rather than claiming success", async () => {
    m.broadcasts.mockRejectedValue(Error("private read details"));
    const response = await POST(post());
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ ok: false, code: "STAFF_OPERATION_FAILED" });
    expect(m.rpc).toHaveBeenCalledTimes(1);
  });
});
