import { z } from "zod";
import { STAFF_COOKIE, STAFF_PENDING_COOKIE, STAFF_PENDING_REFRESH_COOKIE, cookieToken, requireStaffOrigin, resolveStaffFromToken, staffAuthClient, staffCookieOptions, staffFromToken, staffLanding, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
export async function POST(request: Request) {
  try {
    requireStaffOrigin(request);
    const body = z.discriminatedUnion("action", [z.object({ action: z.literal("setup") }).strict(), z.object({ action: z.literal("verify"), factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict()]).parse(await readStaffJson(request, 2048));
    const access = cookieToken(request, STAFF_PENDING_COOKIE), refresh = cookieToken(request, STAFF_PENDING_REFRESH_COOKIE);
    if (!access || !refresh) throw new StaffError("SIGN_IN_REQUIRED", 401);
    const staff = await resolveStaffFromToken(access); if (!staff) throw new StaffError("SIGN_IN_REQUIRED", 401);
    const client = staffAuthClient(); const restored = await client.auth.setSession({ access_token: access, refresh_token: refresh });
    if (restored.error || restored.data.user?.id !== staff.id) throw new StaffError("SIGN_IN_REQUIRED", 401);
    const factors = await client.auth.mfa.listFactors(); if (factors.error) throw new StaffError("MFA_UNAVAILABLE", 503);
    if (body.action === "setup") {
      const verified = factors.data.totp.find(f => f.status === "verified");
      if (verified) return staffResponse({ ok: true, factorId: verified.id, enrolled: true });
      // Clear only this signed-in user's unverified TOTP setup attempts. No
      // verified factor is removed, and no account-wide recovery is performed.
      for (const factor of factors.data.all.filter(f => f.factor_type === "totp" && f.status === "unverified")) await client.auth.mfa.unenroll({ factorId: factor.id });
      const enrollment = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "iSunTVMall staff", issuer: "iSunTVMall" });
      if (enrollment.error || enrollment.data.type !== "totp") throw new StaffError("MFA_UNAVAILABLE", 503);
      // The TOTP secret is shown only to the authenticated member through this
      // private no-store response. It is never persisted or included in logs.
      return staffResponse({ ok: true, factorId: enrollment.data.id, enrolled: false, qrCode: enrollment.data.totp.qr_code });
    }
    if (!factors.data.all.some(f => f.id === body.factorId && f.factor_type === "totp")) throw new StaffError("MFA_FACTOR_INVALID", 403);
    const verified = await client.auth.mfa.challengeAndVerify({ factorId: body.factorId, code: body.code });
    if (verified.error || !verified.data.access_token) throw new StaffError("MFA_CODE_INVALID", 401);
    const checked = await staffFromToken(verified.data.access_token); if (!checked || checked.id !== staff.id || checked.aal !== "aal2") throw new StaffError("MFA_REQUIRED", 403);
    const response = staffResponse({ ok: true, redirect: staffLanding(checked) });
    response.cookies.set(STAFF_COOKIE, verified.data.access_token, staffCookieOptions(verified.data.expires_in));
    response.cookies.set(STAFF_PENDING_COOKIE, "", staffCookieOptions(0)); response.cookies.set(STAFF_PENDING_REFRESH_COOKIE, "", staffCookieOptions(0));
    return response;
  } catch (error) { return staffFailure(error); }
}
