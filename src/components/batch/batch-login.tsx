"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
export function BatchLogin({ configured }: { configured: boolean }) {
  const { t } = useLocale(); const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/admin/batches/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) { setFailed(true); return; }
      setPassword(""); router.replace("/admin/batches"); router.refresh();
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  return <div className="shell page-space"><form className="admin-login-card" onSubmit={submit}><span className="eyebrow">{t("MERCHANDISE STUDIO", "商品工作室")}</span><h1>{t("Team sign-in", "團隊登入")}</h1><p>{t("Prepare merchandise with your own account. Final approval belongs to a super admin.", "以個人帳戶準備商品，最後由超級管理員審批。")}</p>{!configured && <p className="notice">{t("The private team workspace is awaiting account and storage setup. You can explore the workflow preview now.", "私人團隊工作區正等待帳戶及儲存空間設定，您可先探索流程預覽。")}</p>}<label><span>{t("Email", "電郵")}</span><input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} disabled={!configured || busy} required /></label><label><span>{t("Password", "密碼")}</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={!configured || busy} required /></label>{failed && <p role="alert" className="form-error">{t("Sign-in failed. Check your account details and team access.", "登入失敗，請檢查帳戶資料及團隊存取權限。")}</p>}<button className="button button-block" disabled={!configured || busy}>{busy ? t("Signing in…", "登入中…") : t("Sign in", "登入")}</button><p><Link className="text-link" href="/batch-helper">{t("Explore the batch helper", "探索批次助手")} →</Link></p></form></div>;
}
