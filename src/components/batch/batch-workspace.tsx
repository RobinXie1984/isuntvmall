"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { stylePresets, getStylePreset, DEFAULT_STYLE } from "@/lib/styles";
import { createBatchSchema, draftProductSchema, IMAGE_MIMES, MAX_BATCH_FILES, MAX_IMAGE_BYTES, type BatchItem, type BatchRole, type BatchStatus, type DraftProduct, type MediaBatch } from "@/lib/batch/contracts";
import { roleLabels } from "@/lib/staff/messages";
import { reviewSelectionKey } from "@/lib/batch/review-selection";
import { parseBatchManifest } from "@/lib/batch/manifest";
import { previewShopifyCsv, matchShopifyFiles, shopifyReviewPackage, type ShopifyPreview } from "@/lib/batch/shopify-import";
import {shopifyStagePayload} from "@/lib/batch/shopify-stage";
import {matchShopifyInventory} from "@/lib/batch/shopify-inventory";

const visualAttestation = { version: "muji-v1", calmBackground: true, cleanComposition: true, faithfulAppearance: true, noPromotionalText: true } as const;
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

export function BatchWorkspace({ preview = false, role, email, targetProduct }: { preview?: boolean; role: BatchRole; email?: string; targetProduct?: DraftProduct }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const canReview = role === "super_admin" || role === "business_super_admin" || role === "admin";
  const [styleId, setStyleId] = useState(DEFAULT_STYLE); const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]); const [manifest, setManifest] = useState<Map<string, DraftProduct>>(new Map());
  const [shopify, setShopify] = useState<ShopifyPreview | null>(null); const [shopifyInvalid, setShopifyInvalid] = useState(false);
  const [inventory,setInventory]=useState<ReturnType<typeof matchShopifyInventory>|null>(null);
  const [stagedNotice,setStagedNotice]=useState(""); const stageRequest=useRef<string|null>(null);
  const [stagedBatches,setStagedBatches]=useState<{id:string;title:string;productCount:number}[]>([]); const [stagedItems,setStagedItems]=useState<{handle:string;title:string;variants:{sku:string;price:string;inventoryQuantity:number|null}[];images:unknown[]}[]>([]); const [stagePage,setStagePage]=useState(0); const [stageId,setStageId]=useState<string|null>(null);
  const [batches, setBatches] = useState<MediaBatch[]>([]); const [batchPage, setBatchPage] = useState(0); const [batchCount, setBatchCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [detail, setDetail] = useState<Detail | null>(null); const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const pause = useRef(false); const requestId = useRef<string | null>(null); const csvRead = useRef(0); const inventoryRead = useRef(0);
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
    if (!file) return; const generation = ++csvRead.current; setNotice(""); requestId.current = null; setShopify(null); setManifest(new Map()); setShopifyInvalid(true);
    try { if (file.size > 2 * 1024 * 1024) throw new Error("INVALID_MANIFEST"); const result = parseBatchManifest(await file.text()); if (generation === csvRead.current) { setManifest(result); setShopifyInvalid(false); } }
    catch { if (generation === csvRead.current) { setManifest(new Map()); setNotice("INVALID_MANIFEST"); } }
  }
  async function chooseShopify(file?: File) {
    if (!file) return; const generation = ++csvRead.current; setNotice(""); setStagedNotice(""); inventoryRead.current++; setInventory(null); stageRequest.current=null; requestId.current = null; setManifest(new Map()); setShopify(null); setShopifyInvalid(true);
    try { if (file.size > 2 * 1024 * 1024) throw new Error("INVALID_SHOPIFY_CSV"); const result = previewShopifyCsv(await file.text()); if (generation === csvRead.current) { setShopify(result); setShopifyInvalid(false); } }
    catch { if (generation === csvRead.current) setNotice("INVALID_SHOPIFY_CSV"); }
  }
  async function chooseInventory(file?:File) {
    if (!file || !shopify) return; const generation=++inventoryRead.current;
    try {if(file.size>8*1024*1024)throw new Error("TOO_LARGE");const result=matchShopifyInventory(shopify,await file.text());if(generation!==inventoryRead.current)return;setInventory(result); stageRequest.current=null;setStagedNotice("");}
    catch {if(generation!==inventoryRead.current)return;setInventory(null);setStagedNotice(t("Inventory file could not be read. Use Shopify’s all-states inventory export.","無法讀取庫存檔案，請使用 Shopify 的全部狀態庫存匯出檔。","在庫ファイルを読み込めません。Shopifyの全状態の在庫エクスポートを使用してください。"));}
  }
  async function stageShopify() {
    if (!shopify || preview || busy) return;
    setBusy(true); setStagedNotice("");
    try {
      stageRequest.current ||= crypto.randomUUID();
      const input=shopifyStagePayload(shopify,stageRequest.current,title.trim() || "Shopify import",inventory?.observations);
      const saved=await post("/api/admin/shopify-stage",input);
      setStageId(saved.id);setStagePage(0);await loadStages();await loadStage(saved.id,0);
      setStagedNotice(t("Saved privately for migration. This does not create products or publish photos.","已私人儲存以供遷移；此操作不會建立商品或刊登圖片。","移行用に非公開で保存しました。商品作成や画像公開は行いません。"));
    } catch { setStagedNotice(t("Could not save the private stage. Check the source fields and try again.","未能私人儲存暫存資料，請檢查來源欄位後再試。","非公開保存に失敗しました。元データを確認して再試行してください。")); }
    finally {setBusy(false);}
  }
  async function loadStages() {
    try { const result=await api("/api/admin/shopify-stage"); setStagedBatches(result.items); }
    catch {setStagedNotice(t("Could not load saved stages.","未能載入已儲存的遷移資料。","保存済みの移行データを読み込めませんでした。"));}
  }
  async function loadStage(id:string,page:number) {
    try { const result=await api(`/api/admin/shopify-stage?batch=${encodeURIComponent(id)}&page=${page}`);setStageId(id);setStagePage(page);setStagedItems(result.items); }
    catch {setStagedNotice(t("Could not load this stage.","未能載入此遷移資料。","この移行データを読み込めませんでした。"));}
  }
  function downloadShopifyReview() {
    if (!shopify) return;
    const url=URL.createObjectURL(new Blob([shopifyReviewPackage(shopify)],{type:"application/json"}));
    const link=document.createElement("a"); link.href=url; link.download="shopify-product-review.json"; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function chooseFiles(list: FileList | null) {
    const values = Array.from(list || []); if (!shopifyInvalid) setNotice(""); requestId.current = null;
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
    event.preventDefault(); if (preview || busy || shopifyInvalid) return; setBusy(true); setNotice("");
    try {
      if (!shopify && [...manifest.keys()].some(name => !files.some(file => file.name === name))) throw new Error("MANIFEST_MISMATCH");
      const details = shopify ? matchShopifyFiles(shopify, files.map(file => file.name)) : manifest;
      requestId.current ||= crypto.randomUUID();
      const body = createBatchSchema.parse({ requestId: requestId.current, title, styleId, items: files.map(file => ({ filename: file.name, mime: file.type, byte_size: file.size, product_data: targetProduct || details.get(file.name) })) });
      const result = await post("/api/admin/batches", body); setSelected(result.id); setPage(0);
      await upload(result.id, files); setDetail(await api(`/api/admin/batches/${result.id}?page=0`)); requestId.current = null;
      await refresh();
    } catch (error) { setNotice(error instanceof Error && ["MANIFEST_MISMATCH", "SHOPIFY_IMAGE_MISMATCH"].includes(error.message) ? error.message : "CREATE_OR_UPLOAD_FAILED"); }
    finally { setBusy(false); }
  }
  async function resume() { if (!selected) return; setBusy(true); setNotice(""); try { await upload(selected, files); await refresh(); } catch { setNotice("UPLOAD_FAILED"); } finally { setBusy(false); } }
  async function act(item: BatchItem, action: string, extra: Record<string, unknown> = {}) { if (preview) return; setBusy(true); setNotice(""); try { await post(`/api/admin/batches/items/${item.id}`, { action, revision: item.revision, ...extra }); await refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : "BATCH_OPERATION_FAILED"); } finally { setBusy(false); } }
  async function approveSelected() {
    if (preview || !canReview || busy) return;
    const selectedItems = items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review");
    setBusy(true); setNotice(""); let failed = false;
    for (const item of selectedItems) {
      try { await post(`/api/admin/batches/items/${item.id}`, { action: "approve", revision: item.revision, reason: "", visualReview: visualAttestation }); }
      catch { failed = true; }
    }
    setChosen([]); await refresh(); setBusy(false); if (failed) setNotice("APPROVAL_PARTIAL");
  }
  const errorCopy: Record<string, [string, string]> = {
    SIGN_OUT_FAILED: ["Sign-out could not be confirmed. You may still be signed in. Please try again.", "未能確認登出，你可能仍在登入狀態，請再試一次。"],
    APPROVAL_PARTIAL: ["Some selected items could not be approved. Their current states are shown below; review them before retrying.", "部分已選商品未能核准，下方已顯示最新狀態，請審閱後再試。"],
    INVALID_FILES: ["Choose up to 1,000 uniquely named JPEG, PNG or WebP files, each at most 24 MB.", "請選擇最多 1,000 個名稱不重複的 JPEG、PNG 或 WebP 檔案，每個不超過 24 MB。"],
    INVALID_MANIFEST: ["Check the CSV headings, unique filenames, SKU, title, price and stock. Maximum 1,000 rows / 2 MB.", "請檢查 CSV 欄名、唯一檔名、貨號、品名、價格與庫存，最多 1,000 列及 2 MB。"],
    INVALID_SHOPIFY_CSV: ["The Shopify CSV could not be read. Use a UTF-8 CSV with a handle and title column (up to 2 MB and 10,000 rows).", "無法讀取 Shopify CSV，請使用包含商品網址代稱及名稱的 UTF-8 CSV（最多 2 MB 及 10,000 列）。"],
    SHOPIFY_IMAGE_MISMATCH: ["Every selected photo must match the primary filename of one eligible single-variant product. Check the preview below; multi-variant products are not imported yet.", "所選圖片須與符合條件的單一規格商品主圖檔名相符。請查看下方預覽；多規格商品暫未支援匯入。"],
    MANIFEST_MISMATCH: ["Every CSV filename must match a selected image.", "每個 CSV 檔名須與已選圖片相符。"],
    SIGN_IN_REQUIRED: ["Your session ended. Sign in again, then resume this batch.", "登入已逾時，請重新登入後繼續此批次。"],
    STALE_REVISION: ["This item changed. Refresh and review its latest version.", "此項目已有更改，請重新整理並審閱最新版本。"],
    APPROVER_REQUIRED: ["An admin or super administrator must approve merchandise.", "商品須由管理員或超級管理員核准。"],
  };
  const shopifyReasons: Record<NonNullable<ShopifyPreview["items"][number]["reason"]>, [string, string, string]> = {
    variants: ["Multiple or missing variants", "多個或缺少規格", "複数または未設定の種類"],
    "no-image": ["No supported primary image URL", "缺少支援的主圖網址", "対応する主画像URLがありません"],
    sku: ["SKU needs an ASCII letter, number, hyphen or underscore", "貨號須使用英文字母、數字、連字號或底線", "SKUは英数字、ハイフン、アンダースコアを使用"],
    price: ["Price needs review", "價格需要確認", "価格の確認が必要"],
    name: ["Product title needs review", "商品名稱需要確認", "商品名の確認が必要"],
    "ambiguous-image": ["Primary image filename matches another product", "主圖檔名與其他商品重複", "主画像のファイル名が他の商品と重複"],
    "duplicate-sku": ["SKU matches another product", "貨號與其他商品重複", "SKUが他の商品と重複"],
    "conflicting-product": ["The same handle has different titles", "相同網址代稱有不同商品名稱", "同じハンドルに異なる商品名があります"],
  };
  const errorText = errorCopy[notice] || ["The operation could not finish. Refresh the batch and check its status before retrying. Nothing is published without approval.", "操作未能完成，請重新整理並檢查批次狀態後再試。未經核准的商品不會刊登。"];
  return <div className="shell page-space batch-workspace">
    <div className="batch-heading"><div><span className="eyebrow">{t("MERCHANDISE STUDIO", "商品工作室")}</span><h1>{t("Many pieces.\nOne considered collection.", "萬千好物，\n同一份用心。")}</h1><p>{t("Prepare a whole collection, keep the originals and give every product a deliberate final review.", "整批準備商品、保留原圖，讓每件好物經過用心的最後審閱。")}</p></div><div className="batch-account">{preview ? <><span>{t("Workflow preview", "流程預覽")}</span><Link className="button button-secondary" href="/admin/batches/login">{t("Team sign-in", "團隊登入")}</Link></> : <><span>{email}</span><strong>{t(...roleLabels[role])}</strong><button className="text-link" onClick={async () => { try { await api("/api/admin/batches/session", { method: "DELETE" }); router.push("/admin/batches/login"); router.refresh(); } catch { setNotice("SIGN_OUT_FAILED"); } }}>{t("Sign out", "登出")}</button></>}</div></div>
    <ol className="batch-flow">{[["Upload privately", "私人上傳"], ["Prepare images", "處理圖片"], ["Review merchandise", "審閱商品"], ["Admin approval", "管理員審批"], ["Publish", "刊登"]].map(([en, zh], index) => <li key={en}><span>0{index + 1}</span>{t(en, zh)}</li>)}</ol>
    {preview && <p className="batch-notice">{t("This is a sample workspace. The private upload and approval service requires provisioned team accounts, storage and a processing worker. No files are uploaded or products published here.", "這是示範工作區，私人上傳及審批服務需先設定團隊帳戶、儲存空間及處理程序。此處不會上傳檔案或刊登商品。")}</p>}
    <div className="batch-intake"><form onSubmit={create}><div className="batch-section-heading"><h2>{t("Start a batch", "建立批次")}</h2><span>{t("Up to 1,000 images", "最多 1,000 張圖片")}</span></div><label>{t("Collection name", "批次名稱")}<input value={preview ? t("Everyday essentials", "日常好物") : title} disabled={preview || busy} onChange={event => { setTitle(event.target.value); requestId.current = null; stageRequest.current = null; }} placeholder={t("A name for this delivery", "為這批商品命名")} required maxLength={120} /></label><label>{t("Image style", "圖片風格")}<select value={styleId} disabled={busy} onChange={event => { setStyleId(event.target.value); requestId.current = null; }}>{stylePresets.map(style => <option value={style.id} key={style.id}>{style.name}{style.id === DEFAULT_STYLE ? t(" · Current", " · 使用中") : ""}</option>)}</select></label><div className="batch-file-zone"><strong>{t("Original product photos", "商品原始圖片")}</strong><p>{t("JPEG, PNG or WebP · 24 MB per image", "JPEG、PNG 或 WebP · 每張 24 MB 以內")}</p><input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label={t("Choose merchandise images", "選擇商品圖片")} disabled={preview || busy} onChange={event => chooseFiles(event.target.files)} />{!preview && <small>{t(`${files.length} selected`, `已選 ${files.length} 個檔案`, `${files.length}件を選択`)}</small>}</div>{!targetProduct && <><label>{t("Shopify product CSV (optional)", "Shopify 商品 CSV（可選）", "Shopify 商品 CSV（任意）")}<input type="file" accept=".csv,text/csv" disabled={preview || busy} onChange={event => void chooseShopify(event.target.files?.[0])} /></label><p className="batch-help">{t("Preview the CSV on this device, then select the matching original image files. Selecting another CSV replaces this selection. Only eligible single-variant products can be prepared here. No images are downloaded from URLs. A filename match does not verify the photo; compare it with the product before approval.", "先在此裝置預覽 CSV，再選擇相符的原始圖片。選擇另一個 CSV 會取代目前的選擇。此處只可準備符合條件的單一規格商品，不會從網址下載圖片。檔名相符不代表圖片正確，核准前須與商品核對。", "この端末で CSV を確認し、対応する元画像を選びます。別の CSV を選ぶと現在の選択が置き換わります。対応する単一バリエーション商品のみ準備でき、URL から画像は取得しません。ファイル名が一致しても写真が正しいとは限らないため、承認前に商品と比較してください。")}</p>{shopify && <div className="batch-notice" role="status"><strong>{t(`${shopify.items.length} products · ${shopify.rows} CSV rows`, `${shopify.items.length} 件商品 · ${shopify.rows} 列 CSV`, `${shopify.items.length}商品 · CSV ${shopify.rows}行`)}</strong><p>{t(`${shopify.items.filter(x=>x.draft).length} eligible for one-image preparation · ${shopify.items.filter(x=>!x.draft).length} need a different workflow`, `${shopify.items.filter(x=>x.draft).length} 件可準備單張主圖 · ${shopify.items.filter(x=>!x.draft).length} 件需使用其他流程`, `主画像を準備可能 ${shopify.items.filter(x=>x.draft).length}件 · 別の方法が必要 ${shopify.items.filter(x=>!x.draft).length}件`)}</p><p>{t("Multiple variants are not imported. Extra images, descriptions, category, inventory, tax and shipping fields are not transferred. Prices are demos until reviewed; add English and Chinese copy before approval. Existing products cannot be overwritten.", "不會匯入多個規格；其他圖片、描述、分類、庫存、稅務及運送欄位不會轉入。價格在審核前均為示範價；核准前請補齊中英文文案。現有商品不會被覆寫。", "複数バリエーション、追加画像、説明、分類、在庫、税金、配送情報は移行されません。価格は確認までデモ価格です。承認前に英語と中国語の説明を入力してください。既存商品は上書きされません。")}</p><p>{t("For review, the original CSV fields and all variant and image rows can be saved as a local JSON file. It may contain supplier costs and other private data. This does not import merchandise.", "可將原始 CSV 欄位及全部規格、圖片資料存為本機 JSON 檔案以供審閱，檔案可能包含供應商成本及其他私人資料；此步驟不會匯入商品。", "元の CSV 項目とすべての種類・画像の情報を確認用 JSON として端末に保存できます。仕入原価などの非公開情報が含まれる場合があります。商品はインポートされません。")}</p><button type="button" className="button button-secondary" onClick={downloadShopifyReview}>{t("Save review file", "儲存審閱檔案", "確認用ファイルを保存")}</button><details><summary>{t("See products and reasons", "查看商品及原因", "商品と理由を見る")}</summary><ul>{shopify.items.map(x=><li key={x.handle}><details><summary>{x.title || x.handle} · {x.variantCount} {t("variants", "個規格", "種類")} · {x.imageCount} {t("images", "張圖片", "画像")} · {x.draft ? x.imageName : x.reason ? t(...shopifyReasons[x.reason]) : ""}</summary><ul>{x.sourceVariants.map((v,i)=><li key={i}>{v.sku || t("SKU missing", "缺少貨號", "SKUなし")} · {v.options.map(o=>[o.name,o.value].filter(Boolean).join(": ")).join(" / ") || t("Default option", "預設款式", "標準仕様")} · {v.price ? t(`Source price: ${v.price}`, `來源價格：${v.price}`, `元データ価格：${v.price}`) : t("Price missing", "缺少價格", "価格なし")} · {v.inventoryQuantity !== null ? t(`Source stock: ${v.inventoryQuantity}`, `來源庫存：${v.inventoryQuantity}`, `元データの在庫：${v.inventoryQuantity}`) : v.inventoryProvided ? t("Invalid source stock", "來源庫存無效", "元データの在庫が無効") : t("Source stock not supplied", "來源未提供庫存", "元データの在庫なし")}</li>)}</ul></details></li>)}</ul></details></div>}</>}<label>{t("iSunTVMall CSV (alternative)", "iSunTVMall CSV（替代選項）")}<input type="file" accept=".csv,text/csv" disabled={preview || busy} onChange={event => void chooseManifest(event.target.files?.[0])} /></label><p className="batch-help">{t("One image per new product in this version. Match CSV filenames exactly. Add English and Chinese copy, prices and stock before approval; existing SKUs are never overwritten.", "此版本每張圖片對應一件新商品，CSV 檔名須完全相符。核准前需補齊中英文文案、價格與庫存，現有貨號不會被覆寫。")}</p><a className="text-link" href="/batch-template.csv" download>{t("Download CSV template", "下載 CSV 範本")}</a><div className="batch-actions"><button className="button" disabled={preview || busy || shopifyInvalid || !files.length}>{busy ? t("Working…", "處理中…") : t("Create & upload privately", "建立並私人上傳")}</button>{busy && <button type="button" className="button button-secondary" onClick={() => { pause.current = true; }}>{t("Pause uploads", "暫停上傳")}</button>}</div></form><aside><span className="eyebrow">{t("STYLE RECIPE", "風格配方")}</span><h2>{getStylePreset(styleId)?.name}</h2><p>{t(getStylePreset(styleId)!.description.en, getStylePreset(styleId)!.description.zh)}</p><div className="batch-style-swatch" style={{ background: getStylePreset(styleId)?.image.background }}><img src="/editorial/expanded/stoneware-mug.jpg" alt={t("Stoneware mug layout sample", "炻器馬克杯版式示範")} style={{ padding: `${(getStylePreset(styleId)?.image.padding || 0) * 100}%` }} /></div><small>{t("Canvas preview. Existing photo backgrounds are preserved.", "畫布預覽，保留照片原有背景。")}</small><ul><li>{t("Auto-orient and fit without cropping", "自動調整方向，完整縮放不裁切")}</li><li>{t("1,600 px WebP with metadata removed", "1,600 像素 WebP，移除中繼資料")}</li><li>{t("Preserve product colour, labels and shape", "保留商品原色、標籤與形狀")}</li><li>{t("Keep originals in private storage", "原圖保存在私人儲存空間")}</li></ul><Link href="/admin/help" className="text-link">{t("Help & manuals", "說明與手冊")}</Link><Link href="/styles" className="text-link">{t("Explore all six styles", "探索六種風格")} →</Link></aside></div>
    {shopify && !preview && role !== "kol" && <section className="batch-notice"><p>{t("Save the variant and image references privately for the migration. Source costs and other original columns stay in your local review file. Nothing is imported or published yet.","將規格和圖片參照私人儲存以供遷移。來源成本及其他原始欄位保留在本機審閱檔案中，暫不會匯入或刊登。","種類と画像参照を移行用に非公開保存します。原価などの元データはローカルの確認ファイルに残り、まだ取込・公開されません。")}</p><label>{t("Shopify all-states inventory CSV (optional)","Shopify 全部狀態庫存 CSV（可選）","Shopify 全状態在庫 CSV（任意）")}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={event=>void chooseInventory(event.target.files?.[0])}/></label>{inventory && <p>{t(`Inventory rows: ${inventory.rows}. Unmatched: ${inventory.unmatched}; ambiguous: ${inventory.ambiguous}; invalid: ${inventory.invalid}. These are snapshots, not live stock.`,`庫存列數：${inventory.rows}。未匹配：${inventory.unmatched}；有歧義：${inventory.ambiguous}；無效：${inventory.invalid}。這些只是快照，不是即時庫存。`,`在庫行：${inventory.rows}。未一致：${inventory.unmatched}、曖昧：${inventory.ambiguous}、無効：${inventory.invalid}。これはスナップショットであり、現在庫ではありません。`)}</p>}<button type="button" className="button button-secondary" disabled={busy} onClick={()=>void stageShopify()}>{t("Save migration stage privately","私人儲存遷移資料","移行データを非公開保存")}</button>{stagedNotice && <p role="status">{stagedNotice}</p>}</section>}
    {!preview && role !== "kol" && <section className="batch-history"><div className="batch-section-heading"><h2>{t("Private Shopify stages","私人的 Shopify 遷移資料","非公開の Shopify 移行データ")}</h2><button type="button" className="text-link" onClick={()=>void loadStages()}>{t("Show saved stages","顯示已儲存資料","保存済みデータを表示")}</button></div>{stagedBatches.map(batch=><button key={batch.id} type="button" className="text-link" onClick={()=>void loadStage(batch.id,0)}>{batch.title} · {batch.productCount}</button>)}{stagedItems.length>0 && <><ul>{stagedItems.map(item=><li key={item.handle}><strong>{item.title}</strong> · {item.variants.length} {t("variants","規格","種類")} · {item.images.length} {t("image references","圖片參照","画像参照")}<ul>{item.variants.map((v,i)=><li key={i}>{v.sku || t("No SKU","未有貨號","SKUなし")} · {v.price || "—"} · {v.inventoryQuantity===null ? t("stock unknown","庫存未知","在庫不明") : v.inventoryQuantity}</li>)}</ul></li>)}</ul><button type="button" disabled={stagePage===0} onClick={()=>stageId && void loadStage(stageId,stagePage-1)}>{t("Previous","上一頁","前へ")}</button><button type="button" disabled={stagedItems.length<25} onClick={()=>stageId && void loadStage(stageId,stagePage+1)}>{t("Next","下一頁","次へ")}</button></>}</section>}
    {(notice || shopifyInvalid) && <p role="alert" className="batch-notice">{shopifyInvalid && !notice ? t(errorCopy.INVALID_SHOPIFY_CSV[0], errorCopy.INVALID_SHOPIFY_CSV[1]) : t(errorText[0], errorText[1])}</p>}
    {progress.total > 0 && <div className="batch-progress" role="status"><progress value={progress.done} max={progress.total} /><span>{t(`${progress.done} of ${progress.total} upload attempts finished · ${progress.failed} need attention`, `已完成 ${progress.done}／${progress.total} 次上傳嘗試 · ${progress.failed} 個需跟進`, `アップロード試行：${progress.total}件中${progress.done}件が完了・${progress.failed}件は確認が必要`)}</span></div>}
    {!preview && <section className="batch-history"><div className="batch-section-heading"><h2>{t("Your batches", "商品批次")}</h2><button className="text-link" onClick={() => void refresh()}>{t("Refresh", "重新整理")}</button></div><div className="batch-history-list">{batches.map(batch => <button key={batch.id} className={selected === batch.id ? "selected" : ""} onClick={() => { setSelected(batch.id); setPage(0); }}><strong>{batch.title}</strong><span>{getStylePreset(batch.style_id)?.name} · {new Date(batch.created_at).toLocaleDateString(locale === "ja" ? "ja-JP" : locale === "zh-Hans" ? "zh-CN" : locale === "en" ? "en-GB" : "zh-HK")}</span></button>)}{!batches.length && <p>{t("Your first batch will appear here.", "首個批次將顯示於此。")}</p>}</div><div className="batch-actions"><button disabled={!batchPage} onClick={() => setBatchPage(batchPage - 1)}>{t("Previous", "上一頁")}</button><button disabled={(batchPage + 1) * 25 >= batchCount} onClick={() => setBatchPage(batchPage + 1)}>{t("Next", "下一頁")}</button></div></section>}
    <section className="batch-review"><div className="batch-section-heading"><div><span className="eyebrow">{t("ORIGINAL → PREPARED → APPROVED", "原圖 → 處理 → 核准")}</span><h2>{preview ? t("A closer look before listing", "刊登前，細看每件好物") : detail?.batch.title || t("Select a batch to review", "選擇批次以審閱")}</h2></div><span>{preview ? t("Sample review · Muji", "示範審閱 · Muji") : `${detail?.count || 0} ${t("items", "件商品")}`}</span></div>{selected && !preview && <div className="batch-actions"><button className="button button-secondary" disabled={busy || !files.length} onClick={() => void resume()}>{t("Resume matching uploads", "繼續上傳相符圖片")}</button><span className="batch-help">{t("Reselect the original files above to resume after closing this page.", "關閉此頁後，可在上方重新選擇原檔繼續上傳。")}</span></div>}
    {!preview && canReview && <div className="batch-actions"><button className="button" disabled={busy || !items.some(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review")} onClick={() => void approveSelected()}>{t(`Approve selected (${items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review").length})`, `核准已選商品（${items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review").length}）`, `選択した商品を承認（${items.filter(item => chosen.includes(reviewSelectionKey(item)) && item.status === "review").length}件）`)}</button><span className="batch-help">{t("Select reviewed items on this page. Each approval checks its current revision.", "請選擇此頁已審閱的商品，每項核准均會檢查最新版本。")}</span></div>}
    {targetProduct && <p role="status">{t("Add reviewed images to existing product:", "為現有商品新增經審核的圖片：")} {targetProduct.sku} · {targetProduct.title}</p>}<div className="batch-review-grid">{items.map((item, index) => <BatchReviewCard key={`${item.id}-${item.revision}`} item={item} selected={chosen.includes(reviewSelectionKey(item))} onSelect={checked => setChosen(value => checked ? [...value.filter(id => id !== reviewSelectionKey(item)), reviewSelectionKey(item)] : value.filter(id => id !== reviewSelectionKey(item)))} preview={preview} title={preview ? t(samples[index][1], samples[index][2]) : locale === "zh-Hant" && item.product_data.titleZh ? item.product_data.titleZh : item.product_data.title} reviewer={canReview} disabled={busy} background={activeStyle.image.background} padding={activeStyle.image.padding} onAction={(action, extra) => act(item, action, extra)} />)}</div>
    {!preview && detail && <div className="batch-actions"><button disabled={!page || busy} onClick={() => setPage(page - 1)}>{t("Previous", "上一頁")}</button><span>{page + 1} / {Math.max(1, Math.ceil(detail.count / 25))}</span><button disabled={(page + 1) * 25 >= detail.count || busy} onClick={() => setPage(page + 1)}>{t("Next", "下一頁")}</button></div>}
    </section><p className="batch-footnote">{t("An approval applies only to the reviewed image and product revision. Any edit clears that approval. Only approved new merchandise can enter the publishing queue.", "核准只適用於已審阅的圖片及商品版本，任何編輯均會清除原有核准。只有獲核准的新商品才可進入刊登佇列。")}</p>
  </div>;
}

function BatchReviewCard({ item, selected, onSelect, preview, title, reviewer, disabled, background, padding, onAction }: { item: BatchItem; selected: boolean; onSelect: (checked: boolean) => void; preview: boolean; title: string; reviewer: boolean; disabled: boolean; background: string; padding: number; onAction: (action: string, extra?: Record<string, unknown>) => Promise<void> }) {
  const { t } = useLocale(); const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(item.product_data); const [reason, setReason] = useState(""); const [invalid, setInvalid] = useState(false);
  const [visualChecks, setVisualChecks] = useState<string[]>([]);
  const visualReady = visualChecks.length === 4;
  const canApprove = visualReady && Boolean(item.originalUrl && item.processedUrl && item.product_data.titleZh?.trim() && item.product_data.descriptionZh?.trim() && item.product_data.description?.trim() && item.product_data.priceAmount);
  const editable = ["awaiting_upload", "queued", "review", "rejected", "approved", "failed"].includes(item.status);
  async function save(event: React.FormEvent) { event.preventDefault(); const valid = draftProductSchema.safeParse(draft); if (!valid.success) { setInvalid(true); return; } setInvalid(false); await onAction("edit", { productData: valid.data }); }
  return <article className="batch-review-card">{reviewer && !preview && item.status === "review" && <label className="batch-select"><input type="checkbox" checked={selected} disabled={disabled || !canApprove} onChange={event => onSelect(event.target.checked)} />{t("Select visually approved item", "選擇已完成圖片審閱的商品", "画像確認済みの商品を選択")}</label>}<div className="batch-compare"><figure>{item.originalUrl ? <img src={item.originalUrl} alt={t(`${title} original`, `${title}原圖`, `${title}の元画像`)} loading="lazy" /> : <div className="batch-image-empty">{t("Awaiting original", "等待原圖")}</div>}<figcaption>{t("Original", "原圖")}</figcaption></figure><figure style={{ background }}>{item.processedUrl ? <img src={item.processedUrl} alt={t(`${title} prepared`, `${title}處理後`, `${title}の処理後の画像`)} loading="lazy" style={preview ? { padding: `${padding * 100}%` } : undefined} /> : <div className="batch-image-empty">{t("Awaiting processing", "等待處理")}</div>}<figcaption>{preview ? t("Canvas preview", "畫布預覽") : t("Prepared", "處理後")}</figcaption></figure></div><div className="batch-card-body"><span className={`batch-state state-${item.status}`}>{t(...statusCopy[item.status])}</span><h3>{title}</h3><p>{item.product_data.isDemo ? t("Demo merchandise · unavailable for purchase", "示範商品 · 不供購買") : t("Real merchandise", "正式商品")}</p><p>{item.product_data.sku} · {t("Revision", "版本")} {item.revision}</p>{item.product_data.priceAmount === null ? <p>{t("Price required before approval", "核准前需填寫價格")}</p> : <strong>HK${(item.product_data.priceAmount / 100).toFixed(2)}</strong>}{item.reviewNote && <p className="batch-help"><strong>{t("Review note: ", "審閱備註：")}</strong>{item.reviewNote}</p>}{item.error && <p className="batch-help">{t("Processing needs attention. Check the source file and retry.", "處理需要跟進，請檢查原檔後重試。")}</p>}
      {!preview && editable && <button className="text-link" onClick={() => setEditing(!editing)} disabled={disabled}>{editing ? t("Close editor", "關閉編輯") : t("Edit product details", "編輯商品資料")}</button>}
      {editing && <form className="batch-edit" onSubmit={save}>{draft.targetProductId&&<p>{t("Existing-product image: product details and stock are unchanged.","現有商品圖片：商品資料及庫存不會變更。")}</p>}<label>{t("SKU", "貨號")}<input value={draft.sku} onChange={event => setDraft({ ...draft, sku: event.target.value })} required maxLength={80} /></label><label>{t("English product title", "英文商品名稱")}<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} required maxLength={180} /></label><label>{t("English description", "英文描述")}<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} required maxLength={5000} /></label><label>{t("Chinese product title", "中文商品名稱")}<input value={draft.titleZh} onChange={event => setDraft({ ...draft, titleZh: event.target.value })} required maxLength={180} /></label><label>{t("Chinese description", "中文描述")}<textarea value={draft.descriptionZh} onChange={event => setDraft({ ...draft, descriptionZh: event.target.value })} required maxLength={5000} /></label><label>{t("Category", "分類")}<input value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} required maxLength={80} /></label><label>{t("Price in HKD", "港元價格")}<input type="number" min="0.01" step="0.01" value={draft.priceAmount === null ? "" : draft.priceAmount / 100} onChange={event => setDraft({ ...draft, priceAmount: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} required /></label><label>{t("Stock", "庫存")}<input type="number" min="0" step="1" value={draft.stockQty} onChange={event => setDraft({ ...draft, stockQty: Number(event.target.value) })} required /></label><label className="batch-select"><input type="checkbox" checked={draft.isDemo === true} onChange={event => setDraft({ ...draft, isDemo: event.target.checked })} />{t("Demo merchandise — display only, unavailable for purchase", "示範商品：僅供展示，不供購買")}</label>{invalid && <p role="alert">{t("Check the fields before saving.", "請檢查欄位後再儲存。")}</p>}<button className="button" disabled={disabled}>{t("Save new revision", "儲存新版本")}</button></form>}
      {item.status === "review" && <fieldset className="batch-visual-checks"><legend>{t("Image standard · all four checks required", "圖片標準 · 四項均須確認", "画像基準 · 4項目すべて確認")}</legend>{[
        ["background", "Calm, uncluttered background", "背景平靜、無雜物", "落ち着いた背景で、余計な物がない"],
        ["composition", "Whole product, clear composition and consistent scale", "商品完整、構圖清晰、比例一致", "商品全体が見え、構図と大きさが適切"],
        ["fidelity", "Original product colours, shape and details preserved", "保留商品原色、形狀及細節", "元の色・形・細部が保たれている"],
        ["text", "No promotional banners or clutter; packaging labels retained", "無促銷橫幅或雜亂文字，保留包裝標籤", "宣伝文やバナーがなく、包装ラベルは保持"],
      ].map(([key, en, zh, ja]) => <label className="batch-select" key={key}><input type="checkbox" checked={visualChecks.includes(key)} disabled={preview || !reviewer || disabled} onChange={event => { setVisualChecks(current => event.target.checked ? [...current.filter(value => value !== key), key] : current.filter(value => value !== key)); if (!event.target.checked) onSelect(false); }} />{t(en, zh, ja)}</label>)}<p className="batch-help">{t("Compare both images. Return unsuitable photos with a note; padding alone does not remove clutter. Originals remain private.", "請比較原圖與處理後圖片。不合格圖片請附備註退回，添加留白不能消除雜物。原圖仍保存在私人空間。", "元画像と処理後の画像を比較してください。不適切な写真は理由を添えて差し戻します。余白だけでは背景の乱れは解消しません。元画像は非公開で保持します。")}</p></fieldset>}
      {item.status === "review" && <div className="batch-approval">{reviewer && !preview && <label>{t("Review note", "審閱備註")}<input value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} /></label>}<button className="button" disabled={preview || !reviewer || disabled || !canApprove} onClick={() => void onAction("approve", { reason, visualReview: visualAttestation })}>{t("Approve for listing", "核准刊登")}</button>{reviewer && !preview && <button className="button button-secondary" disabled={disabled || !reason.trim()} onClick={() => void onAction("reject", { reason })}>{t("Return with note", "附備註退回")}</button>}{(!reviewer || preview) && <small>{t("Admin approval required", "需管理員審批")}</small>}</div>}
      {(["failed", "rejected"].includes(item.status)) && <button className="button button-secondary" disabled={preview || disabled} onClick={() => void onAction("retry")}>{t("Retry for review", "重試並重新審閱")}</button>}
    </div></article>;
}
