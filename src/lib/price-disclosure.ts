import type { Product, SourceListing } from "@/types/commerce";

export type PriceDisclosure = "demo" | "source" | "unverified";
type Variant = SourceListing["variants"][number];
const validAmount = (amount: number) => Number.isSafeInteger(amount) && amount > 0;

export function sourcePriceDisclosure(variant: Variant): PriceDisclosure {
  if (variant.priceIsPlaceholder) return "demo";
  // A missing safeguard flag must never turn the known generic amount into a verified offer.
  return validAmount(variant.priceAmount) && variant.priceAmount !== 1999 ? "source" : "unverified";
}

export function productPriceDisclosure(product: Product): PriceDisclosure | null {
  if (product.isDemo) return "demo";
  if (!validAmount(product.priceAmount)) return "unverified";
  const listing = product.sourceListing;
  if (!listing) return product.sku.startsWith("SUNTV-") ? "unverified" : null;
  // Preserve colleague edits, but do not attribute a conflicting card price to the source.
  if (product.currency.toLowerCase() !== "hkd" || !listing.variants.length ||
      product.priceAmount !== Math.min(...listing.variants.map(v => v.priceAmount))) return "unverified";
  const cheapest = listing.variants.filter(v => v.priceAmount === product.priceAmount);
  if (cheapest.some(v => sourcePriceDisclosure(v) === "unverified")) return "unverified";
  return cheapest.some(v => sourcePriceDisclosure(v) === "demo") ? "demo" : "source";
}

export const priceDisclosureCopy: Record<PriceDisclosure, readonly [string, string, string]> = {
  demo: ["Demo price · not a selling price", "示範價格・並非實際售價", "デモ価格・販売価格ではありません"],
  source: ["SunTVMall listed price", "SunTVMall 標示售價", "SunTVMall 掲載価格"],
  unverified: ["Price unverified · confirm before buying", "價格尚未核實・購買前請確認", "価格未確認・購入前にご確認ください"],
} as const;
