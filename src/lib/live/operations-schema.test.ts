import { describe, expect, it } from "vitest";
import { liveActionSchema, liveDraftSchema } from "./operations-schema";
import { acceptLiveState, type PublicLiveState } from "./public-state";
const room = "90000000-0000-4000-8000-000000000001";
const payload = { slug: "host-one", title: "A calm evening", titleZh: "安靜的晚上", description: "", descriptionZh: "", hostName: "Host", kolId: room, platform: "youtube", externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", status: "live", startsAt: "2026-09-25T10:00:00Z", productIds: [room] };
describe("live operation contract", () => {
  it("requires exact platform domains, HTTPS and bilingual room names", () => {
    expect(liveDraftSchema.safeParse(payload).success).toBe(true);
    for (const externalUrl of ["https://youtube.com.attacker.test/video", "http://www.youtube.com/watch?v=x", "https://user:pass@www.youtube.com/watch?v=x"]) expect(liveDraftSchema.safeParse({ ...payload, externalUrl }).success).toBe(false);
    expect(liveDraftSchema.safeParse({ ...payload, titleZh: "" }).success).toBe(false);
  });
  it("rejects duplicate rails and reversed dates", () => {
    expect(liveDraftSchema.safeParse({ ...payload, productIds: [room, room] }).success).toBe(false);
    expect(liveDraftSchema.safeParse({ ...payload, endsAt: "2026-09-25T09:00:00Z" }).success).toBe(false);
  });
  it("requires explicit source attestations and rejects client privilege claims", () => {
    const verify = { action: "verify", revision: 1, mode: "external_link", deviceNote: "Fixture", rightsConfirmed: true, playbackConfirmed: true };
    expect(liveActionSchema.safeParse(verify).success).toBe(true);
    expect(liveActionSchema.safeParse({ ...verify, rightsConfirmed: false }).success).toBe(false);
    expect(liveActionSchema.safeParse({ ...verify, role: "super_admin" }).success).toBe(false);
  });
  it("never lets a slow or other-room poll undo current state", () => {
    const current: PublicLiveState = { id: room, revision: 9, status: "live", kolId: room, externalUrl: payload.externalUrl, platform: "youtube", embedId: null, playbackMode: "embedded", pinnedProductId: room, products: [] };
    expect(acceptLiveState(current, { ...current, revision: 8, pinnedProductId: null }, room)).toBe(current);
    expect(acceptLiveState(current, { ...current, id: "other", revision: 10 }, room)).toBe(current);
    expect(acceptLiveState(current, { ...current, revision: 10, pinnedProductId: null }, room)?.pinnedProductId).toBeNull();
  });
});
