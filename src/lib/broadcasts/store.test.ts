import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const m = vi.hoisted(() => ({ configured: vi.fn(), read: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/env", () => ({ hasSupabaseConfig: m.configured }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: m.from }) }));
import { getBroadcasts, getBroadcastById, getBroadcastsForProduct } from "./store";
const payload = { kind: "broadcast", title: "Video", titleZh: "影片", titleHans: "视频", titleJa: "動画", url: "https://youtu.be/7CL0PxKA5iE", thumbnailUrl: "", position: 0, visible: true, status: "recorded", productIds: [] as string[] };
const productId = "33333333-3333-4333-8333-333333333333";
const visible = { id: "11111111-1111-4111-8111-111111111111", revision: 1, payload };
const hidden = { id: "22222222-2222-4222-8222-222222222222", revision: 1, payload: { ...payload, visible: false, productIds: [productId] } };
beforeEach(() => { vi.resetAllMocks(); m.configured.mockReturnValue(true); m.read.mockResolvedValue({ data: [hidden, visible], error: null }); m.from.mockImplementation(() => ({ select: () => ({ order: () => ({ limit: m.read }) }) })); });
describe("public broadcast visibility and fresh reads", () => {
  it("does not render seeded iSun records when database configuration is absent", async () => { m.configured.mockReturnValue(false); expect(await getBroadcasts()).toEqual([]); expect(m.from).not.toHaveBeenCalled(); });
  it("hides hidden records even with a known ID or matching product", async () => { expect((await getBroadcasts()).map(item => item.id)).toEqual([visible.id]); expect(await getBroadcastById(hidden.id)).toBeNull(); expect(await getBroadcastsForProduct(productId)).toEqual([]); });
  it("allows privileged callers to request hidden records explicitly", async () => { expect(await getBroadcasts(true)).toHaveLength(2); });
  it("reads current order and visibility again after a save", async () => { expect(await getBroadcastById(visible.id)).not.toBeNull(); m.read.mockResolvedValueOnce({ data: [{ ...visible, revision: 2, payload: { ...payload, visible: false } }], error: null }); expect(await getBroadcastById(visible.id)).toBeNull(); expect(m.read).toHaveBeenCalledTimes(2); });
  it("sorts by saved position and permits many broadcasts for one product", async () => { m.read.mockResolvedValue({ data: [{ ...visible, payload: { ...payload, position: 8, productIds: [productId] } }, { ...hidden, payload: { ...payload, position: 2, productIds: [productId] } }], error: null }); expect((await getBroadcastsForProduct(productId)).map(item => item.id)).toEqual([hidden.id, visible.id]); });
  it("does not disguise failed reads as an empty library", async () => { m.read.mockResolvedValue({ data: null, error: { message: "private" } }); await expect(getBroadcasts()).rejects.toThrow("BROADCAST_READ_FAILED"); });
});
