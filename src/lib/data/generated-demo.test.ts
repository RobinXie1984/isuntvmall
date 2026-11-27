import { describe, expect, it } from "vitest";
import { demoProducts } from "./demo";
import { supplierDemoProducts } from "./supplier-demo";
import { hasGeneratedDemoArtwork } from "./generated-demo";

describe("generated demo collection", () => {
  it("admits the original concept artwork and excludes supplier previews", () => {
    expect(demoProducts.every(hasGeneratedDemoArtwork)).toBe(true);
    expect(supplierDemoProducts.some(hasGeneratedDemoArtwork)).toBe(false);
  });

  it("rejects unknown products, real sale items, and substituted or mixed images", () => {
    const original = demoProducts[0];
    const replacement = { ...original.images[0], sourceUrl: "/products/supplier-demo/cer-f001.webp" };
    expect(hasGeneratedDemoArtwork({ ...original, id: "unknown" })).toBe(false);
    expect(hasGeneratedDemoArtwork({ ...original, isDemo: false })).toBe(false);
    expect(hasGeneratedDemoArtwork({ ...original, images: [replacement] })).toBe(false);
    expect(hasGeneratedDemoArtwork({ ...original, images: [...original.images, replacement] })).toBe(false);
  });
});
