/** Individually inspected 8 October 2026. Unknown supplier photos fail closed.
 * Original files remain unchanged; see docs/MUJI-IMAGE-REVIEW-20261008.json. */
export const SUPPLIER_IMAGE_PLACEHOLDER = "/products/supplier-demo/image-unavailable.svg";
const approvedSupplierImages = new Set([
  "/products/supplier-demo/footwear-20p18-5.webp",
  "/products/supplier-demo/footwear-23a12-1.webp",
  "/products/supplier-demo/footwear-24p20-6.webp",
  "/products/supplier-demo/footwear-24p25-1.webp",
  "/products/supplier-demo/footwear-25a18-1.webp",
  "/products/supplier-demo/footwear-9a57-9.webp",
  "/products/supplier-demo/footwear-9p65s-2.webp",
  "/products/supplier-demo/mdxy-3.webp",
  "/products/supplier-demo/sup-010.webp"
]);
const approvedCrops: Record<string, string> = {
  "/products/supplier-demo/cer-f001.webp": "/products/muji-reviewed/cer-f001.webp",
  "/products/supplier-demo/footwear-20p18-1.webp": "/products/muji-reviewed/footwear-20p18-1.webp",
  "/products/supplier-demo/footwear-22d58a-2.webp": "/products/muji-reviewed/footwear-22d58a-2.webp",
  "/products/supplier-demo/footwear-25p01-3.webp": "/products/muji-reviewed/footwear-25p01-3.webp",
  "/products/supplier-demo/footwear-25p08-5.webp": "/products/muji-reviewed/footwear-25p08-5.webp",
  "/products/supplier-demo/footwear-21a28-5.webp": "/products/muji-reviewed/footwear-21a28-5.webp",
  "/products/supplier-demo/footwear-21d30-1.webp": "/products/muji-reviewed/footwear-21d30-1.webp",
  "/products/supplier-demo/footwear-22d58a-3.webp": "/products/muji-reviewed/footwear-22d58a-3.webp",
  "/products/supplier-demo/footwear-25p01-2.webp": "/products/muji-reviewed/footwear-25p01-2.webp",
  "/products/supplier-demo/footwear-25p10-3.webp": "/products/muji-reviewed/footwear-25p10-3.webp",
  "/products/supplier-demo/footwear-25p20-2.webp": "/products/muji-reviewed/footwear-25p20-2.webp",
  "/products/supplier-demo/footwear-26p02-1.webp": "/products/muji-reviewed/footwear-26p02-1.webp",
  "/products/supplier-demo/footwear-26p02-2.webp": "/products/muji-reviewed/footwear-26p02-2.webp",
  "/products/supplier-demo/footwear-26p02-5.webp": "/products/muji-reviewed/footwear-26p02-5.webp",
  "/products/supplier-demo/footwear-26p09-2.webp": "/products/muji-reviewed/footwear-26p09-2.webp",
  "/products/supplier-demo/mdxy-4.webp": "/products/muji-reviewed/mdxy-4.webp",
  "/products/supplier-demo/mdxy-5.webp": "/products/muji-reviewed/mdxy-5.webp"
};
export function reviewedSupplierImage(source: string): string {
  if (approvedCrops[source]) return approvedCrops[source];
  return source.startsWith("/products/supplier-demo/") && !approvedSupplierImages.has(source)
    ? SUPPLIER_IMAGE_PLACEHOLDER : source;
}
