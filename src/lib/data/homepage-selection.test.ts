import { describe, expect, it } from "vitest";
import { homepageSelection } from "./homepage-selection";
import { holidayProducts } from "./holiday-catalogue";
import { expandedProducts } from "./expanded-catalogue";
import { productsForHoliday } from "./holiday-collections";

const autumn = productsForHoliday(holidayProducts, "mid-autumn");

describe("homepage selection", () => {
  it("shows four seasonal products then four everyday products when managed ordering puts holidays first", () => {
    const products = [...holidayProducts, ...expandedProducts];
    expect(homepageSelection(products)).toEqual([...autumn.slice(0, 4), ...expandedProducts.slice(0, 4)]);
  });

  it("deduplicates IDs before choosing the seasonal four and leaves input objects unchanged", () => {
    const products = Object.freeze([
      autumn[0], { ...autumn[0] }, autumn[1], autumn[1], ...autumn.slice(2),
      expandedProducts[0], expandedProducts[0], ...expandedProducts.slice(1),
    ]);
    const before = structuredClone(products);
    const result = homepageSelection(products);
    expect(result).toEqual([...autumn.slice(0, 4), ...expandedProducts.slice(0, 4)]);
    expect(new Set(result.map(product => product.id)).size).toBe(8);
    expect(result[0]).toBe(products[0]);
    expect(products).toEqual(before);
  });

  it("fills a short catalogue with remaining unique seasonal products after available everyday products", () => {
    const products = [...autumn.slice(0, 6), expandedProducts[0], autumn[0]];
    expect(homepageSelection(products)).toEqual([
      ...autumn.slice(0, 4), expandedProducts[0], ...autumn.slice(4, 6),
    ]);
    expect(homepageSelection([autumn[0], autumn[0]])).toEqual([autumn[0]]);
    expect(homepageSelection([])).toEqual([]);
  });
});
