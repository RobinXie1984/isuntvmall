"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { staffMessage } from "@/lib/staff/messages";
import { initializeInvitation } from "@/lib/staff/invite-client";
export function StaffInviteAccept() {
 const { locale, t } = useLocale(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false); const [checking, setChecking] = useState(true); const [email, setEmail] = useState("");
 useEffect(() => { let mounted = true; initializeInvitation(window.location, window.history, window.fetch.bind(window)).then(result => { if (!mounted) return; setReady(result.ok); setEmail(result.email || ""); setError(result.ok ? "" : result.code || "INVITE_UNAVAILABLE"); setChecking(false); }); return () => { mounted = false; }; }, []);
 async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!ready || busy) return; setBusy(true); setError(""); const form = new FormData(event.currentTarget); try { const response = await fetch("/api/admin/invite/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) }); const data = await response.json(); if (!response.ok) { setError(data.code || "PASSWORD_SETUP_FAILED"); if (response.status === 401) setReady(false); return; } window.location.replace("/admin/login"); } catch { setError("PASSWORD_SETUP_FAILED"); } finally { setBusy(false); } }
 return <form className="admin-login-card" onSubmit={submit}><h1>{t("Set up your staff password", "設定員工密碼", "スタッフ用パスワードを設定")}</h1>
 {checking && <p role="status">{t("Checking your secure setup link…", "正在檢查安全設定連結…", "設定リンクを確認しています…")}</p>}
 {ready && <><p>{t("Set a password of at least 12 characters, then sign in with your invited email. Privileged roles will set up an authenticator before accessing the console.", "請設定至少 12 個字元的密碼，再以受邀電子郵件登入。特權角色必須先設定驗證器，才能進入後台。")}</p><p>{email}</p><label>{t("New password", "新密碼")}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></label><button className="button" disabled={busy}>{t("Set password", "設定密碼")}</button></>}
 {error && <p role="alert">{staffMessage(error, locale)}</p>}
 {!checking && !ready && <p>{t("Open the newest setup email. If you already set your password, sign in. If the link has already been used, ask your administrator for a password setup email.", "請開啟最新的設定電郵。若已設定密碼，請登入。若連結已使用，請向管理員索取密碼設定電郵。", "最新の設定メールを開いてください。パスワード設定済みの場合はログインしてください。リンクを使用済みの場合は、管理者にパスワード設定メールを依頼してください。")}</p>}
 {!checking && <p><a href="/admin/login">{t("Go to staff sign-in", "前往員工登入", "スタッフログインへ")}</a></p>}</form>;
}
