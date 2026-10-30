import { z } from "zod";
import { requireStaffOrigin } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
import { inviteTokens, restoreInvitation, INVITE_ACCESS_COOKIE, INVITE_REFRESH_COOKIE, inviteCookieOptions } from "@/lib/staff/invite-session";
const input = z.object({ accessToken: z.string().min(1).max(3500), refreshToken: z.string().min(1).max(3500) }).strict();
// POST also resumes an existing setup. GET never rotates a refresh token.
export async function POST(request: Request) {
 try {
  requireStaffOrigin(request);
  const body = await readStaffJson(request, 8192);
  const tokens = body && typeof body === "object" && Object.keys(body).length === 0 ? inviteTokens(request) : input.parse(body);
  const { session, staff } = await restoreInvitation(tokens);
  const response = staffResponse({ ok: true, email: staff.email });
  response.cookies.set(INVITE_ACCESS_COOKIE, session.access_token, inviteCookieOptions());
  response.cookies.set(INVITE_REFRESH_COOKIE, session.refresh_token, inviteCookieOptions());
  return response;
 } catch (error) { return staffFailure(error); }
}
