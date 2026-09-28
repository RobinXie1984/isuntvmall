import { describe, expect, it } from "vitest";
import { demoKols, demoProducts, getDemoLiveSessions } from "./data/demo";
import { formatLocalizedMoney, localize, parseLocale, translate, LOCALES } from "./i18n";

const sampleText = [
  ...demoProducts.flatMap(p => [p.title, p.description, p.category, ...p.images.map(i => i.altText)]),
  ...demoKols.flatMap(k => [k.displayName, k.bio]),
  ...getDemoLiveSessions().flatMap(s => [s.title, s.description, s.hostName]),
].filter((value): value is string => typeof value === "string");

describe("shopper language selection", () => {
  it("defaults missing or unsupported cookie values to English", () => {
    for (const value of [null, undefined, "", "zh", "zh-CN", "ZH-HANT", "en; other=true"]) expect(parseLocale(value)).toBe("en");
    expect(parseLocale("zh-Hant")).toBe("zh-Hant");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("zh-Hans")).toBe("zh-Hans");
    expect(parseLocale("ja")).toBe("ja");
  });
  it("provides a Chinese-free English value for every sample catalogue field", () => {
    for (const text of sampleText) expect(localize(text, "en"), text).not.toMatch(/[\u3400-\u9fff]/);
  });
  it("provides separate Traditional Chinese catalogue and room text", () => {
    for (const text of sampleText) expect(localize(text, "zh-Hant"), text).toMatch(/[\u3400-\u9fff]/);
    expect(localize(demoProducts[1].title, "zh-Hant")).toBe("旅行襯衫");
    expect(localize(demoKols[0].displayName, "zh-Hant")).toBe("穿搭體驗間");
  });
  it("preserves merchant content rather than guessing from separators", () => {
    const custom = "A merchant's name · 品牌 / edition";
    expect(localize(custom, "en")).toBe(custom);
    expect(localize(custom, "zh-Hant")).toBe(custom);
    expect(localize(custom, "zh-Hans")).toBe(custom);
    expect(localize(custom, "ja")).toBe(custom);
  });
  it("localizes every sample product and room in Japanese", () => {
    for (const text of sampleText) {
      expect(localize(text, "ja"), text).not.toBe(localize(text, "en"));
      expect(localize(text, "ja"), text).toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
    }
    expect(localize("Travel shirt", "ja")).toBe(localize("Travel shirt · 旅行衬衫", "ja"));
  });
  it("uses Simplified Chinese for catalogue and dynamic UI quantities", () => {
    expect(localize(demoProducts[1].title, "zh-Hans")).toBe("旅行衬衫");
    expect(translate("Search products", "搜尋商品", "zh-Hans")).toBe("搜寻商品");
    expect(translate("3 items", "3 件商品", "ja", "3点")).toBe("3点");
    expect(translate("3 items", "3 件商品", "zh-Hans", "3点")).toBe("3 件商品");
  });
  it("keeps the price and currency value in either language", () => {
    expect(formatLocalizedMoney(5800, "hkd", "en")).toContain("58.00");
    expect(formatLocalizedMoney(5800, "hkd", "zh-Hant")).toContain("58.00");
    for (const locale of LOCALES) expect(formatLocalizedMoney(5800, "hkd", locale)).toContain("58.00");
  });
});
