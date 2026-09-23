import { NextResponse } from "next/server";
import { isAdminRequest, isSameOriginRequest } from "@/lib/admin-auth";
import { upsertLiveSession } from "@/lib/admin/catalog";
import { errorResponse } from "@/lib/http";
import { liveSessionInputSchema } from "@/lib/ingest/live";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(null, "Invalid request origin.", 403);
  if (!isAdminRequest(request)) return errorResponse(null, "Admin sign-in required.", 401);
  try {
    const input = liveSessionInputSchema.parse(await request.json());
    const saved = await upsertLiveSession(input);
    return NextResponse.json({ ok: true, livestream: saved });
  } catch (error) {
    return errorResponse(error, "Livestream could not be saved.");
  }
}
