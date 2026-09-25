import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, getSupabaseConfig, getSiteUrl } from "@/lib/env";
import { BatchError, type BatchRole } from "./contracts";

export const STAFF_COOKIE = "isun_staff";
export type BatchStaff = { id: string; role: BatchRole; email: string };
export function batchConfigured() { return hasSupabaseConfig() && Boolean(process.env.SUPABASE_PUBLISHABLE_KEY?.trim()) && process.env.BATCH_HELPER_ENABLED === "true"; }
export function staffAuthClient() {
  if (!batchConfigured()) throw new BatchError("BATCH_NOT_CONFIGURED", 503);
  return createClient(getSupabaseConfig().url, process.env.SUPABASE_PUBLISHABLE_KEY!.trim(), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function requireBatchOrigin(request: Request) {
  let expected: string;
  try { expected = getSiteUrl(new URL(request.url).origin); } catch { throw new BatchError("INVALID_ORIGIN", 403); }
  if (request.headers.get("origin") !== expected) throw new BatchError("INVALID_ORIGIN", 403);
}
export async function staffFromToken(token: string | undefined): Promise<BatchStaff | null> {
  if (!batchConfigured() || !token || token.length > 8192) return null;
  const db = getSupabaseAdmin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  const membership = await db.from("staff_members").select("role, active").eq("user_id", data.user.id).maybeSingle();
  if (membership.error || !membership.data?.active || !["super_admin", "catalog_editor"].includes(membership.data.role)) return null;
  return { id: data.user.id, role: membership.data.role as BatchRole, email: data.user.email ?? "" };
}
export async function getBatchStaff() { const jar = await cookies(); return staffFromToken(jar.get(STAFF_COOKIE)?.value); }
export async function requireBatchStaff(request: Request): Promise<BatchStaff> {
  if (!batchConfigured()) throw new BatchError("BATCH_NOT_CONFIGURED", 503);
  const raw = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(`${STAFF_COOKIE}=`))?.slice(STAFF_COOKIE.length + 1);
  let token: string | undefined;
  try { token = raw ? decodeURIComponent(raw) : undefined; } catch { throw new BatchError("SIGN_IN_REQUIRED", 401); }
  const staff = await staffFromToken(token);
  if (!staff) throw new BatchError("SIGN_IN_REQUIRED", 401);
  return staff;
}
export function staffCookieOptions(maxAge = 3600) { return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: Math.min(maxAge, 3600) }; }
