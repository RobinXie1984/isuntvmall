import "server-only";
import { cookieToken, resolveStaffFromToken, staffAuthClient, STAFF_COOKIE, StaffError } from "./auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
export const INVITE_ACCESS_COOKIE = `${STAFF_COOKIE}_invite`;
export const INVITE_REFRESH_COOKIE = `${STAFF_COOKIE}_invite_refresh`;
export const inviteCookieOptions = (maxAge = 3600) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/api/admin/invite", maxAge });
export function inviteTokens(request: Request) { return { accessToken: cookieToken(request, INVITE_ACCESS_COOKIE) || "", refreshToken: cookieToken(request, INVITE_REFRESH_COOKIE) || "" }; }
export async function restoreInvitation(tokens: { accessToken: string; refreshToken: string }) {
 if (!tokens.accessToken || !tokens.refreshToken) throw new StaffError("INVITE_SESSION_MISSING", 401);
 const auth = staffAuthClient();
 const restored = await auth.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
 if (restored.error || !restored.data.session || !restored.data.user) throw new StaffError("INVITE_INVALID", 401);
 const session = restored.data.session;
 const staff = await resolveStaffFromToken(session.access_token);
 if (!staff || staff.id !== restored.data.user.id) throw new StaffError("INVITE_INVALID", 401);
 const invite = await getSupabaseAdmin().from("staff_invitations").select("id").eq("user_id", staff.id).eq("status", "ready").limit(1).maybeSingle();
 if (invite.error) throw new StaffError("INVITE_UNAVAILABLE", 503);
 if (!invite.data) throw new StaffError("INVITE_INVALID", 401);
 return { auth, staff, session };
}
