import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, getSupabaseConfig, getSiteUrl } from "@/lib/env";
import { STAFF_ROLES, StaffError, privilegedRole, type Staff } from "./permissions";
export { requirePermission, permissionAllowed, staffLanding, StaffError, STAFF_ROLES, privilegedRole } from "./permissions";
export type { Staff, StaffRole, StaffAction } from "./permissions";
export const STAFF_COOKIE = "isun_staff";
export const STAFF_PENDING_COOKIE = "isun_staff_pending";
export const STAFF_PENDING_REFRESH_COOKIE = "isun_staff_pending_refresh";
export function staffConfigured() { return hasSupabaseConfig() && Boolean(process.env.SUPABASE_PUBLISHABLE_KEY?.trim()); }
export function staffAuthClient() {
  if (!staffConfigured()) throw new StaffError("STAFF_NOT_CONFIGURED", 503);
  return createClient(getSupabaseConfig().url, process.env.SUPABASE_PUBLISHABLE_KEY!.trim(), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function requireStaffOrigin(request: Request) {
  let expected: string;
  try { expected = getSiteUrl(new URL(request.url).origin); } catch { throw new StaffError("INVALID_ORIGIN", 403); }
  if (request.headers.get("origin") !== expected) throw new StaffError("INVALID_ORIGIN", 403);
}
export function cookieToken(request: Request, name = STAFF_COOKIE) {
  const raw = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1);
  try { return raw ? decodeURIComponent(raw) : undefined; } catch { return undefined; }
}
// This internal resolver may return aal1 for the MFA enrollment flow. Protected
// routes must use requireStaff/getStaff, which enforce the privileged aal2 gate.
export async function resolveStaffFromToken(token: string | undefined): Promise<Staff | null> {
  if (!staffConfigured() || !token || token.length > 8192) return null;
  try {
    const db = getSupabaseAdmin(); const auth = staffAuthClient();
    const [{ data: identity, error: userError }, { data: proof, error: claimsError }] = await Promise.all([db.auth.getUser(token), auth.auth.getClaims(token)]);
    if (userError || claimsError || !identity.user || identity.user.is_anonymous || !proof?.claims) return null;
    const claims = proof.claims;
    if (claims.sub !== identity.user.id || typeof claims.session_id !== "string" || !/^[0-9a-f-]{36}$/i.test(claims.session_id) || (claims.aal !== "aal1" && claims.aal !== "aal2")) return null;
    // Session deletion/revocation is checked on every request, not merely JWT expiry.
    const session = await db.rpc("staff_session_active", { p_user: identity.user.id, p_session: claims.session_id });
    if (session.error || session.data !== true) return null;
    const membership = await db.from("staff_members").select("role,active,kol_id").eq("user_id", identity.user.id).maybeSingle();
    if (membership.error || !membership.data?.active || !STAFF_ROLES.includes(membership.data.role)) return null;
    if (membership.data.role === "kol" && !membership.data.kol_id) return null;
    return { id: identity.user.id, email: identity.user.email ?? "", role: membership.data.role, kolId: membership.data.kol_id ?? null, aal: claims.aal === "aal2" ? "aal2" : "aal1", sessionId: claims.session_id };
  } catch { return null; }
}
export async function staffFromToken(token: string | undefined): Promise<Staff | null> {
  const staff = await resolveStaffFromToken(token);
  return staff && (!privilegedRole(staff.role) || staff.aal === "aal2") ? staff : null;
}
export async function getStaff() { const jar = await cookies(); return staffFromToken(jar.get(STAFF_COOKIE)?.value); }
export async function requireStaff(request: Request): Promise<Staff> {
  if (!staffConfigured()) throw new StaffError("STAFF_NOT_CONFIGURED", 503);
  const staff = await resolveStaffFromToken(cookieToken(request));
  if (!staff) throw new StaffError("SIGN_IN_REQUIRED", 401);
  if (privilegedRole(staff.role) && staff.aal !== "aal2") throw new StaffError("MFA_REQUIRED", 403);
  return staff;
}
export function staffCookieOptions(maxAge = 3600) { return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: Math.max(0, Math.min(maxAge, 3600)) }; }
