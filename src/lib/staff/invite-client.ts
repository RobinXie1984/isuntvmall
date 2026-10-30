// Module-scoped in-flight work survives React effect replay/remounts. No tokens
// are persisted in browser storage; the server issues scoped HttpOnly cookies.
export function createInviteInitializer() {
 let pending: Promise<{ ok: boolean; code?: string; email?: string }> | undefined;
 return function initialize(location: Pick<Location, "hash" | "pathname" | "search">, history: Pick<History, "state" | "replaceState">, send: typeof fetch) {
  if (pending) return pending;
  const fragment = new URLSearchParams(location.hash.slice(1));
  const accessToken = fragment.get("access_token"); const refreshToken = fragment.get("refresh_token");
  const providerError = fragment.has("error") || fragment.has("error_code");
  const body = accessToken && refreshToken ? { accessToken, refreshToken } : {};
  // Set pending before replaceState: routers may react to that history update.
  pending = Promise.resolve().then(async () => {
   if (providerError) return { ok: false, code: "INVITE_INVALID" };
   try { const response = await send("/api/admin/invite/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return await response.json(); }
   catch { return { ok: false, code: "INVITE_UNAVAILABLE" }; }
  });
  if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
  return pending;
 };
}
export const initializeInvitation = createInviteInitializer();
