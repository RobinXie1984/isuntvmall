import { describe, it, expect, vi } from "vitest";
import { createInviteInitializer } from "./invite-client";
describe("invitation setup lifecycle", () => {
 it("shares one exchange across effect replay and remount after fragment removal", async () => {
  const initialize = createInviteInitializer(); const location = { hash: "#access_token=access&refresh_token=refresh&type=invite", pathname: "/admin/invite", search: "" };
  const state = { framework: "preserve" }; const history = { state, replaceState: vi.fn(() => { location.hash = ""; }) };
  const send = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, email: "staff@example.test" }) });
  const first = initialize(location, history, send); const second = initialize(location, history, send);
  expect(first).toBe(second); expect(await second).toEqual({ ok: true, email: "staff@example.test" });
  expect(send).toHaveBeenCalledTimes(1); expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({ accessToken: "access", refreshToken: "refresh" });
  expect(history.replaceState).toHaveBeenCalledWith(state, "", "/admin/invite");
 });
 it("resumes from the HttpOnly cookie after a full reload, with no tokens in client storage", async () => {
  const send = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
  await createInviteInitializer()({ hash: "", pathname: "/admin/invite", search: "" }, { state: null, replaceState: vi.fn() }, send);
  expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({});
 });
 it("rejects provider error fragments without reusing another pending account", async () => {
  const send = vi.fn(); const history = { state: null, replaceState: vi.fn() };
  expect(await createInviteInitializer()({ hash: "#error_code=otp_expired", pathname: "/admin/invite", search: "" }, history, send)).toMatchObject({ ok: false, code: "INVITE_INVALID" }); expect(send).not.toHaveBeenCalled(); expect(history.replaceState).toHaveBeenCalled();
 });
 it("does not call a network failure expired", async () => {
  expect(await createInviteInitializer()({ hash: "", pathname: "/admin/invite", search: "" }, { state: null, replaceState: vi.fn() }, vi.fn().mockRejectedValue(new Error("offline")))).toMatchObject({ code: "INVITE_UNAVAILABLE" });
 });
});
