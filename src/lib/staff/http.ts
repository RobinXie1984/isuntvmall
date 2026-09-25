import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffError } from "./permissions";
export const STAFF_PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
export function staffResponse(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: STAFF_PRIVATE_HEADERS }); }
export function staffFailure(error: unknown) {
  if (error instanceof StaffError) return staffResponse({ ok: false, code: error.code }, error.status);
  if (error instanceof z.ZodError) return staffResponse({ ok: false, code: "INVALID_INPUT" }, 422);
  return staffResponse({ ok: false, code: "STAFF_OPERATION_FAILED" }, 409);
}
export async function readStaffJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new StaffError("JSON_REQUIRED", 415);
  if (Number(request.headers.get("content-length")) > maxBytes) throw new StaffError("REQUEST_TOO_LARGE", 413);
  const reader = request.body?.getReader(); if (!reader) throw new StaffError("INVALID_INPUT", 422);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > maxBytes) { await reader.cancel(); throw new StaffError("REQUEST_TOO_LARGE", 413); } chunks.push(value); }
    const combined = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(combined));
  } catch (error) { if (error instanceof StaffError) throw error; throw new StaffError("INVALID_INPUT", 422); } finally { reader.releaseLock(); }
}
