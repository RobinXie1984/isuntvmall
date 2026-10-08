import type { Product } from "@/types/commerce";
import { reviewedSupplierImage, SUPPLIER_IMAGE_PLACEHOLDER } from "@/lib/supplier-image-review";
const artwork: Record<string, string> = Object.fromEntries(["tee", "shirt", "fan", "tea", "bag", "earbuds"].map(name => [`/demo/${name}.svg`, `/editorial/${name}.jpg`]));
export function productImage(product: Product) {
  const source = product.images[0]?.sourceUrl;
  if (!source) return "/demo/product-placeholder.svg";
  return reviewedSupplierImage(product.isDemo ? artwork[source] ?? source : source);
}

export function hasProductImage(product: Product) {
  const image = productImage(product);
  return Boolean(product.images[0]?.sourceUrl?.trim()) && image !== "/demo/product-placeholder.svg" && image !== SUPPLIER_IMAGE_PLACEHOLDER;
}
