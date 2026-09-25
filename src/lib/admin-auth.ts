import "server-only";
import { redirect } from "next/navigation";
import { getStaff, requireStaffOrigin, type StaffAction, requirePermission } from "@/lib/staff/auth";
// Kept only to expire pre-migration cookies. Shared passwords/tokens no longer authorize anything.
export const ADMIN_COOKIE = "suntv_admin";
export function verifyAdminToken(_token: string | undefined, _now?: number) { void _token; void _now; return false; }
export function checkAdminPassword(_candidate: string) { void _candidate; return false; }
export async function hasAdminSession() { return Boolean(await getStaff()); }
export async function requireAdminPage(action?: StaffAction, scope: { kolId?: string | null } = {}) {
  const staff = await getStaff(); if (!staff) redirect("/admin/login");
  if (action) requirePermission(staff, action, scope);
  return staff;
}
// Deliberately synchronous and fail-closed: old callers must migrate to
// requireStaff + requirePermission; returning a Promise would make !call unsafe.
export function isAdminRequest(_request: Request) { void _request; return false; }
export function isSameOriginRequest(request: Request) { try { requireStaffOrigin(request); return true; } catch { return false; } }
export function adminCookieOptions() { return { httpOnly: true, maxAge: 0, path: "/", sameSite: "strict" as const, secure: process.env.NODE_ENV === "production" }; }
