import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  checkAdminPassword,
  createAdminToken,
  isSameOriginRequest,
} from "@/lib/admin-auth";
import { getAdminConfig } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  if (!getAdminConfig()) return NextResponse.json({ ok: false, error: "Admin access is not configured." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!checkAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ ok: false, error: "Password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
