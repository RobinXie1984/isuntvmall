import { z } from "zod";
import { requireStaffOrigin, resolveStaffFromToken, staffAuthClient, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
export async function POST(request: Request) {
 try {
  requireStaffOrigin(request);
  const body = z.object({ accessToken: z.string().min(1).max(8192), refreshToken: z.string().min(1).max(4096), password: z.string().min(12).max(1024) }).strict().parse(await readStaffJson(request, 16384));
  const staff = await resolveStaffFromToken(body.accessToken); if (!staff) throw new StaffError("INVITE_INVALID", 401);
  const db = getSupabaseAdmin(); const invite = await db.from("staff_invitations").select("id").eq("user_id", staff.id).eq("status", "ready").limit(1).maybeSingle();
  if (invite.error || !invite.data) throw new StaffError("INVITE_INVALID", 401);
  const auth = staffAuthClient(); const restored = await auth.auth.setSession({ access_token: body.accessToken, refresh_token: body.refreshToken });
  if (restored.error || restored.data.user?.id !== staff.id) throw new StaffError("INVITE_INVALID", 401);
  const result = await auth.auth.updateUser({ password: body.password }); if (result.error) throw new StaffError("PASSWORD_SETUP_FAILED", 422);
  const revoked = await db.from("staff_revoked_sessions").upsert({ session_id: staff.sessionId, user_id: staff.id }, { onConflict: "session_id", ignoreDuplicates: true });
  if (revoked.error) throw new StaffError("STAFF_OPERATION_FAILED", 503);
  await auth.auth.signOut({ scope: "local" });
  return staffResponse({ ok: true, redirect: "/admin/login" });
 } catch (error) { return staffFailure(error); }
}
