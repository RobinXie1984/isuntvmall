"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { adminError, adminStatus } from "./admin-language";
import type { Kol, LiveSession, Product } from "@/types/commerce";

function localInputDate(date = new Date(Date.now() + 86_400_000)) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function AdminLivePanel({ sessions, products, kols }: { sessions: LiveSession[]; products: Product[]; kols: Kol[] }) {
  const { locale, t, localize } = useLocale();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        kolId: form.get("kolId"), slug: form.get("slug"), title: form.get("title"), description: form.get("description"), hostName: form.get("hostName"),
        platform: form.get("platform"), externalUrl: form.get("externalUrl"), embedId: form.get("embedId") || null, status: form.get("status"),
        startsAt: new Date(String(form.get("startsAt"))).toISOString(), posterUrl: form.get("posterUrl") || null,
        productIds: form.getAll("productIds"),
      }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Livestream could not be saved.");
      setMessage("saved"); window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Livestream could not be saved."); setBusy(false); }
  }
  return <><div className="admin-two-column live-admin-grid"><section className="admin-card"><span className="eyebrow">{t("EXTERNAL LIVE", "外部直播")}</span><h2>{t("Add or update livestream", "新增或更新直播")}</h2><p>{t("An existing slug updates the room. Supported YouTube and Facebook videos can be embedded; other sources open on their platform.", "相同網址別名會更新直播間。支援的 YouTube 及 Facebook 影片可嵌入，其他來源會前往原平台。")}</p><form className="admin-form" onSubmit={submit}>
    <div className="field-row"><label><span>{t("Program title", "節目名稱")}</span><input name="title" required /></label><label><span>{t("Slug", "網址別名")}</span><input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label></div><label><span>{t("Description", "節目簡介")}</span><textarea name="description" rows={3} /></label>
    <label><span>{t("Host identity", "主播身份")}</span><select name="kolId" required><option value="">{t("Select host", "選擇主播")}</option>{kols.filter(k=>k.status==="active").map(k=><option key={k.id} value={k.id}>{localize(k.displayName)}</option>)}</select></label><div className="field-row three"><label><span>{t("Host name", "主播名稱")}</span><input name="hostName" defaultValue="SunTV" required /></label><label><span>{t("Platform", "平台")}</span><select name="platform"><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="instagram">{t("Instagram (external)", "Instagram（外部連結）")}</option><option value="external">{t("Other platform", "其他平台")}</option></select></label><label><span>{t("Status", "狀態")}</span><select name="status"><option value="preview">{t("Preview", "預覽")}</option><option value="scheduled">{t("Scheduled", "已排程")}</option><option value="live">{t("Live", "直播中")}</option><option value="ended">{t("Ended", "已結束")}</option></select></label></div>
    <label><span>{t("Official livestream URL", "官方直播網址")}</span><input name="externalUrl" type="url" placeholder="https://…" required /></label><div className="field-row"><label><span>{t("Video or embed ID (optional)", "影片或嵌入識別碼（選填）")}</span><input name="embedId" /></label><label><span>{t("Start time", "開始時間")}</span><input name="startsAt" type="datetime-local" defaultValue={localInputDate()} required /></label></div><label><span>{t("Poster URL (optional)", "封面網址（選填）")}</span><input name="posterUrl" /></label>
    <fieldset className="product-picker"><legend>{t("Featured products for this room", "本場推薦商品")}</legend>{products.map((product) => <label key={product.id}><input type="checkbox" name="productIds" value={product.id} /><span>{localize(product.title)}<small>{product.sku}</small></span></label>)}</fieldset><button className="button" disabled={busy} type="submit">{t("Save livestream", "儲存直播")}</button>
  </form></section><section className="admin-card"><span className="eyebrow">{t("PROGRAMS", "節目")}</span><h2>{t("Program list", "節目清單")}</h2><div className="admin-session-list">{sessions.map((session) => <article key={session.id}><img src={session.posterUrl || "/demo/live-hero.svg"} alt="" /><div><span className={`status-chip ${session.status}`}>{adminStatus(session.status, locale)}</span><strong>{localize(session.title)}</strong><small>{adminStatus(session.platform, locale)} · {t(`${session.products.length} products`, `${session.products.length} 件商品`)}</small></div></article>)}</div></section></div>{(message || error) && <p className={error ? "admin-message error" : "admin-message"}>{error ? adminError(error, locale) : t("Livestream saved. Refreshing…", "直播已儲存，頁面即將重新整理…")}</p>}</>;
}
