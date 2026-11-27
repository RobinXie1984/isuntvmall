import { describe, expect, it } from "vitest";
import { winterEditProducts } from "./winter-edit";
import type { Product } from "@/types/commerce";

import images from "./winter-edit-images.json";

function product(): Product {
  const copy = { en: "Jacket", "zh-Hant": "外套", "zh-Hans": "外套", ja: "ジャケット" };
  return {
    id: "w25126", sku: "SUNTV-123", slug: "suntv-w25126", title: "Jacket", description: "",
    currency: "hkd", priceAmount: 175152, stockQty: 0, category: "Apparel", featured: false,
    createdAt: "", status: "published", isDemo: false,
    images: [{ id: "image", sourceUrl: images["suntv-w25126"], storagePath: null, altText: "", position: 0 }],
    sourceListing: {
      handle: "w25126", snapshotAt: "2026-11-26", title: copy, description: copy, options: [],
      variants: [
        { id: "one", priceAmount: 175152, priceIsReviewed: true, available: true, options: [] },
        { id: "two", priceAmount: 175152, priceIsReviewed: true, available: true, options: [] },
      ],
    },
  };
}

describe("Winter Edit publication boundary", () => {
  it("shows a shortlisted listing only when its exact image and available prices are approved", () => {
    const ready = product();
    expect(winterEditProducts([ready])).toEqual([ready]);
    expect(winterEditProducts([
      { ...ready, status: "draft" },
      { ...ready, slug: "suntv-yy12-yd130403" },
      { ...ready, isDemo: true },
      { ...ready, images: [{ ...ready.images[0], sourceUrl: "/replacement.jpg" }] },
    ])).toEqual([]);
  });

  it("blocks a partial approval, demo price, or a conflicting card price", () => {
    const partial = product();
    partial.sourceListing!.variants[1].priceIsReviewed = false;
    const demoVariant = product();
    demoVariant.sourceListing!.variants[1].priceIsPlaceholder = true;
    expect(winterEditProducts([partial])).toEqual([]);
    expect(winterEditProducts([demoVariant])).toEqual([]);
    expect(winterEditProducts([{ ...product(), priceAmount: 173000 }])).toEqual([]);
  });
});
