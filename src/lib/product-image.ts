import type { Product } from "@/types/commerce";
import { reviewedSupplierImage } from "@/lib/supplier-image-review";
const artwork: Record<string, string> = Object.fromEntries(["tee", "shirt", "fan", "tea", "bag", "earbuds"].map(name => [`/demo/${name}.svg`, `/editorial/${name}.jpg`]));
export function productImage(product: Product) {
  const source = product.images[0]?.sourceUrl;
  if (!source) return "/demo/product-placeholder.svg";
  return reviewedSupplierImage(product.isDemo ? artwork[source] ?? source : source);
}
