import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown, fallback = "Something went wrong.", status = 400) {
  const message = error instanceof ZodError
    ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    : error instanceof Error
      ? error.message
      : fallback;
  return NextResponse.json({ ok: false, error: message }, { status });
}
