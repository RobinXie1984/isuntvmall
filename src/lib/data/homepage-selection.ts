import type { Product } from "@/types/commerce";
import { activeShoppingOccasions, productSeason, rankSeasonalProducts } from "./seasonal-order";

export function homepageSelection(products: readonly Product[], now = new Date(), seasonalEnabled = true): Product[] {
  const ids = new Set<string>();
  const unique = products.filter(product => {
    if (ids.has(product.id)) return false;
    ids.add(product.id);
    return true;
  });
  const ranked = seasonalEnabled ? rankSeasonalProducts(unique, now) : unique;
  const active = new Set(seasonalEnabled ? activeShoppingOccasions(now).map(event => event.collection) : []);
  const seasonal = ranked.filter(product => active.has(productSeason(product)!)).slice(0, 4);
  const everyday = ranked.filter(product => !productSeason(product));
  const selected = new Set<string>();

  // Prefer everyday products after the seasonal four; a small catalogue can
  // fill the remaining spaces from any unselected product without repeating it.
  return [...seasonal, ...everyday, ...ranked].filter(product => {
    if (selected.has(product.id) || selected.size >= 8) return false;
    selected.add(product.id);
    return true;
  });
}
