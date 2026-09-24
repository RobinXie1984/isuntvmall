"use client";
import { useState } from "react";
import type { Kol } from "@/types/commerce";
import { useLocale } from "@/components/i18n/locale-provider";
import { adminError, adminStatus } from "./admin-language";
export function AdminKolsPanel({ kols }: { kols: Kol[] }) {
  const { locale, t, localize } = useLocale();
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const f = new FormData(event.currentTarget);
    try { const r = await fetch("/api/admin/kols", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(f)) }); const data = await r.json(); if (!r.ok) throw new Error(data.error || "Host could not be saved."); window.location.reload(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Host could not be saved."); setBusy(false); }
  }
  return <div className="admin-two-column"><section className="admin-card"><span className="eyebrow">{t("HOST DIRECTORY", "主播名冊")}</span><h2>{t("Add or update host", "新增或更新主播")}</h2><p>{t("Existing slugs update a profile. This operator directory does not grant login or social permissions.", "相同網址別名會更新資料。主播名冊不授予登入或社交平台權限。")}</p><form className="admin-form" onSubmit={submit}><label>{t("Display name", "顯示名稱")}<input name="displayName" required maxLength={120} /></label><label>{t("Slug", "網址別名")}<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required maxLength={80} /></label><label>{t("About", "簡介")}<textarea name="bio" maxLength={1500} /></label><label>{t("Status", "狀態")}<select name="status"><option value="active">{t("Active", "啟用")}</option><option value="inactive">{t("Inactive", "停用")}</option></select></label><button className="button" disabled={busy}>{busy ? t("Saving…", "儲存中…") : t("Save host", "儲存主播")}</button>{message && <p role="alert">{adminError(message, locale)}</p>}</form></section><section className="admin-card"><h2>{t("Hosts", "主播")}</h2>{kols.map(k => <article className="host-profile" key={k.id}><span className="host-avatar">{localize(k.displayName).slice(0, 1)}</span><div><strong>{localize(k.displayName)}</strong><p>{localize(k.bio)}</p><small>{k.slug} · {adminStatus(k.status, locale)}</small></div></article>)}</section></div>;
}
