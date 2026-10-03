import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ configured: vi.fn(), query: vi.fn() }));
vi.mock("@/lib/env", () => ({ hasSupabaseConfig: mocks.configured }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: mocks.query }) }));
import { getProducts, getProductBySlug, getProductsByIds } from "./store";
import { supplierDemoProducts, supplierDisplayOnly } from "./supplier-demo";
import { localize, LOCALES } from "@/lib/i18n";
const merchant = { id: "merchant", sku: "MERCHANT", slug: "merchant", title: "Merchant", price_amount: 100, currency: "hkd", stock_qty: 1, status: "published", product_images: [] };
beforeEach(() => {
  mocks.configured.mockReturnValue(true);
  mocks.query.mockReset();
  mocks.query.mockImplementation(() => {
    const query = { select: () => query, order: () => query, eq: () => query, in: () => query,
      range: () => Promise.resolve({ data: [merchant], error: null }),
      then: (resolve: (data: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) };
    return query;
  });
});
describe("supplier demo integration", () => {
  it("adds demo products to public browsing but leaves admin records untouched", async () => {
    expect(await getProducts()).toHaveLength(103);
    expect((await getProducts({ includeDrafts: true })).map(p => p.id)).toEqual(["merchant"]);
  });
  it("resolves demo detail without querying operational tables", async () => {
    expect(await getProductBySlug(supplierDemoProducts[0].slug)).toEqual(supplierDemoProducts[0]);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("does not turn storefront-only demonstrations into checkout products", async () => {
    expect(await getProductsByIds(supplierDemoProducts.map(p => p.id))).toEqual([]);
    mocks.configured.mockReturnValue(false);
    expect(await getProductsByIds(supplierDemoProducts.map(p => p.id))).toEqual([]);
  });
  it("keeps the same sample selection offline and excludes display-only references", async () => {
    mocks.configured.mockReturnValue(false);
    const publicProducts = await getProducts();
    expect(supplierDemoProducts.every(p => publicProducts.some(item => item.id === p.id))).toBe(true);
    expect(supplierDemoProducts).toHaveLength(102);
    expect(supplierDisplayOnly).toHaveLength(11);
    expect(new Set(supplierDemoProducts.map(p => p.id)).size).toBe(102);
    expect(supplierDemoProducts.every(p => p.isDemo && Number.isSafeInteger(p.priceAmount) && p.priceAmount > 0)).toBe(true);
  });
  it("has explicit copy for all four locales without supplier source paths", () => {
    for (const p of supplierDemoProducts) {
      for (const locale of LOCALES) {
        expect(localize(p.title, locale)).toBeTruthy();
        expect(localize(p.description, locale)).toBeTruthy();
        if (locale !== "en") expect(localize(p.description, locale)).not.toBe(p.description);
      }
      expect(JSON.stringify(p)).not.toMatch(/sharepoint|\/Users\/|sourceRecord|wholesale|onmicrosoft/i);
    }
  });
});
