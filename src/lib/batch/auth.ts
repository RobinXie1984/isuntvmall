import "server-only";
import { cookies } from "next/headers";
import { BatchError, type BatchRole } from "./contracts";
import { STAFF_COOKIE, staffConfigured, staffAuthClient as namedClient, requireStaffOrigin, staffFromToken as namedStaffFromToken, cookieToken, staffCookieOptions, permissionAllowed } from "@/lib/staff/auth";
import type { Staff } from "@/lib/staff/auth";
export { STAFF_COOKIE, staffCookieOptions };
export type BatchStaff = Staff & { role: BatchRole };
export function batchConfigured() { return staffConfigured() && process.env.BATCH_HELPER_ENABLED === "true"; }
export function staffAuthClient() { if (!batchConfigured()) throw new BatchError("BATCH_NOT_CONFIGURED", 503); return namedClient(); }
export function requireBatchOrigin(request: Request) { try { requireStaffOrigin(request); } catch { throw new BatchError("INVALID_ORIGIN", 403); } }
export async function staffFromToken(token: string | undefined): Promise<BatchStaff | null> {
  if (!batchConfigured()) return null;
  const staff = await namedStaffFromToken(token);
  return staff && permissionAllowed(staff, "batch.submit") ? staff as BatchStaff : null;
}
export async function getBatchStaff() { const jar = await cookies(); return staffFromToken(jar.get(STAFF_COOKIE)?.value); }
export async function requireBatchStaff(request: Request): Promise<BatchStaff> {
  if (!batchConfigured()) throw new BatchError("BATCH_NOT_CONFIGURED", 503);
  const staff = await staffFromToken(cookieToken(request)); if (!staff) throw new BatchError("SIGN_IN_REQUIRED", 401); return staff;
}
