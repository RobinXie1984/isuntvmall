import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig } from "@/lib/env";

export const ADMIN_COOKIE = "suntv_admin";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function checkAdminPassword(candidate: string) {
  const config = getAdminConfig();
  return Boolean(config && safeEqual(candidate, config.password));
}

export function createAdminToken(now = Date.now()) {
  const config = getAdminConfig();
  if (!config) throw new Error("Admin access is not configured.");
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${sign(payload, config.sessionSecret)}`;
}

export function verifyAdminToken(token: string | undefined, now = Date.now()) {
  const config = getAdminConfig();
  if (!config || !token) return false;
  const parts = token.split(".");
  if(parts.length !== 3) return false;
  const [version, expiresText, signature] = parts;
  if (version !== "v1" || !expiresText || !signature) return false;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(now / 1000)) return false;
  return safeEqual(signature, sign(`${version}.${expiresText}`, config.sessionSecret));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

export function isAdminRequest(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);
  try { return verifyAdminToken(cookie ? decodeURIComponent(cookie) : undefined); } catch { return false; }
}

export function isSameOriginRequest(request: Request) {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;
  try {
    const sourceOrigin = new URL(source).origin;
    const requestOrigin = new URL(request.url).origin;
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
    const forwardedProtocol = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
    const protocol = forwardedProtocol === "http" || forwardedProtocol === "https" ? `${forwardedProtocol}:` : new URL(request.url).protocol;
    const hostOrigin = host ? new URL(`${protocol}//${host}`).origin : requestOrigin;
    return sourceOrigin === requestOrigin || sourceOrigin === hostOrigin;
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
