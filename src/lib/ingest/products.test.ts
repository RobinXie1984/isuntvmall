import { describe, expect, it } from "vitest";
import { parseProductCsv, slugify } from "@/lib/ingest/products";

describe("product CSV ingestion", () => {
  it("parses dollar prices into exact minor units", () => {
    const result = parseProductCsv("sku,title,price,stock_qty,category,featured\nTEE-1,Sun Tee,58.09,12,Apparel,yes");
    expect(result.issues).toEqual([]);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({ sku: "TEE-1", priceAmount: 5809, stockQty: 12, featured: true });
  });

  it("supports the Chinese template headers", () => {
    const result = parseProductCsv("商品编号,商品名,价格,库存,分类,图片\nFAN-1,随身风扇,29.00,25,生活,https://example.com/fan.jpg");
    expect(result.issues).toEqual([]);
    expect(result.products[0]).toMatchObject({ sku: "FAN-1", title: "随身风扇", priceAmount: 2900, stockQty: 25 });
  });

  it("preserves missing price as an error instead of manufacturing zero", () => {
    const result = parseProductCsv("sku,title,price,stock_qty\nBAD-1,Missing Price,,4");
    expect(result.products).toEqual([]);
    expect(result.issues[0]).toMatchObject({ row: 2 });
    expect(result.issues[0].message).toContain("priceAmount");
  });

  it("defaults imported products to draft",()=>{expect(parseProductCsv("sku,title,price,stock_qty\nD-1,Draft,12,2").products[0].status).toBe("draft");});

  it("rejects duplicate rows before any write",()=>{expect(parseProductCsv("sku,title,price,stock_qty\nD-1,Draft,12,2\nD-1,Draft,12,2").issues[0].message).toContain("Duplicate");});

  it("creates stable ASCII slugs when the SKU is present", () => {
    expect(slugify("阳光 200支棉 SUN-TEE-200")).toBe("200-sun-tee-200");
  });
});
