"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { adminError, adminStatus } from "./admin-language";
import type { Product } from "@/types/commerce";

type ApiResult = { ok?: boolean; error?: string; imported?: number; issues?: Array<{ row: number; message: string }>; url?: string };

export function AdminProductsPanel({ products }: { products: Product[] }) {
  const { locale, t, localize } = useLocale();
  const [message, setMessage] = useState<string | number>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function readResult(response: Response) {
    const result = (await response.json()) as ApiResult;
    if (!response.ok) throw new Error(result.issues?.map(issue => `${t("Row", "行")} ${issue.row}: ${adminError(issue.message, locale)}`).join("\n") || adminError(result.error || "Product could not be saved.", locale));
    return result;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      let imageUrl = String(form.get("imageUrl") || "");
      const image = form.get("image");
      if (image instanceof File && image.size) {
        const upload = new FormData(); upload.set("file", image); upload.set("sku", String(form.get("sku") || "product"));
        imageUrl = (await readResult(await fetch("/api/admin/upload", { method: "POST", body: upload }))).url || "";
      }
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.get("sku"), slug: form.get("slug"), title: form.get("title"), description: form.get("description"),
          priceAmount: Math.round(Number(form.get("price")) * 100), currency: form.get("currency"), stockQty: Number(form.get("stockQty")),
          category: form.get("category"), imageUrl, status: form.get("status"), featured: form.get("featured") === "on",
        }),
      });
      await readResult(response);
      setMessage("saved");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) { setError(saveError instanceof Error ? adminError(saveError.message, locale) : t("Product could not be saved.", "無法儲存商品。")); setBusy(false); }
  }

  async function importCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/products/import", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await readResult(response);
      setMessage(result.imported ?? 0);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (importError) { setError(importError instanceof Error ? adminError(importError.message, locale) : t("CSV import failed.", "CSV 匯入失敗。")); setBusy(false); }
  }

  return (
    <>
      <div className="admin-two-column">
        <section className="admin-card"><span className="eyebrow">{t("ONE PRODUCT", "單件商品")}</span><h2>{t("Add or update product", "新增或更新商品")}</h2><p>{t("An existing SKU updates the product. Enter prices in the main currency unit, for example 58.00.", "相同商品編號會更新商品；價格請輸入主要貨幣單位，例如 58.00。")}</p>
          <form className="admin-form" onSubmit={saveProduct}>
            <div className="field-row"><label><span>SKU</span><input name="sku" placeholder="SUN-TEE-200-WHT-XL" required /></label><label><span>{t("Slug", "網址別名")}</span><input name="slug" placeholder="sun-200-cotton-tee" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label></div>
            <label><span>{t("Product name", "商品名稱")}</span><input name="title" required /></label><label><span>{t("Description", "簡介")}</span><textarea name="description" rows={3} /></label>
            <div className="field-row three"><label><span>{t("Price", "價格")}</span><input name="price" type="number" min="0" step="0.01" required /></label><label><span>{t("Currency", "貨幣")}</span><input name="currency" defaultValue="hkd" maxLength={3} required /></label><label><span>{t("Stock", "庫存")}</span><input name="stockQty" type="number" min="0" defaultValue="0" required /></label></div>
            <div className="field-row"><label><span>{t("Category", "分類")}</span><input name="category" defaultValue="General" required /></label><label><span>{t("Status", "狀態")}</span><select name="status" defaultValue="draft"><option value="published">{t("Published", "已上架")}</option><option value="draft">{t("Draft", "草稿")}</option><option value="archived">{t("Archived", "已封存")}</option></select></label></div>
            <label><span>{t("Image URL (or upload below)", "圖片網址（或在下方上傳）")}</span><input name="imageUrl" type="url" placeholder="https://…" /></label><label><span>{t("Upload product image", "上傳商品圖片")}</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label className="check-label"><input name="featured" type="checkbox" /> {t("Feature on homepage", "設為首頁精選")}</label><button className="button" disabled={busy} type="submit">{t("Save product", "儲存商品")}</button>
          </form>
        </section>
        <section className="admin-card"><span className="eyebrow">{t("BULK IMPORT", "批量匯入")}</span><h2>{t("Batch listing with CSV", "CSV 批量上架")}</h2><p>{t("Up to 500 rows, validated before a single atomic import. Products default to draft; database conflicts roll back the entire batch.", "最多 500 行，先驗證，再整批寫入。預設為草稿；資料庫衝突會復原整批匯入。")}</p>
          <form className="csv-drop" onSubmit={importCsv}><input name="file" type="file" accept=".csv,text/csv" aria-label={t("Choose CSV file", "選擇 CSV 檔案")} required /><strong>{t("Choose a CSV file", "選擇 CSV 檔案")}</strong><span>{t("English and Chinese field names supported \u00b7 Maximum 2 MB", "支援中英文字段名稱 · 最大 2 MB")}</span><button className="button button-secondary" disabled={busy} type="submit">{t("Validate and import", "驗證並匯入")}</button></form>
          <a className="download-link" href="/product-import-template.csv" download>{t("Download CSV template \u2193", "下載 CSV 範本 ↓")}</a>
          <div className="csv-fields"><strong>{t("Core fields", "核心欄位")}</strong><code>sku, title, price, stock_qty, image_url, category</code><small>{t("Optional fields:", "選填欄位：")} <code>slug, description, currency, status, featured</code></small></div>
        </section>
      </div>
      {(message || error) && <pre className={error ? "admin-message error" : "admin-message"}>{error || (typeof message === "number" ? t(`Imported ${message} products.`, `已匯入 ${message} 件商品。`) : t("Product saved. Refreshing…", "商品已儲存，頁面即將重新整理…"))}</pre>}
      <section className="admin-table-card"><div className="admin-card-heading"><div><span className="eyebrow">{t("CATALOG", "商品目錄")}</span><h2>{t("Current products", "現有商品")}</h2></div><span>{products.length} SKU</span></div><div className="admin-table-wrap"><table><thead><tr><th>{t("Product", "商品")}</th><th>SKU</th><th>{t("Price", "價格")}</th><th>{t("Stock", "庫存")}</th><th>{t("Status", "狀態")}</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt="" /><span><strong>{localize(product.title)}</strong><small>{localize(product.category)}</small></span></div></td><td><code>{product.sku}</code></td><td>{(product.priceAmount / 100).toFixed(2)} {product.currency.toUpperCase()}</td><td>{product.stockQty}</td><td><span className={`status-chip ${product.status}`}>{adminStatus(product.status, locale)}</span></td></tr>)}</tbody></table></div></section>
    </>
  );
}
