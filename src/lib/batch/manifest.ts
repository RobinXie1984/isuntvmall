import Papa from "papaparse";
import { draftProductSchema, type DraftProduct } from "./contracts";

/** Explicit one-image/new-product mapping. Never infer variants from filenames. */
export function parseBatchManifest(text: string): Map<string, DraftProduct> {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  if (parsed.errors.length || !parsed.meta.fields?.includes("filename") || parsed.data.length > 1000) throw new Error("INVALID_MANIFEST");
  const entries = new Map<string, DraftProduct>();
  for (const row of parsed.data) {
    const name = row.filename?.trim();
    if (!name || entries.has(name) || /[\\/\u0000-\u001f]/.test(name)) throw new Error("INVALID_MANIFEST");
    const amount = (row.price_hkd ?? "").trim(); const stock = (row.stock ?? "0").trim();
    if ((amount && !/^\d{1,7}(\.\d{1,2})?$/.test(amount)) || !/^\d{1,7}$/.test(stock)) throw new Error("INVALID_MANIFEST");
    const [whole, fraction = ""] = amount.split(".");
    const product = draftProductSchema.parse({ sku: row.sku, title: row.title, description: row.description || "", titleZh: row.title_zh || "", descriptionZh: row.description_zh || "", category: row.category || "General", priceAmount: amount ? Number(whole) * 100 + Number(fraction.padEnd(2, "0")) : null, currency: "hkd", stockQty: Number(stock) });
    entries.set(name, product);
  }
  return entries;
}
