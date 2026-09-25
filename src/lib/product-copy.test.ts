import { describe, expect, it } from "vitest";
import { productTitle, productDescription, productImageAlt } from "./product-copy";
import { localize } from "./i18n";
import { demoProducts } from "./data/demo";
import { checkoutInputSchema, parseStoredCart } from "./cart";
import type { Product } from "@/types/commerce";

const merchant: Product = {
  ...demoProducts[0], isDemo: false,
  title: "Merchant linen shirt", titleZh: "商戶亞麻襯衫",
  description: "A breathable linen shirt.", descriptionZh: "透氣舒適的亞麻襯衫。",
  images: [{ ...demoProducts[0].images[0], altText: "Linen shirt on a hanger" }],
};

describe("merchant product language", () => {
  it("selects one merchant language in titles, descriptions and accessible image names", () => {
    expect(productTitle(merchant, "en")).toBe("Merchant linen shirt");
    expect(productTitle(merchant, "zh-Hant")).toBe("商戶亞麻襯衫");
    expect(productDescription(merchant, "en")).toBe("A breathable linen shirt.");
    expect(productDescription(merchant, "zh-Hant")).toBe("透氣舒適的亞麻襯衫。");
    expect(productImageAlt(merchant, "zh-Hant")).toBe("商戶亞麻襯衫");
    expect(productImageAlt(merchant, "en")).toBe("Linen shirt on a hanger");
  });
  it("prioritizes explicit merchant copy over coincidentally matching sample copy", () => {
    const product = { ...merchant, title: demoProducts[0].title };
    expect(productTitle(product, "zh-Hant")).toBe(merchant.titleZh);
  });
  it("preserves exact dictionary fallback for every existing sample product", () => {
    for (const product of demoProducts) for (const locale of ["en", "zh-Hant"] as const) {
      expect(productTitle(product, locale)).toBe(localize(product.title, locale));
      expect(productDescription(product, locale)).toBe(localize(product.description, locale));
    }
  });
  it("treats missing or blank optional Chinese copy as a legacy product", () => {
    const product = { ...demoProducts[0], titleZh: "  ", descriptionZh: undefined };
    expect(productTitle(product, "zh-Hant")).toBe(localize(product.title, "zh-Hant"));
    expect(productDescription(product, "zh-Hant")).toBe(localize(product.description, "zh-Hant"));
  });
  it("resolves the stored cart ID to current Chinese merchant copy after a language reload", () => {
    const stored = JSON.stringify([{ productId: merchant.id, quantity: 2 }]);
    const [line] = parseStoredCart(JSON.parse(stored));
    const reloadedProduct = [merchant].find(product => product.id === line.productId)!;
    expect(line.quantity).toBe(2);
    expect(productTitle(reloadedProduct, "en")).toBe("Merchant linen shirt");
    expect(productTitle(reloadedProduct, "zh-Hant")).toBe("商戶亞麻襯衫");
    expect(productTitle({ ...reloadedProduct, titleZh: "更新後的商戶名稱" }, "zh-Hant")).toBe("更新後的商戶名稱");
  });
  it("keeps display copy out of trusted checkout selectors", () => {
    const line = { productId: merchant.id, quantity: 1, titleZh: "Untrusted browser copy" };
    expect(checkoutInputSchema.safeParse({ checkoutAttemptId: "11111111-1111-4111-8111-111111111111", items: [line] }).success).toBe(false);
  });
});
