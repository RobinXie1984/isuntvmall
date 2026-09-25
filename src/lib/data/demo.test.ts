import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { demoProducts, getDemoLiveSessions } from "./demo";
import { productImage } from "../product-image";

describe("expanded showroom catalogue", () => {
  it("offers 96 distinct, preview-only products with safe cart identifiers", () => {
    expect(demoProducts).toHaveLength(96);
    for (const field of ["id", "slug", "sku"] as const) {
      expect(new Set(demoProducts.map(product => product[field])).size).toBe(demoProducts.length);
    }
    for (const product of demoProducts) {
      expect(product.isDemo).toBe(true);
      expect(product.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(Number.isSafeInteger(product.priceAmount)).toBe(true);
      expect(product.priceAmount).toBeGreaterThan(0);
      expect(product.stockQty).toBeGreaterThan(0);
    }
  });

  it("ships an image for every product link", () => {
    for (const product of demoProducts) {
      expect(existsSync(join(process.cwd(), "public", productImage(product))), product.slug).toBe(true);
    }
  });

  it("keeps each room curated rather than accidentally including the entire catalogue", () => {
    const rooms = getDemoLiveSessions();
    for (const room of rooms) {
      expect(room.products).toHaveLength(6);
      expect(new Set(room.products.map(product => product.id)).size).toBe(6);
      expect(room.products.every(product => demoProducts.includes(product))).toBe(true);
    }
    expect(rooms[0].products.some(product => product.slug === "linen-overshirt")).toBe(true);
    expect(rooms[1].products.some(product => product.slug === "stoneware-mug")).toBe(true);
    expect(rooms[2].products.some(product => product.slug === "weekend-duffel")).toBe(true);
  });
});
