import { describe, expect, it } from "vitest";
import { homepageSelection } from "./homepage-selection";
import { holidayProducts } from "./holiday-catalogue";
import { expandedProducts } from "./expanded-catalogue";
import { productsForHoliday } from "./holiday-collections";
import { exhibitionHero, exhibitionHeroImage, exhibitionProducts } from "./homepage-exhibition";

const now = new Date("2026-09-25T04:00:00Z");
const everyday = [...expandedProducts].sort((a,b)=>Number(b.featured)-Number(a.featured));
const autumn = productsForHoliday(holidayProducts, "mid-autumn");

describe("homepage selection", () => {
  it("shows four seasonal products then four everyday products when managed ordering puts holidays first", () => {
    const products = [...holidayProducts, ...expandedProducts];
    expect(homepageSelection(products, now)).toEqual([...autumn.slice(0, 4), ...everyday.slice(0, 4)]);
  });

  it("deduplicates IDs before choosing the seasonal four and leaves input objects unchanged", () => {
    const products = Object.freeze([
      autumn[0], { ...autumn[0] }, autumn[1], autumn[1], ...autumn.slice(2),
      expandedProducts[0], expandedProducts[0], ...expandedProducts.slice(1),
    ]);
    const before = structuredClone(products);
    const result = homepageSelection(products, now);
    expect(result).toEqual([...autumn.slice(0, 4), ...everyday.slice(0, 4)]);
    expect(new Set(result.map(product => product.id)).size).toBe(8);
    expect(result[0]).toBe(products[0]);
    expect(products).toEqual(before);
  });

  it("fills a short catalogue with remaining unique seasonal products after available everyday products", () => {
    const products = [...autumn.slice(0, 6), expandedProducts[0], autumn[0]];
    expect(homepageSelection(products, now)).toEqual([
      ...autumn.slice(0, 4), expandedProducts[0], ...autumn.slice(4, 6),
    ]);
    expect(homepageSelection([autumn[0], autumn[0]], now)).toEqual([autumn[0]]);
    expect(homepageSelection([], now)).toEqual([]);
  });
});

describe("homepage exhibition palette", () => {
  it("features only reviewed photo versions and leaves other catalogue products available", () => {
    const linen = expandedProducts.find(product => product.slug === "linen-overshirt")!;
    const unselected = expandedProducts.find(product => product.slug === "relaxed-cotton-trousers")!;
    const revised = { ...linen, images: [{ ...linen.images[0], sourceUrl: "/editorial/expanded/relaxed-cotton-trousers.jpg" }] };
    expect(exhibitionProducts([unselected, linen])).toEqual([linen]);
    expect(exhibitionProducts([unselected, revised])).toEqual([]);
    expect(unselected.images).not.toHaveLength(0);
  });

  it("keeps reviewed seasonal covers and falls back to a neutral photo", () => {
    const autumn = "/editorial/holiday/harvest-table-runner.jpg";
    expect(exhibitionHeroImage(autumn)).toBe(autumn);
    expect(exhibitionHeroImage("/editorial/holiday/indigo-summer-towel.jpg")).toBe(exhibitionHero);
  });
});
