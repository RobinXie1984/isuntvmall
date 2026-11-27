import type { Product } from "@/types/commerce";

export const demoCollectionId = "ai-demo";
export const demoCollectionTitle = ["AI-generated demo", "AI 生成示範", "AI生成デモ"] as const;

export function isRealMerchandise(product: Product): boolean {
  return product.isDemo === false;
}

export function catalogueAudience(products: Product[], separateDemo: boolean, demoCollection: boolean): Product[] {
  if (!separateDemo) return products;
  return products.filter(product => isRealMerchandise(product) !== demoCollection);
}
