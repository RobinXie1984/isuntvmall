import images from "./winter-edit-images.json";
import { hasProductImage, productImage } from "@/lib/product-image";
import { productPriceDisclosure, sourcePriceDisclosure } from "@/lib/price-disclosure";
import type { Product } from "@/types/commerce";

const reviewedWinterImages: Readonly<Record<string, string>> = images;
const shortlist = [
  "suntv-w25126",
  "suntv-25190",
  "suntv-w28126",
  "suntv-hy115",
  "suntv-hy117",
  "suntv-hy120",
];

export function winterEditProducts(products: readonly Product[]): Product[] {
  const bySlug = new Map(products.map(product => [product.slug, product]));
  return shortlist.flatMap(slug => {
    const product = bySlug.get(slug);
    if (!product || product.status !== "published" || product.isDemo !== false ||
      !hasProductImage(product) || reviewedWinterImages[slug] !== productImage(product) ||
      productPriceDisclosure(product) !== "reviewed") return [];

    const available = product.sourceListing?.variants.filter(variant => variant.available);
    // Source-listed prices do not count as a merchandise approval for this edit.
    return available?.length && available.every(variant => sourcePriceDisclosure(variant) === "reviewed")
      ? [product] : [];
  });
}
