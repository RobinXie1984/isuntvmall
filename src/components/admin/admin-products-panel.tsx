"use client";

import { useState } from "react";
import type { Product } from "@/types/commerce";

type ApiResult = { ok?: boolean; error?: string; imported?: number; issues?: Array<{ row: number; message: string }>; url?: string };

async function readResult(response: Response) {
  const result = (await response.json()) as ApiResult;
  if (!response.ok) throw new Error(result.issues?.map((issue) => `第 ${issue.row} 行：${issue.message}`).join("\n") || result.error || "操作失败。");
  return result;
}

export function AdminProductsPanel({ products }: { products: Product[] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMessage("商品已保存。页面即将刷新。");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "商品保存失败。"); setBusy(false); }
  }

  async function importCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/products/import", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await readResult(response);
      setMessage(`已导入 ${result.imported} 件商品。`);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (importError) { setError(importError instanceof Error ? importError.message : "CSV 导入失败。"); setBusy(false); }
  }

  return (
    <>
      <div className="admin-two-column">
        <section className="admin-card"><span className="eyebrow">ONE PRODUCT</span><h2>新增或更新商品</h2><p>SKU 相同会更新原商品；价格输入主货币单位，例如 58.00。</p>
          <form className="admin-form" onSubmit={saveProduct}>
            <div className="field-row"><label><span>SKU</span><input name="sku" placeholder="SUN-TEE-200-WHT-XL" required /></label><label><span>网址别名</span><input name="slug" placeholder="sun-200-cotton-tee" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label></div>
            <label><span>商品名</span><input name="title" required /></label><label><span>简介</span><textarea name="description" rows={3} /></label>
            <div className="field-row three"><label><span>价格</span><input name="price" type="number" min="0" step="0.01" required /></label><label><span>币种</span><input name="currency" defaultValue="hkd" maxLength={3} required /></label><label><span>库存</span><input name="stockQty" type="number" min="0" defaultValue="0" required /></label></div>
            <div className="field-row"><label><span>分类</span><input name="category" defaultValue="General" required /></label><label><span>状态</span><select name="status" defaultValue="draft"><option value="published">已上架</option><option value="draft">草稿</option><option value="archived">已归档</option></select></label></div>
            <label><span>图片网址（或在下方上传）</span><input name="imageUrl" type="url" placeholder="https://…" /></label><label><span>上传商品图</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label className="check-label"><input name="featured" type="checkbox" /> 设为首页严选</label><button className="button" disabled={busy} type="submit">保存商品</button>
          </form>
        </section>
        <section className="admin-card"><span className="eyebrow">BULK INGEST</span><h2>CSV 批量上货</h2><p>最多 500 行，先校验，再整批事务写入。缺省为草稿；数据库冲突整批回滚。Up to 500 rows; atomic import, draft by default.</p>
          <form className="csv-drop" onSubmit={importCsv}><input name="file" type="file" accept=".csv,text/csv" required /><strong>拖入或选择 CSV</strong><span>支持中英文字段名 · 最大 2 MB</span><button className="button button-secondary" disabled={busy} type="submit">检查并导入</button></form>
          <a className="download-link" href="/product-import-template.csv" download>下载 CSV 模板 ↓</a>
          <div className="csv-fields"><strong>核心字段</strong><code>sku, title, price, stock_qty, image_url, category</code><small>可选：slug, description, currency, status, featured</small></div>
        </section>
      </div>
      {(message || error) && <pre className={error ? "admin-message error" : "admin-message"}>{error || message}</pre>}
      <section className="admin-table-card"><div className="admin-card-heading"><div><span className="eyebrow">CATALOG</span><h2>当前商品</h2></div><span>{products.length} SKU</span></div><div className="admin-table-wrap"><table><thead><tr><th>商品</th><th>SKU</th><th>价格</th><th>库存</th><th>状态</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.images[0]?.sourceUrl || "/demo/product-placeholder.svg"} alt="" /><span><strong>{product.title}</strong><small>{product.category}</small></span></div></td><td><code>{product.sku}</code></td><td>{(product.priceAmount / 100).toFixed(2)} {product.currency.toUpperCase()}</td><td>{product.stockQty}</td><td><span className={`status-chip ${product.status}`}>{product.status}</span></td></tr>)}</tbody></table></div></section>
    </>
  );
}
