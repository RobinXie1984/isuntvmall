import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";
import { STAFF_COOKIE, STAFF_PENDING_COOKIE, STAFF_PENDING_REFRESH_COOKIE, staffAuthClient, staffCookieOptions, resolveStaffFromToken, cookieToken, requireStaffOrigin, privilegedRole, staffLanding, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireStaffOrigin(request);
    const body = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) }).strict().parse(await readStaffJson(request, 4096));
    const auth = staffAuthClient(); const { data, error } = await auth.auth.signInWithPassword(body);
    if (error || !data.session) throw new StaffError("SIGN_IN_FAILED", 401);
    const staff = await resolveStaffFromToken(data.session.access_token);
    if (!staff) { await auth.auth.signOut({ scope: "local" }); throw new StaffError("SIGN_IN_FAILED", 401); }
    const needsMfa = privilegedRole(staff.role) && staff.aal !== "aal2";
    const response = staffResponse({ ok: true, mfaRequired: needsMfa, redirect: needsMfa ? "/admin/mfa" : staffLanding(staff) });
    response.cookies.set(ADMIN_COOKIE, "", adminCookieOptions());
    response.cookies.set(STAFF_COOKIE, needsMfa ? "" : data.session.access_token, staffCookieOptions(needsMfa ? 0 : data.session.expires_in));
    response.cookies.set(STAFF_PENDING_COOKIE, needsMfa ? data.session.access_token : "", staffCookieOptions(needsMfa ? 600 : 0));
    response.cookies.set(STAFF_PENDING_REFRESH_COOKIE, needsMfa ? data.session.refresh_token : "", staffCookieOptions(needsMfa ? 600 : 0));
    return response;
  } catch (error) { return staffFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    requireStaffOrigin(request);
    for (const name of [STAFF_COOKIE, STAFF_PENDING_COOKIE]) {
      const token = cookieToken(request, name); const staff = await resolveStaffFromToken(token);
      if (staff && token) {
        const db = getSupabaseAdmin(); const { error } = await db.from("staff_revoked_sessions").upsert({ session_id: staff.sessionId, user_id: staff.id }, { onConflict: "session_id", ignoreDuplicates: true });
        if (error) throw new StaffError("SIGN_OUT_FAILED", 503);
        await db.auth.admin.signOut(token, "local");
      }
    }
    const response = staffResponse({ ok: true });
    for (const name of [STAFF_COOKIE, STAFF_PENDING_COOKIE, STAFF_PENDING_REFRESH_COOKIE, ADMIN_COOKIE]) response.cookies.set(name, "", staffCookieOptions(0));
    return response;
  } catch (error) { return staffFailure(error); }
}
