import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ member: vi.fn(), lookup: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/batch/auth", () => ({ requireBatchOrigin: vi.fn(), requireBatchStaff: mocks.member }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }), rpc: mocks.rpc }) }));
import { batchForStaff } from "./server";
import { POST } from "@/app/api/admin/batches/items/[id]/route";
import type { BatchStaff } from "./auth";
const batchId = "11111111-1111-4111-8111-111111111111";
const itemId = "22222222-2222-4222-8222-222222222222";
const staff = (role: BatchStaff["role"], aal: BatchStaff["aal"] = "aal2"): BatchStaff => ({ id: "reviewer", email: "reviewer@example.test", role, aal, kolId: null, sessionId: "session" });
beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ data: true, error: null }); });
describe("merchandise reviewer scope", () => {
 it.each(["super_admin", "admin"] as const)("%s can review another uploader's batch", async role => {
  mocks.lookup.mockResolvedValue({ data: { id: batchId, created_by: "other-uploader" }, error: null });
  expect(await batchForStaff(batchId, staff(role))).toMatchObject({ id: batchId });
 });
 it.each(["operator", "catalog_editor", "kol"] as const)("%s cannot read another uploader's batch", async role => {
  mocks.lookup.mockResolvedValue({ data: { id: batchId, created_by: "other-uploader" }, error: null });
  await expect(batchForStaff(batchId, staff(role))).rejects.toMatchObject({ code: "BATCH_NOT_FOUND" });
 });
 it("an admin without MFA cannot use the reviewer scope", async () => {
  mocks.lookup.mockResolvedValue({ data: { id: batchId, created_by: "other-uploader" }, error: null });
  await expect(batchForStaff(batchId, staff("admin", "aal1"))).rejects.toMatchObject({ code: "BATCH_NOT_FOUND" });
 });
 it.each(["approve", "reject"])("admin can %s a current review from another uploader", async action => {
  mocks.member.mockResolvedValue(staff("admin"));
  mocks.lookup.mockResolvedValueOnce({ data: { id: itemId, batch_id: batchId, revision: 2 }, error: null }).mockResolvedValueOnce({ data: { id: batchId, created_by: "other-uploader" }, error: null });
  const response = await POST(new Request("https://www.isuntvmall.com/api/admin/batches/items/" + itemId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, revision: 2, reason: "Reviewed" }) }), { params: Promise.resolve({ id: itemId }) });
  expect(response.status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("batch_review", { p_actor: "reviewer", p_item_id: itemId, p_revision: 2, p_decision: action, p_reason: "Reviewed" });
 });
 it.each(["operator", "catalog_editor", "kol"] as const)("%s cannot approve even their own batch", async role => {
  mocks.member.mockResolvedValue(staff(role));
  mocks.lookup.mockResolvedValueOnce({ data: { id: itemId, batch_id: batchId, revision: 2 }, error: null }).mockResolvedValueOnce({ data: { id: batchId, created_by: "reviewer" }, error: null });
  const response = await POST(new Request("https://www.isuntvmall.com/api/admin/batches/items/" + itemId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", revision: 2 }) }), { params: Promise.resolve({ id: itemId }) });
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: "APPROVER_REQUIRED" });
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it("admin approval still rejects a stale revision before mutation", async () => {
  mocks.member.mockResolvedValue(staff("admin"));
  mocks.lookup.mockResolvedValueOnce({ data: { id: itemId, batch_id: batchId, revision: 3 }, error: null }).mockResolvedValueOnce({ data: { id: batchId, created_by: "other-uploader" }, error: null });
  const response = await POST(new Request("https://www.isuntvmall.com/api/admin/batches/items/" + itemId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", revision: 2 }) }), { params: Promise.resolve({ id: itemId }) });
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "STALE_REVISION" });
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
});
