"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { BroadcastPlayer } from "@/components/broadcast/broadcast-player";
import { broadcastEmbed, broadcastPayloadSchema, broadcastTitle, type Broadcast } from "@/lib/broadcasts/contracts";
import { productTitle } from "@/lib/product-copy";
import type { Product } from "@/types/commerce";
import { broadcastAdminCopy } from "./broadcast-admin-copy";
import "./broadcast-workspace.css";

type Notice = "saved" | "invalid" | "failed" | "stale" | "loadFailed" | "permission" | "";
export function BroadcastWorkspace({ initial, products }: { initial: Broadcast[]; products: Product[] }) {
  const { locale, localize } = useLocale();
  const copy = broadcastAdminCopy[locale];
  const [records, setRecords] = useState(initial);
  const [draft, setDraft] = useState<Broadcast | null>(initial.find(item => item.kind === "introduction") ?? initial[0] ?? null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>("");
  const [needsReload, setNeedsReload] = useState(false);
  const persisted = records.find(item => item.id === draft?.id);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(persisted);
  const selectedProducts = draft?.productIds ?? [];
  const query = search.trim().toLocaleLowerCase();
  const matches = products.filter(product => !query || `${productTitle(product, locale, localize)} ${product.sku}`.toLocaleLowerCase().includes(query));
  const missingProducts = selectedProducts.filter(id => !products.some(product => product.id === id));
  let validPreview = false;
  if (draft?.url) { try { broadcastEmbed(draft.url); validPreview = true; } catch { /* Invalid URLs remain editable and never become iframe sources. */ } }

  function change<K extends keyof Broadcast>(key: K, value: Broadcast[K]) { setDraft(current => current ? { ...current, [key]: value } : current); if (notice === "saved" || notice === "invalid") setNotice(""); }
  function discardAllowed() { return !dirty || window.confirm(copy.discard); }
  function select(id: string) { if (!discardAllowed()) return; setDraft(records.find(item => item.id === id) ?? null); setNotice(""); setNeedsReload(false); setSearch(""); }
  function add(kind: Broadcast["kind"]) {
    const existing = kind === "introduction" ? records.find(item => item.kind === kind) : undefined;
    if (existing) { select(existing.id); return; }
    if (!discardAllowed()) return;
    setDraft({ id: crypto.randomUUID(), revision: 0, kind, title: kind === "introduction" ? broadcastAdminCopy.en.newIntro : broadcastAdminCopy.en.newTitle, titleZh: kind === "introduction" ? broadcastAdminCopy["zh-Hant"].newIntro : broadcastAdminCopy["zh-Hant"].newTitle, titleHans: kind === "introduction" ? broadcastAdminCopy["zh-Hans"].newIntro : broadcastAdminCopy["zh-Hans"].newTitle, titleJa: kind === "introduction" ? broadcastAdminCopy.ja.newIntro : broadcastAdminCopy.ja.newTitle, url: "", thumbnailUrl: "", position: Math.min(10000, Math.max(0, ...records.map(item => item.position)) + 10), visible: false, status: "recorded", productIds: [] });
    setNotice(""); setNeedsReload(false); setSearch("");
  }
  async function reload() {
    if (!discardAllowed()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/broadcasts", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) { setNotice("permission"); return; }
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!Array.isArray(data.broadcasts)) throw Error();
      const next: Broadcast[] = data.broadcasts;
      setRecords(next); setDraft(next.find(item => item.id === draft?.id) ?? next.find(item => item.kind === "introduction") ?? next[0] ?? null); setNeedsReload(false); setNotice("");
    } catch { setNotice("loadFailed"); } finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft || busy || needsReload) return;
    const { id, revision, ...payload } = draft;
    const parsed = broadcastPayloadSchema.safeParse(payload);
    if (!parsed.success) { setNotice("invalid"); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/broadcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, revision, payload: parsed.data }) });
      if (response.status === 401 || response.status === 403) { setNotice("permission"); return; }
      if (response.status === 409) {
        const error = await response.json().catch(() => null);
        setNotice(error?.code === "STALE_BROADCAST" ? "stale" : "failed");
        setNeedsReload(true);
        return;
      }
      if (response.status === 422 || response.status === 400) { setNotice("invalid"); return; }
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!Array.isArray(data.broadcasts)) throw Error();
      const next: Broadcast[] = data.broadcasts;
      const saved = next.find(item => item.id === id);
      if (!saved) throw Error();
      setRecords(next); setDraft(saved); setNeedsReload(false); setNotice("saved");
    } catch { setNotice("failed"); setNeedsReload(true); } finally { setBusy(false); }
  }
  function toggleProduct(id: string, selected: boolean) {
    change("productIds", selected ? [...selectedProducts, id] : selectedProducts.filter(item => item !== id));
  }

  return <section className="admin-table-card broadcast-admin">
    <header className="admin-card-heading"><div><h1>{copy.heading}</h1><p>{copy.description}</p></div></header>
    <div className="broadcast-admin-tools"><label>{copy.choose}<select value={draft && persisted ? draft.id : ""} disabled={busy} onChange={event => select(event.target.value)}><option value="" disabled>{draft && !persisted ? broadcastTitle(draft, locale) : copy.choose}</option>{records.map(item => <option key={item.id} value={item.id}>{item.kind === "introduction" ? `${copy.introduction} · ` : ""}{broadcastTitle(item, locale)} · {item.visible ? copy.visibleLabel : copy.hidden}</option>)}</select></label><button type="button" className="button button-secondary" disabled={busy} onClick={() => add("introduction")}>{copy.introduction}</button><button type="button" className="button" disabled={busy} onClick={() => add("broadcast")}>{copy.newBroadcast}</button><button type="button" className="text-link" disabled={busy} onClick={() => void reload()}>{copy.refresh}</button></div>
    {notice && <p className={`broadcast-admin-notice ${notice === "saved" ? "success" : ""}`} role={notice === "saved" ? "status" : "alert"}>{copy[notice]}</p>}
    {!draft ? <p>{copy.empty}</p> : <form onSubmit={event => void save(event)}>
      <fieldset disabled={busy}><legend>{draft.kind === "introduction" ? copy.introduction : copy.edit} · {dirty ? copy.unsaved : copy.savedVersion}</legend>
        {draft.kind === "introduction" && <p className="broadcast-admin-help">{copy.introductionNote}</p>}
        <div className="broadcast-admin-fields"><label>{copy.title}<input required maxLength={180} value={draft.title} lang="en" onChange={event => change("title", event.target.value)} /></label><label>{copy.titleZh}<input required maxLength={180} value={draft.titleZh} lang="zh-Hant" onChange={event => change("titleZh", event.target.value)} /></label><label>{copy.titleHans}<input required maxLength={180} value={draft.titleHans} lang="zh-Hans" onChange={event => change("titleHans", event.target.value)} /></label><label>{copy.titleJa}<input required maxLength={180} value={draft.titleJa} lang="ja" onChange={event => change("titleJa", event.target.value)} /></label></div>
        <label>{copy.url}<input type="url" required maxLength={2000} value={draft.url} onChange={event => change("url", event.target.value)} autoComplete="off" /><small>{copy.urlHelp}</small></label>
        <label>{copy.thumbnail}<input maxLength={2000} value={draft.thumbnailUrl} onChange={event => change("thumbnailUrl", event.target.value)} autoComplete="off" /><small>{copy.thumbnailHelp}</small></label>
        <div className="broadcast-admin-fields"><label>{copy.position}<input type="number" min={0} max={10000} step={1} required value={Number.isNaN(draft.position) ? "" : draft.position} onChange={event => change("position", event.target.valueAsNumber)} /><small>{copy.positionHelp}</small></label><label>{copy.status}<select value={draft.status} onChange={event => change("status", event.target.value as Broadcast["status"])}><option value="recorded">{copy.recorded}</option><option value="live">{copy.live}</option><option value="scheduled">{copy.scheduled}</option></select><small>{copy.statusHelp}</small></label></div>
        <label className="broadcast-admin-check"><input type="checkbox" checked={draft.visible} onChange={event => change("visible", event.target.checked)} />{copy.visible}</label>
        <section className="broadcast-admin-products"><h2>{copy.products}</h2><p className="broadcast-admin-help">{copy.productsHelp}</p><label>{copy.search}<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label><p className="broadcast-admin-help">{copy.selected}: {selectedProducts.length} / 100</p>
          <div className="broadcast-admin-product-list">{matches.map(product => <label className="broadcast-admin-check" key={product.id}><input type="checkbox" checked={selectedProducts.includes(product.id)} disabled={!selectedProducts.includes(product.id) && selectedProducts.length >= 100} onChange={event => toggleProduct(product.id, event.target.checked)} /><span>{productTitle(product, locale, localize)}<small>{product.sku}</small></span></label>)}{!matches.length && <p>{copy.noneFound}</p>}</div>
          {missingProducts.map(id => <p className="broadcast-admin-missing" key={id}>{copy.unavailable}: <code>{id}</code> <button type="button" className="text-link" onClick={() => toggleProduct(id, false)}>{copy.remove}</button></p>)}
        </section>
        <div className="broadcast-admin-save"><button type="submit" className="button" disabled={busy || needsReload || !dirty}>{busy ? copy.saving : copy.save}</button>{persisted?.visible ? <Link className="text-link" href={`/watch/${persisted.id}`} target="_blank" rel="noopener noreferrer">{copy.publicPreview} ↗</Link> : <small>{copy.hiddenPreview}</small>}</div>
      </fieldset>
      <section className="broadcast-admin-preview"><h2>{copy.preview}</h2>{validPreview ? <BroadcastPlayer broadcast={draft} locale={locale} /> : <p className="broadcast-admin-help">{copy.previewInvalid}</p>}</section>
    </form>}
  </section>;
}
