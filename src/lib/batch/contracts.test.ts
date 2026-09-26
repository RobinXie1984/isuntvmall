import { describe, expect, it } from "vitest";
import { batchActionSchema, createBatchSchema, draftProductSchema, readBatchJson } from "./contracts";
import { parseBatchManifest } from "./manifest";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const item = { filename: "cup.jpg", mime: "image/jpeg", byte_size: 2048 };
const body = { requestId: id, title: "Cups", items: [item] };
function request(value: string, type = "application/json") { return new Request("https://example.com", { method: "POST", headers: { "Content-Type": type }, body: value }); }
describe("batch intake boundaries", () => {
  it("accepts a thousand file records without changing muji default", () => {
    const data = createBatchSchema.parse({ ...body, items: Array.from({ length: 1000 }, (_, i) => ({ ...item, filename: `${i}.jpg` })) });
    expect(data.styleId).toBe("muji"); expect(data.items).toHaveLength(1000);
    expect(createBatchSchema.safeParse({ ...body, items: [...data.items, item] }).success).toBe(false);
  });
  it("rejects duplicate filenames, paths, unknown styles, extra role claims and oversized images", () => {
    for (const input of [{ ...body, items: [item, item] }, { ...body, items: [{ ...item, filename: "../cup.jpg" }] }, { ...body, styleId: "other" }, { ...body, role: "super_admin" }, { ...body, items: [{ ...item, byte_size: 25 * 1024 * 1024 }] }]) expect(createBatchSchema.safeParse(input).success).toBe(false);
  });
  it("requires a revision and rejects client approval/hash injection", () => {
    expect(batchActionSchema.safeParse({ action: "approve", revision: 1 }).success).toBe(true);
    for (const input of [{ action: "approve" }, { action: "approve", revision: 0 }, { action: "approve", revision: 1, approvedBy: id }, { action: "upload", revision: 1, path: "other-user/file.jpg" }]) expect(batchActionSchema.safeParse(input).success).toBe(false);
  });
  it("defaults to real merchandise and preserves only explicit boolean demo flags through intake and edits", () => {
    const product = { sku: "CUP", title: "Cup" };
    expect(draftProductSchema.parse(product).isDemo).toBe(false);
    for (const isDemo of [true, false]) {
      const data = { ...product, isDemo };
      expect(createBatchSchema.parse({ ...body, items: [{ ...item, product_data: data }] }).items[0].product_data?.isDemo).toBe(isDemo);
      expect(batchActionSchema.parse({ action: "edit", revision: 2, productData: data })).toMatchObject({ productData: { isDemo } });
    }
    for (const isDemo of ["false", "true", 0, 1, null]) expect(draftProductSchema.safeParse({ ...product, isDemo }).success).toBe(false);
  });
  it("accepts an optional explicit CSV demo flag without silently coercing invalid values", () => {
    const header = "filename,sku,title,is_demo\n";
    expect(parseBatchManifest("filename,sku,title\ncup.jpg,CUP,Cup").get("cup.jpg")?.isDemo).toBe(false);
    for (const value of ["", "false", "true"]) expect(parseBatchManifest(header + `cup.jpg,CUP,Cup,${value}`).get("cup.jpg")?.isDemo).toBe(value === "true");
    for (const value of ["yes", "TRUE", "1", "null"]) expect(() => parseBatchManifest(header + `cup.jpg,CUP,Cup,${value}`)).toThrow("INVALID_MANIFEST");
  });
  it("bounds streamed JSON even without a content-length header", async () => {
    expect(await readBatchJson(request('{"ok":true}'), 100)).toEqual({ ok: true });
    await expect(readBatchJson(request('"' + 'x'.repeat(500) + '"'), 100)).rejects.toMatchObject({ code: "REQUEST_TOO_LARGE", status: 413 });
    await expect(readBatchJson(request("{"))).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(readBatchJson(request("{}", "text/plain"))).rejects.toMatchObject({ code: "JSON_REQUIRED" });
  });
  it("maps CSV prices exactly and rejects duplicates, fractional stock and missing identity", () => {
    const header = "filename,sku,title,description,category,price_hkd,stock\n";
    const map = parseBatchManifest(header + "cup.jpg,CUP,Cup,Actual cup,Lifestyle,12.09,2");
    expect(map.get("cup.jpg")?.priceAmount).toBe(1209);
    for (const row of ["cup.jpg,CUP,Cup,Cup,Lifestyle,12.001,2", "cup.jpg,CUP,Cup,Cup,Lifestyle,12,1.5", "cup.jpg,,Cup,Cup,Lifestyle,12,1"]) expect(() => parseBatchManifest(header + row)).toThrow();
    expect(() => parseBatchManifest(header + "cup.jpg,CUP,Cup,Cup,Lifestyle,12,1\ncup.jpg,CUP2,Cup,Cup,Lifestyle,12,1")).toThrow();
  });
});
