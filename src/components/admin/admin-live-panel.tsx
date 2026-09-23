"use client";

import { useState } from "react";
import type { Kol, LiveSession, Product } from "@/types/commerce";

function localInputDate(date = new Date(Date.now() + 86_400_000)) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function AdminLivePanel({ sessions, products, kols }: { sessions: LiveSession[]; products: Product[]; kols: Kol[] }) {
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
      if (!response.ok) throw new Error(result.error || "直播保存失败。");
      setMessage("直播已保存。页面即将刷新。"); window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "直播保存失败。"); setBusy(false); }
  }
  return <><div className="admin-two-column live-admin-grid"><section className="admin-card"><span className="eyebrow">EXTERNAL LIVE</span><h2>新增或更新直播</h2><p>网址别名相同会更新。YouTube/Facebook 可嵌入；TikTok 不可嵌入时安全跳转。</p><form className="admin-form" onSubmit={submit}>
    <div className="field-row"><label><span>节目名称</span><input name="title" required /></label><label><span>网址别名</span><input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label></div><label><span>节目简介</span><textarea name="description" rows={3} /></label>
    <label><span>KOL identity / 主播身份</span><select name="kolId" required><option value="">Select host / 选择主播</option>{kols.filter(k=>k.status==="active").map(k=><option key={k.id} value={k.id}>{k.displayName}</option>)}</select></label><div className="field-row three"><label><span>主播</span><input name="hostName" defaultValue="SunTV" required /></label><label><span>平台</span><select name="platform"><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="instagram">Instagram (external)</option><option value="external">其他平台</option></select></label><label><span>状态</span><select name="status"><option value="preview">Preview / 演示</option><option value="scheduled">预告</option><option value="live">直播中</option><option value="ended">回放</option></select></label></div>
    <label><span>官方直播网址</span><input name="externalUrl" type="url" placeholder="https://…" required /></label><div className="field-row"><label><span>视频 / Embed ID（可选）</span><input name="embedId" /></label><label><span>开始时间</span><input name="startsAt" type="datetime-local" defaultValue={localInputDate()} required /></label></div><label><span>封面网址（可选）</span><input name="posterUrl" /></label>
    <fieldset className="product-picker"><legend>本场推荐商品</legend>{products.map((product) => <label key={product.id}><input type="checkbox" name="productIds" value={product.id} /><span>{product.title}<small>{product.sku}</small></span></label>)}</fieldset><button className="button" disabled={busy} type="submit">保存直播</button>
  </form></section><section className="admin-card"><span className="eyebrow">PROGRAMS</span><h2>节目清单</h2><div className="admin-session-list">{sessions.map((session) => <article key={session.id}><img src={session.posterUrl || "/demo/live-hero.svg"} alt="" /><div><span className={`status-chip ${session.status}`}>{session.status}</span><strong>{session.title}</strong><small>{session.platform} · {session.products.length} 件商品</small></div></article>)}</div></section></div>{(message || error) && <p className={error ? "admin-message error" : "admin-message"}>{error || message}</p>}</>;
}
