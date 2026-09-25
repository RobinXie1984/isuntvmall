"use client";
import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { staffMessage } from "@/lib/staff/messages";
export function AdminLogin({ configured }: { configured: boolean }) {
 const { locale, t } = useLocale(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
  try { const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); const data = await response.json(); if (!response.ok) { setError(data.code || "SIGN_IN_FAILED"); return; } window.location.assign(data.mfaRequired ? "/admin/mfa" : data.redirect || "/admin/products"); }
  catch { setError("SIGN_IN_FAILED"); } finally { setBusy(false); }
 }
 return <form className="admin-login-card" onSubmit={submit}><span className="eyebrow">{t("STAFF CONSOLE", "員工後台")}</span><h1>{t("Named staff sign-in", "員工個人帳戶登入")}</h1><p>{t("Use your own approved staff account. Privileged roles require an authenticator code.", "請使用已獲批准的個人員工帳戶。特權角色必須通過驗證器驗證。")}</p>{!configured && <p className="notice warning">{t("Staff sign-in is not configured yet.", "員工登入尚未設定。")}</p>}<label><span>{t("Email", "電子郵件")}</span><input name="email" type="email" autoComplete="username" maxLength={254} disabled={!configured} required /></label><label><span>{t("Password", "密碼")}</span><input name="password" type="password" autoComplete="current-password" maxLength={1024} disabled={!configured} required /></label>{error && <p className="form-error" role="alert">{staffMessage(error, locale)}</p>}<button className="button button-block" disabled={!configured || busy}>{busy ? t("Verifying…", "驗證中…") : t("Sign in", "登入")}</button></form>;
}
