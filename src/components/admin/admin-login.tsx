"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { adminError } from "./admin-language";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Could not sign in.");
        setBusy(false);
        return;
      }
      router.replace("/admin/products");
      router.refresh();
    } catch { setError("Could not sign in."); setBusy(false); }
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <span className="eyebrow">{t("OPERATOR CONSOLE", "營運後台")}</span>
      <h1>{t("Operator sign-in", "營運登入")}</h1>
      <p>{t("Manage products, schedule livestreams and review orders.", "管理商品、安排直播及查看訂單。")}</p>
      {!configured && <p className="notice warning">{t("Set ADMIN_PASSWORD and an ADMIN_SESSION_SECRET of at least 32 characters in the deployment environment.", "請在部署環境設定 ADMIN_PASSWORD，以及至少 32 個字元的 ADMIN_SESSION_SECRET。")}</p>}
      <input type="text" name="username" value="operator" autoComplete="username" readOnly hidden />
      <label><span>{t("Operator password", "營運密碼")}</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured} required /></label>
      {error && <p className="form-error" role="alert">{adminError(error, locale)}</p>}
      <button className="button button-block" type="submit" disabled={!configured || busy}>{busy ? t("Verifying…", "驗證中…") : t("Sign in", "登入後台")}</button>
    </form>
  );
}
