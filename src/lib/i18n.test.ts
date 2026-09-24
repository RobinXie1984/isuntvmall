import { describe, expect, it } from "vitest";
import { demoKols, demoProducts, getDemoLiveSessions } from "./data/demo";
import { formatLocalizedMoney, localize, parseLocale } from "./i18n";

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
  });
  it("keeps the price and currency value in either language", () => {
    expect(formatLocalizedMoney(5800, "hkd", "en")).toContain("58.00");
    expect(formatLocalizedMoney(5800, "hkd", "zh-Hant")).toContain("58.00");
  });
});
