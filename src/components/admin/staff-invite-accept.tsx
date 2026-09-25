"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { staffMessage } from "@/lib/staff/messages";
export function StaffInviteAccept() {
 const router = useRouter(); const { locale, t } = useLocale(); const tokens = useRef({ accessToken: "", refreshToken: "" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
 useEffect(() => { const fragment = new URLSearchParams(window.location.hash.slice(1)); tokens.current = { accessToken: fragment.get("access_token") || "", refreshToken: fragment.get("refresh_token") || "" }; window.history.replaceState(null, "", window.location.pathname); }, []);
 async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!tokens.current.accessToken || !tokens.current.refreshToken) { setError("INVITE_INVALID"); return; } setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch("/api/admin/invite/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...tokens.current, password: form.get("password") }) }); const data = await response.json(); if (!response.ok) { setError(data.code || "PASSWORD_SETUP_FAILED"); return; } tokens.current = { accessToken: "", refreshToken: "" }; router.replace("/admin/login"); router.refresh(); } catch { setError("PASSWORD_SETUP_FAILED"); } finally { setBusy(false); } }
 return <form className="admin-login-card" onSubmit={submit}><h1>{t("Accept staff invitation", "接受員工邀請")}</h1><p>{t("Set a password of at least 12 characters, then sign in with your invited email. Privileged roles will set up an authenticator before accessing the console.", "請設定至少 12 個字元的密碼，再以受邀電子郵件登入。特權角色必須先設定驗證器，才能進入後台。")}</p><label>{t("New password", "新密碼")}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label><button className="button" disabled={busy}>{t("Set password", "設定密碼")}</button>{error && <p role="alert">{staffMessage(error, locale)}</p>}</form>;
}
