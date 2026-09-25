import { z } from "zod";
import { STAFF_COOKIE, staffAuthClient, staffCookieOptions, staffFromToken, requireBatchOrigin } from "@/lib/batch/auth";
import { readBatchJson, BatchError } from "@/lib/batch/contracts";
import { batchFailure, batchResponse } from "@/lib/batch/server";

export async function POST(request: Request) {
  try {
    requireBatchOrigin(request);
    const body = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) }).strict().parse(await readBatchJson(request, 4096));
    const { data, error } = await staffAuthClient().auth.signInWithPassword(body);
    if (error || !data.session) throw new BatchError("SIGN_IN_FAILED", 401);
    const staff = await staffFromToken(data.session.access_token);
    if (!staff) throw new BatchError("SIGN_IN_FAILED", 401);
    const response = batchResponse({ ok: true });
    response.cookies.set(STAFF_COOKIE, data.session.access_token, staffCookieOptions(data.session.expires_in));
    return response;
  } catch (error) { return batchFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    requireBatchOrigin(request);
    const response = batchResponse({ ok: true });
    response.cookies.set(STAFF_COOKIE, "", staffCookieOptions(0));
    return response;
  } catch (error) { return batchFailure(error); }
}
