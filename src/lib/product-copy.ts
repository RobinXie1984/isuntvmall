import type { Product } from "@/types/commerce";
import { localize as translateSample, type Locale } from "@/lib/i18n";

type Localize = (value: string) => string;
type ProductText = Pick<Product, "title" | "titleZh" | "description" | "descriptionZh">;

// Merchant translations take precedence in the chosen language. Products that
// predate these optional fields retain the exact sample dictionary fallback.
export function productTitle(product: Pick<ProductText, "title" | "titleZh">, locale: Locale, localize: Localize = value => translateSample(value, locale)): string {
  return locale === "zh-Hant" && product.titleZh?.trim() ? product.titleZh : localize(product.title);
}

export function productDescription(product: Pick<ProductText, "description" | "descriptionZh">, locale: Locale, localize: Localize = value => translateSample(value, locale)): string {
  return locale === "zh-Hant" && product.descriptionZh?.trim() ? product.descriptionZh : localize(product.description);
}

export function productImageAlt(product: Product, locale: Locale, localize: Localize = value => translateSample(value, locale)): string {
  // Merchant image alt text currently has one language. When a translated title
  // exists, use it as the Chinese accessible name instead of English alt copy.
  if (locale === "zh-Hant" && product.titleZh?.trim()) return productTitle(product, locale, localize);
  return localize(product.images[0]?.altText || product.title);
}
