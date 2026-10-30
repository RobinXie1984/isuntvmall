import { inviteTokens, restoreInvitation, INVITE_ACCESS_COOKIE, INVITE_REFRESH_COOKIE, inviteCookieOptions } from "@/lib/staff/invite-session";
import { z } from "zod";
import { requireStaffOrigin, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
export async function POST(request: Request) {
 try {
  requireStaffOrigin(request);
  const body = z.object({ password: z.string().min(12).max(1024) }).strict().parse(await readStaffJson(request, 8192));
  const { auth, staff, session } = await restoreInvitation(inviteTokens(request));
  const db = getSupabaseAdmin();
  const result = await auth.auth.updateUser({ password: body.password });
  if (result.error) {
   const retry = staffResponse({ ok: false, code: "PASSWORD_SETUP_FAILED" }, 422);
   retry.cookies.set(INVITE_ACCESS_COOKIE, session.access_token, inviteCookieOptions());
   retry.cookies.set(INVITE_REFRESH_COOKIE, session.refresh_token, inviteCookieOptions());
   return retry;
  }
  const revoked = await db.from("staff_revoked_sessions").upsert({ session_id: staff.sessionId, user_id: staff.id }, { onConflict: "session_id", ignoreDuplicates: true });
  if (revoked.error) throw new StaffError("STAFF_OPERATION_FAILED", 503);
  await auth.auth.signOut({ scope: "local" });
  const response = staffResponse({ ok: true, redirect: "/admin/login" });
  response.cookies.set(INVITE_ACCESS_COOKIE, "", inviteCookieOptions(0));
  response.cookies.set(INVITE_REFRESH_COOKIE, "", inviteCookieOptions(0));
  return response;
 } catch (error) { return staffFailure(error); }
}
