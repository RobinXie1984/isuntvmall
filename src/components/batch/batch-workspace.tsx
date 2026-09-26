"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { stylePresets, getStylePreset, DEFAULT_STYLE } from "@/lib/styles";
import { createBatchSchema, draftProductSchema, IMAGE_MIMES, MAX_BATCH_FILES, MAX_IMAGE_BYTES, type BatchItem, type BatchRole, type BatchStatus, type DraftProduct, type MediaBatch } from "@/lib/batch/contracts";
import { reviewSelectionKey } from "@/lib/batch/review-selection";
import { parseBatchManifest } from "@/lib/batch/manifest";

const statusCopy: Record<BatchStatus, [string, string]> = { awaiting_upload: ["Awaiting upload", "等待上傳"], queued: ["Queued", "等候處理"], processing: ["Processing", "處理中"], review: ["Ready for review", "待審閱"], rejected: ["Returned", "已退回"], approved: ["Approved", "已核准"], publishing: ["Publishing", "刊登中"], published: ["Published", "已刊登"], failed: ["Needs attention", "需跟進"] };
const samples = [
  ["linen-overshirt", "Linen overshirt", "亞麻罩衫", 22800],
  ["stoneware-mug", "Stoneware mug", "炻器馬克杯", 6800],
  ["weekend-duffel", "Weekend duffel", "週末旅行袋", 29800],
] as const;
const previewItems: BatchItem[] = samples.map(([slug, title, , price], index) => ({ id: `sample-${index}`, batch_id: "sample", filename: `${slug}.jpg`, mime: "image/jpeg", byte_size: 0, original_path: "", processed_path: null, product_data: { sku: `SAMPLE-${index + 1}`, title, description: "", titleZh: "", descriptionZh: "", category: "Sample", priceAmount: price, currency: "hkd", stockQty: 0, isDemo: true }, status: "review", revision: 1, source_sha256: null, output_sha256: null, approved_by: null, product_id: null, error: null, originalUrl: `/editorial/expanded/${slug}.jpg`, processedUrl: `/editorial/expanded/${slug}.jpg` }));
type Detail = { batch: MediaBatch; items: BatchItem[]; count: number; role: BatchRole };
async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code || "BATCH_OPERATION_FAILED");
  return result;
}
function post(path: string, body: unknown) { return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }

export function BatchWorkspace({ preview = false, role, email }: { preview?: boolean; role: BatchRole; email?: string }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [styleId, setStyleId] = useState(DEFAULT_STYLE); const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]); const [manifest, setManifest] = useState<Map<string, DraftProduct>>(new Map());
  const [batches, setBatches] = useState<MediaBatch[]>([]); const [batchPage, setBatchPage] = useState(0); const [batchCount, setBatchCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [detail, setDetail] = useState<Detail | null>(null); const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const pause = useRef(false); const requestId = useRef<string | null>(null);
  const activeStyle = getStylePreset(detail?.batch.style_id || styleId)!;
  const items = preview ? previewItems : detail?.items || [];
  const refresh = useCallback(async () => {
    if (preview) return;
    try {
      const list = await api(`/api/admin/batches?page=${batchPage}`); setBatches(list.batches); setBatchCount(list.count);
      if (selected) setDetail(await api(`/api/admin/batches/${selected}?page=${page}`));
    } catch (error) { setNotice(error instanceof Error ? error.message : "BATCH_OPERATION_FAILED"); }
  }, [preview, selected, page, batchPage]);
  useEffect(() => { if (preview) return; const initial = window.setTimeout(() => void refresh(), 0); const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 10000); return () => { clearTimeout(initial); clearInterval(timer); }; }, [preview, refresh]);
  useEffect(() => () => { pause.current = true; }, []);

  async function chooseManifest(file?: File) {
    if (!file) return; setNotice(""); requestId.current = null;
    try { if (file.size > 2 * 1024 * 1024) throw new Error("INVALID_MANIFEST"); setManifest(parseBatchManifest(await file.text())); }
    catch { setManifest(new Map()); setNotice("INVALID_MANIFEST"); }
  }
  function chooseFiles(list: FileList | null) {
    const values = Array.from(list || []); setNotice(""); requestId.current = null;
    if (values.length > MAX_BATCH_FILES || values.some(file => !IMAGE_MIMES.includes(file.type as typeof IMAGE_MIMES[number]) || file.size > MAX_IMAGE_BYTES || !file.size) || new Set(values.map(file => file.name)).size !== values.length) { setFiles([]); setNotice("INVALID_FILES"); return; }
    setFiles(values);
  }
  async function upload(batchId: string, picked: File[]) {
    const index = await api(`/api/admin/batches/${batchId}?manifest=1`);
    const byName = new Map(picked.map(file => [file.name, file]));
    const pending = (index.items as BatchItem[]).filter(item => item.status === "awaiting_upload" && byName.has(item.filename));
    setProgress({ done: 0, total: pending.length, failed: 0 }); pause.current = false;
    let cursor = 0;
    async function runner() {
      while (!pause.current && cursor < pending.length) {
        const item = pending[cursor++]; const file = byName.get(item.filename)!;
        let failed = false;
        try {
          if (file.size !== item.byte_size || file.type !== item.mime) throw new Error("UPLOAD_MISMATCH");
          // A prior interrupted PUT may already have reached storage; completion is safe to retry.
          try { await post(`/api/admin/batches/items/${item.id}`, { action: "finalize", revision: item.revision }); }
          catch {
            const signed = await post(`/api/admin/batches/items/${item.id}`, { action: "upload", revision: item.revision });
            const form = new FormData(); form.append("cacheControl", "0"); form.append("", file);
            const sent = await fetch(signed.signedUrl, { method: "PUT", headers: { "x-upsert": "false" }, body: form });
            if (!sent.ok) throw new Error("UPLOAD_FAILED");
            await post(`/api/admin/batches/items/${item.id}`, { action: "finalize", revision: item.revision });
          }
        } catch { failed = true; }
        setProgress(value => ({ ...value, done: value.done + 1, failed: value.failed + Number(failed) }));
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, pending.length) }, runner));
  }
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (preview || busy) return; setBusy(true); setNotice("");
    try {
      if ([...manifest.keys()].some(name => !files.some(file => file.name === name))) throw new Error("MANIFEST_MISMATCH");
      requestId.current ||= crypto.randomUUID();
      const body = createBatchSchema.parse({ requestId: requestId.current, title, styleId, items: files.map(file => ({ filename: file.name, mime: file.type, byte_size: file.size, product_data: manifest.get(file.name) })) });
      const result = await post("/api/admin/batches", body); setSelected(result.id); setPage(0);
      await upload(result.id, files); setDetail(await api(`/api/admin/batches/${result.id}?page=0`)); requestId.current = null;
      await refresh();
    } catch (error) { setNotice(error instanceof Error && error.message === "MANIFEST_MISMATCH" ? error.message : "CREATE_OR_UPLOAD_FAILED"); }
    finally { setBusy(false); }
  }
  async function resume() { if (!selected) return; setBusy(true); setNotice(""); try { await upload(selected, files); await refresh(); } catch { setNotice("UPLOAD_FAILED"); } finally { setBusy(false); } }
  async function act(item: BatchItem, action: string, extra: Record<string, unknown> = {}) { if (preview) return; setBusy(true); setNotice(""); try { await post(`/api/admin/batches/items/${item.id}`, { action, revision: item.revision, ...extra }); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : "BATCH_OPERATION_FAILED"); } finally { setBusy(false); } }
  async function approveSelected() {
    if (preview || role !== "super_admin" || busy) return;
    const selectedItems = items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review");
    setBusy(true); setNotice(""); let failed = false;
    for (const item of selectedItems) {
      try { await post(`/api/admin/batches/items/${item.id}`, { action: "approve", revision: item.revision, reason: "" }); }
      catch { failed = true; }
    }
    setChosen([]); await refresh(); setBusy(false); if (failed) setNotice("APPROVAL_PARTIAL");
  }
  const errorCopy: Record<string, [string, string]> = {
    SIGN_OUT_FAILED: ["Sign-out could not be confirmed. You may still be signed in. Please try again.", "未能確認登出，你可能仍在登入狀態，請再試一次。"],
    APPROVAL_PARTIAL: ["Some selected items could not be approved. Their current states are shown below; review them before retrying.", "部分已選商品未能核准，下方已顯示最新狀態，請審閱後再試。"],
    INVALID_FILES: ["Choose up to 1,000 uniquely named JPEG, PNG or WebP files, each at most 24 MB.", "請選擇最多 1,000 個名稱不重複的 JPEG、PNG 或 WebP 檔案，每個不超過 24 MB。"],
    INVALID_MANIFEST: ["Check the CSV headings, unique filenames, SKU, title, price and stock. Maximum 1,000 rows / 2 MB.", "請檢查 CSV 欄名、唯一檔名、貨號、品名、價格與庫存，最多 1,000 列及 2 MB。"],
    MANIFEST_MISMATCH: ["Every CSV filename must match a selected image.", "每個 CSV 檔名須與已選圖片相符。"],
    SIGN_IN_REQUIRED: ["Your session ended. Sign in again, then resume this batch.", "登入已逾時，請重新登入後繼續此批次。"],
    STALE_REVISION: ["This item changed. Refresh and review its latest version.", "此項目已有更改，請重新整理並審閱最新版本。"],
    SUPER_ADMIN_REQUIRED: ["Only a super admin can approve merchandise.", "只有超級管理員可核准商品。"],
  };
  const errorText = errorCopy[notice] || ["The operation could not finish. Refresh the batch and check its status before retrying. Nothing is published without approval.", "操作未能完成，請重新整理並檢查批次狀態後再試。未經核准的商品不會刊登。"];
  return <div className="shell page-space batch-workspace">
    <div className="batch-heading"><div><span className="eyebrow">{t("MERCHANDISE STUDIO", "商品工作室")}</span><h1>{t("Many pieces.\nOne considered collection.", "萬千好物，\n同一份用心。")}</h1><p>{t("Prepare a whole collection, keep the originals and give every product a deliberate final review.", "整批準備商品、保留原圖，讓每件好物經過用心的最後審閱。")}</p></div><div className="batch-account">{preview ? <><span>{t("Workflow preview", "流程預覽")}</span><Link className="button button-secondary" href="/admin/batches/login">{t("Team sign-in", "團隊登入")}</Link></> : <><span>{email}</span><strong>{role === "super_admin" ? t("Super admin", "超級管理員") : t("Catalog editor", "商品編輯")}</strong><button className="text-link" onClick={async () => { try { await api("/api/admin/batches/session", { method: "DELETE" }); router.push("/admin/batches/login"); router.refresh(); } catch { setNotice("SIGN_OUT_FAILED"); } }}>{t("Sign out", "登出")}</button></>}</div></div>
    <ol className="batch-flow">{[["Upload privately", "私人上傳"], ["Prepare images", "處理圖片"], ["Review merchandise", "審閱商品"], ["Super-admin approval", "超級管理員審批"], ["Publish", "刊登"]].map(([en, zh], index) => <li key={en}><span>0{index + 1}</span>{t(en, zh)}</li>)}</ol>
    {preview && <p className="batch-notice">{t("This is a sample workspace. The private upload and approval service requires provisioned team accounts, storage and a processing worker. No files are uploaded or products published here.", "這是示範工作區，私人上傳及審批服務需先設定團隊帳戶、儲存空間及處理程序。此處不會上傳檔案或刊登商品。")}</p>}
    <div className="batch-intake"><form onSubmit={create}><div className="batch-section-heading"><h2>{t("Start a batch", "建立批次")}</h2><span>{t("Up to 1,000 images", "最多 1,000 張圖片")}</span></div><label>{t("Collection name", "批次名稱")}<input value={preview ? t("Everyday essentials", "日常好物") : title} disabled={preview || busy} onChange={event => { setTitle(event.target.value); requestId.current = null; }} placeholder={t("A name for this delivery", "為這批商品命名")} required maxLength={120} /></label><label>{t("Image style", "圖片風格")}<select value={styleId} disabled={busy} onChange={event => { setStyleId(event.target.value); requestId.current = null; }}>{stylePresets.map(style => <option value={style.id} key={style.id}>{style.name}{style.id === DEFAULT_STYLE ? t(" · Current", " · 使用中") : ""}</option>)}</select></label><div className="batch-file-zone"><strong>{t("Original product photos", "商品原始圖片")}</strong><p>{t("JPEG, PNG or WebP · 24 MB per image", "JPEG、PNG 或 WebP · 每張 24 MB 以內")}</p><input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label={t("Choose merchandise images", "選擇商品圖片")} disabled={preview || busy} onChange={event => chooseFiles(event.target.files)} />{!preview && <small>{t(`${files.length} selected`, `已選 ${files.length} 個檔案`)}</small>}</div><label>{t("Product details CSV (optional)", "商品資料 CSV（可選）")}<input type="file" accept=".csv,text/csv" disabled={preview || busy} onChange={event => void chooseManifest(event.target.files?.[0])} /></label><p className="batch-help">{t("One image per new product in this version. Match CSV filenames exactly. Add English and Chinese copy, prices and stock before approval; existing SKUs are never overwritten.", "此版本每張圖片對應一件新商品，CSV 檔名須完全相符。核准前需補齊中英文文案、價格與庫存，現有貨號不會被覆寫。")}</p><a className="text-link" href="/batch-template.csv" download>{t("Download CSV template", "下載 CSV 範本")}</a><div className="batch-actions"><button className="button" disabled={preview || busy || !files.length}>{busy ? t("Working…", "處理中…") : t("Create & upload privately", "建立並私人上傳")}</button>{busy && <button type="button" className="button button-secondary" onClick={() => { pause.current = true; }}>{t("Pause uploads", "暫停上傳")}</button>}</div></form><aside><span className="eyebrow">{t("STYLE RECIPE", "風格配方")}</span><h2>{getStylePreset(styleId)?.name}</h2><p>{locale === "en" ? getStylePreset(styleId)?.description.en : getStylePreset(styleId)?.description.zh}</p><div className="batch-style-swatch" style={{ background: getStylePreset(styleId)?.image.background }}><img src="/editorial/expanded/stoneware-mug.jpg" alt={t("Stoneware mug layout sample", "炻器馬克杯版式示範")} style={{ padding: `${(getStylePreset(styleId)?.image.padding || 0) * 100}%` }} /></div><small>{t("Canvas preview. Existing photo backgrounds are preserved.", "畫布預覽，保留照片原有背景。")}</small><ul><li>{t("Auto-orient and fit without cropping", "自動調整方向，完整縮放不裁切")}</li><li>{t("1,600 px WebP with metadata removed", "1,600 像素 WebP，移除中繼資料")}</li><li>{t("Preserve product colour, labels and shape", "保留商品原色、標籤與形狀")}</li><li>{t("Keep originals in private storage", "原圖保存在私人儲存空間")}</li></ul><Link href="/styles" className="text-link">{t("Explore all six styles", "探索六種風格")} →</Link></aside></div>
    {notice && <p role="alert" className="batch-notice">{t(errorText[0], errorText[1])}</p>}
    {progress.total > 0 && <div className="batch-progress" role="status"><progress value={progress.done} max={progress.total} /><span>{t(`${progress.done} of ${progress.total} upload attempts finished · ${progress.failed} need attention`, `已完成 ${progress.done}／${progress.total} 次上傳嘗試 · ${progress.failed} 個需跟進`)}</span></div>}
    {!preview && <section className="batch-history"><div className="batch-section-heading"><h2>{t("Your batches", "商品批次")}</h2><button className="text-link" onClick={() => void refresh()}>{t("Refresh", "重新整理")}</button></div><div className="batch-history-list">{batches.map(batch => <button key={batch.id} className={selected === batch.id ? "selected" : ""} onClick={() => { setSelected(batch.id); setPage(0); }}><strong>{batch.title}</strong><span>{getStylePreset(batch.style_id)?.name} · {new Date(batch.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "zh-HK")}</span></button>)}{!batches.length && <p>{t("Your first batch will appear here.", "首個批次將顯示於此。")}</p>}</div><div className="batch-actions"><button disabled={!batchPage} onClick={() => setBatchPage(batchPage - 1)}>{t("Previous", "上一頁")}</button><button disabled={(batchPage + 1) * 25 >= batchCount} onClick={() => setBatchPage(batchPage + 1)}>{t("Next", "下一頁")}</button></div></section>}
    <section className="batch-review"><div className="batch-section-heading"><div><span className="eyebrow">{t("ORIGINAL → PREPARED → APPROVED", "原圖 → 處理 → 核准")}</span><h2>{preview ? t("A closer look before listing", "刊登前，細看每件好物") : detail?.batch.title || t("Select a batch to review", "選擇批次以審閱")}</h2></div><span>{preview ? t("Sample review · Muji", "示範審閱 · Muji") : `${detail?.count || 0} ${t("items", "件商品")}`}</span></div>{selected && !preview && <div className="batch-actions"><button className="button button-secondary" disabled={busy || !files.length} onClick={() => void resume()}>{t("Resume matching uploads", "繼續上傳相符圖片")}</button><span className="batch-help">{t("Reselect the original files above to resume after closing this page.", "關閉此頁後，可在上方重新選擇原檔繼續上傳。")}</span></div>}
    {!preview && role === "super_admin" && <div className="batch-actions"><button className="button" disabled={busy || !items.some(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review")} onClick={() => void approveSelected()}>{t(`Approve selected (${items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review").length})`, `核准已選商品（${items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review").length}）`)}</button><span className="batch-help">{t("Select reviewed items on this page. Each approval checks its current revision.", "請選擇此頁已審閱的商品，每項核准均會檢查最新版本。")}</span></div>}
    <div className="batch-review-grid">{items.map((item, index) => <BatchReviewCard key={`${item.id}-${item.revision}`} item={item} selected={chosen.includes(reviewSelectionKey(item))} onSelect={checked => setChosen(value => checked ? [...value.filter(id => id !== reviewSelectionKey(item)), reviewSelectionKey(item)] : value.filter(id => id !== reviewSelectionKey(item)))} preview={preview} title={preview ? t(samples[index][1], samples[index][2]) : locale === "zh-Hant" && item.product_data.titleZh ? item.product_data.titleZh : item.product_data.title} superAdmin={role === "super_admin"} disabled={busy} background={activeStyle.image.background} padding={activeStyle.image.padding} onAction={(action, extra) => act(item, action, extra)} />)}</div>
    {!preview && detail && <div className="batch-actions"><button disabled={!page || busy} onClick={() => setPage(page - 1)}>{t("Previous", "上一頁")}</button><span>{page + 1} / {Math.max(1, Math.ceil(detail.count / 25))}</span><button disabled={(page + 1) * 25 >= detail.count || busy} onClick={() => setPage(page + 1)}>{t("Next", "下一頁")}</button></div>}
    </section><p className="batch-footnote">{t("An approval applies only to the reviewed image and product revision. Any edit clears that approval. Only approved new merchandise can enter the publishing queue.", "核准只適用於已審阅的圖片及商品版本，任何編輯均會清除原有核准。只有獲核准的新商品才可進入刊登佇列。")}</p>
  </div>;
}

function BatchReviewCard({ item, selected, onSelect, preview, title, superAdmin, disabled, background, padding, onAction }: { item: BatchItem; selected: boolean; onSelect: (checked: boolean) => void; preview: boolean; title: string; superAdmin: boolean; disabled: boolean; background: string; padding: number; onAction: (action: string, extra?: Record<string, unknown>) => Promise<void> }) {
  const { t } = useLocale(); const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(item.product_data); const [reason, setReason] = useState(""); const [invalid, setInvalid] = useState(false);
  const canApprove = Boolean(item.originalUrl && item.processedUrl && item.product_data.titleZh?.trim() && item.product_data.descriptionZh?.trim() && item.product_data.description?.trim() && item.product_data.priceAmount);
  const editable = ["awaiting_upload", "queued", "review", "rejected", "approved", "failed"].includes(item.status);
  async function save(event: React.FormEvent) { event.preventDefault(); const valid = draftProductSchema.safeParse(draft); if (!valid.success) { setInvalid(true); return; } setInvalid(false); await onAction("edit", { productData: valid.data }); }
  return <article className="batch-review-card">{superAdmin && !preview && item.status === "review" && <label className="batch-select"><input type="checkbox" checked={selected} disabled={disabled || !canApprove} onChange={event => onSelect(event.target.checked)} />{t("Select reviewed item", "選擇已審閱商品")}</label>}<div className="batch-compare"><figure>{item.originalUrl ? <img src={item.originalUrl} alt={t(`${title} original`, `${title}原圖`)} loading="lazy" /> : <div className="batch-image-empty">{t("Awaiting original", "等待原圖")}</div>}<figcaption>{t("Original", "原圖")}</figcaption></figure><figure style={{ background }}>{item.processedUrl ? <img src={item.processedUrl} alt={t(`${title} prepared`, `${title}處理後`)} loading="lazy" style={preview ? { padding: `${padding * 100}%` } : undefined} /> : <div className="batch-image-empty">{t("Awaiting processing", "等待處理")}</div>}<figcaption>{preview ? t("Canvas preview", "畫布預覽") : t("Prepared", "處理後")}</figcaption></figure></div><div className="batch-card-body"><span className={`batch-state state-${item.status}`}>{t(...statusCopy[item.status])}</span><h3>{title}</h3><p>{item.product_data.isDemo ? t("Demo merchandise · unavailable for purchase", "示範商品 · 不供購買") : t("Real merchandise", "正式商品")}</p><p>{item.product_data.sku} · {t("Revision", "版本")} {item.revision}</p>{item.product_data.priceAmount === null ? <p>{t("Price required before approval", "核准前需填寫價格")}</p> : <strong>HK${(item.product_data.priceAmount / 100).toFixed(2)}</strong>}{item.reviewNote && <p className="batch-help"><strong>{t("Review note: ", "審閱備註：")}</strong>{item.reviewNote}</p>}{item.error && <p className="batch-help">{t("Processing needs attention. Check the source file and retry.", "處理需要跟進，請檢查原檔後重試。")}</p>}
      {!preview && editable && <button className="text-link" onClick={() => setEditing(!editing)} disabled={disabled}>{editing ? t("Close editor", "關閉編輯") : t("Edit product details", "編輯商品資料")}</button>}
      {editing && <form className="batch-edit" onSubmit={save}><label>{t("SKU", "貨號")}<input value={draft.sku} onChange={event => setDraft({ ...draft, sku: event.target.value })} required maxLength={80} /></label><label>{t("English product title", "英文商品名稱")}<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} required maxLength={180} /></label><label>{t("English description", "英文描述")}<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} required maxLength={5000} /></label><label>{t("Chinese product title", "中文商品名稱")}<input value={draft.titleZh} onChange={event => setDraft({ ...draft, titleZh: event.target.value })} required maxLength={180} /></label><label>{t("Chinese description", "中文描述")}<textarea value={draft.descriptionZh} onChange={event => setDraft({ ...draft, descriptionZh: event.target.value })} required maxLength={5000} /></label><label>{t("Category", "分類")}<input value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} required maxLength={80} /></label><label>{t("Price in HKD", "港元價格")}<input type="number" min="0.01" step="0.01" value={draft.priceAmount === null ? "" : draft.priceAmount / 100} onChange={event => setDraft({ ...draft, priceAmount: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} required /></label><label>{t("Stock", "庫存")}<input type="number" min="0" step="1" value={draft.stockQty} onChange={event => setDraft({ ...draft, stockQty: Number(event.target.value) })} required /></label><label className="batch-select"><input type="checkbox" checked={draft.isDemo === true} onChange={event => setDraft({ ...draft, isDemo: event.target.checked })} />{t("Demo merchandise — display only, unavailable for purchase", "示範商品：僅供展示，不供購買")}</label>{invalid && <p role="alert">{t("Check the fields before saving.", "請檢查欄位後再儲存。")}</p>}<button className="button" disabled={disabled}>{t("Save new revision", "儲存新版本")}</button></form>}
      {item.status === "review" && <div className="batch-approval">{superAdmin && !preview && <label>{t("Review note", "審閱備註")}<input value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} /></label>}<button className="button" disabled={preview || !superAdmin || disabled || !canApprove} onClick={() => void onAction("approve", { reason })}>{t("Approve for listing", "核准刊登")}</button>{superAdmin && !preview && <button className="button button-secondary" disabled={disabled || !reason.trim()} onClick={() => void onAction("reject", { reason })}>{t("Return with note", "附備註退回")}</button>}{(!superAdmin || preview) && <small>{t("Super-admin approval required", "需超級管理員審批")}</small>}</div>}
      {(["failed", "rejected"].includes(item.status)) && <button className="button button-secondary" disabled={preview || disabled} onClick={() => void onAction("retry")}>{t("Retry for review", "重試並重新審閱")}</button>}
    </div></article>;
}
