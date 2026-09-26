import type { Product } from "@/types/commerce";
import { collectionForProduct, productsForHoliday } from "./holiday-collections";

export function homepageSelection(products: readonly Product[]): Product[] {
  const ids = new Set<string>();
  const unique = products.filter(product => {
    if (ids.has(product.id)) return false;
    ids.add(product.id);
    return true;
  });
  const seasonal = productsForHoliday(unique, "mid-autumn").slice(0, 4);
  const everyday = unique.filter(product => !product.isDemo || !collectionForProduct(product.slug));
  const selected = new Set<string>();

  // Prefer everyday products after the seasonal four; a small catalogue can
  // fill the remaining spaces from any unselected product without repeating it.
  return [...seasonal, ...everyday, ...unique].filter(product => {
    if (selected.has(product.id) || selected.size >= 8) return false;
    selected.add(product.id);
    return true;
  });
}
