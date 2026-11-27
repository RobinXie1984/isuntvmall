import type { Product } from "@/types/commerce";
import { mallBrowseGroup } from "@/lib/browse-categories";
import { demoProducts } from "./demo";

// Only the original concept catalogue has verified generated artwork.
// A demo price or editing a supplier's photo does not establish provenance.
const originalArtwork = new Map(demoProducts.map(product => [
  product.id,
  new Set(product.images.map(image => image.sourceUrl)),
]));
export const generatedDemoGroups = new Set(demoProducts.map(mallBrowseGroup));

export function hasGeneratedDemoArtwork(product: Product): boolean {
  const artwork = originalArtwork.get(product.id);
  return Boolean(
    product.isDemo && !product.sourceListing && artwork && product.images.length &&
    product.images.every(image => artwork.has(image.sourceUrl)),
  );
}
