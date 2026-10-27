import catalogue from "./suntvmall-catalogue.json";
import type { SourceListing } from "@/types/commerce";
export type SourceEntry = typeof catalogue.products[number];
export const sourcePriceEntries = catalogue.products;
export const sourcePriceEntry = (id: string) => sourcePriceEntries.find(p => p.id === id);
export function sourcePriceKey(entry: SourceEntry, variantId: string): string {
 const variant = entry.variants.find(v => v.id === variantId);
 if (!variant) throw new Error("UNKNOWN_VARIANT");
 return JSON.stringify([entry.sourceId, entry.sourceUpdatedAt, variant.id, variant.priceAmount, "priceIsPlaceholder" in variant && variant.priceIsPlaceholder === true, variant.options]);
}
export function reviewedVariants(entry: SourceEntry, overrides: unknown): SourceListing["variants"] {
 const values = overrides && typeof overrides === "object" && !Array.isArray(overrides) ? overrides as Record<string, unknown> : {};
 return entry.variants.map(v => {
  const raw = values[v.id];
  if (!raw || typeof raw !== "object") return v;
  const o = raw as Record<string, unknown>;
  const valid = Number.isSafeInteger(o.priceAmount) && Number(o.priceAmount)>0 && Number(o.priceAmount)<=999999999 && o.priceAmount!==1999 && typeof o.priceIsPlaceholder === "boolean";
  // An old approval must never become evidence for a changed source option.
  if (!valid || o.sourceKey!==sourcePriceKey(entry,v.id)) return { ...v, priceAmount:99999, priceIsPlaceholder:true };
  if (o.priceIsPlaceholder && o.priceAmount!==99999) return { ...v, priceAmount:99999, priceIsPlaceholder:true };
  return { ...v, priceAmount:Number(o.priceAmount), priceIsPlaceholder:o.priceIsPlaceholder===true, priceIsReviewed:!o.priceIsPlaceholder };
 });
}
