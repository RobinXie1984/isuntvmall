import { productImage } from "@/lib/product-image";
import type { Product } from "@/types/commerce";
import images from "./homepage-exhibition-images.json";

export const exhibitionHero = "/editorial/expanded/stoneware-mug.jpg";
const reviewedImages: Readonly<Record<string, string>> = images;
const reviewedHolidayImages = new Set(Object.values(images).filter(image => image.startsWith("/editorial/holiday/")));

export function exhibitionProducts(products: readonly Product[]): Product[] {
  const bySlug = new Map(products.map(product => [product.slug, product]));
  // Review the actual image version. A supplier replacement needs its own editorial review.
  return Object.entries(reviewedImages).flatMap(([slug, image]) => {
    const product = bySlug.get(slug);
    return product && productImage(product) === image ? [product] : [];
  });
}

export function exhibitionHeroImage(seasonalImage: string): string {
  return reviewedHolidayImages.has(seasonalImage) ? seasonalImage : exhibitionHero;
}

export const exhibitionFilms: Readonly<Record<string, {id: string; poster?: string}>> = {
  malove: { id: "84ac8326-bda2-5f18-ace2-63b2e1d96217" },
  honayin: { id: "7e5029a0-1d08-56c5-8662-a310b9414088", poster: "/editorial/honayin-film-cover.jpg" },
};
