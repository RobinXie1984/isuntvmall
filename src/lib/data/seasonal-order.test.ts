import { describe, expect, it } from "vitest";
import { activeShoppingOccasions, shoppingOccasions, rankSeasonalProducts, productSeason, featuredShoppingOccasion } from "./seasonal-order";
import { homepageSelection } from "./homepage-selection";
import { holidayProducts } from "./holiday-catalogue";
import { expandedProducts } from "./expanded-catalogue";
const products = [...holidayProducts, ...expandedProducts];
const at = (date: string) => new Date(`${date}T04:00:00Z`);
const active = (date: Date, collection: string) => activeShoppingOccasions(date).some(e => e.collection === collection);
const event = (year: number, id: string) => shoppingOccasions(year).find(e => e.id === `${id}-${year}`)!;
describe("annual shopping calendar", () => {
  // Independent reference fixtures: HKO Gregorian-lunar tables and Japan Cabinet Office; see docs.
  it.each([
    [2026, "2026-02-17", "2026-06-19", "2026-09-25"],
    [2027, "2027-02-06", "2027-06-09", "2027-09-15"],
    [2028, "2028-01-26", "2028-05-28", "2028-10-03"],
  ])("calculates lunar festivals for %i, including a leap-lunar-month year", (year, newYear, dragon, moon) => {
    expect(event(year as number,"hk-lunar-new-year").date).toBe(newYear);
    expect(event(year as number,"hk-dragon-boat").date).toBe(dragon);
    expect(event(year as number,"hk-mid-autumn").date).toBe(moon);
  });
  it.each([[2026,"2026-11-26","2026-10-12","2026-03-20","2026-09-23"],[2027,"2027-11-25","2027-10-11","2027-03-21","2027-09-23"]])("calculates weekday and astronomical occasions for %i", (year, thanks, sports, spring, autumn) => {
    expect(event(year as number,"us-thanksgiving").date).toBe(thanks);
    expect(event(year as number,"jp-sports").date).toBe(sports);
    expect(event(year as number,"jp-vernal-equinox").date).toBe(spring);
    expect(event(year as number,"jp-autumn-equinox").date).toBe(autumn);
  });
  it("uses Easter computus and next year's occasions across December", () => {
    expect(event(2027,"us-easter").date).toBe("2027-03-28");
    expect(activeShoppingOccasions(at("2026-12-29")).some(e => e.id === "hk-new-year-2027")).toBe(true);
  });
  it("starts 28 days ahead and ends at Hong Kong midnight, not the substitute public holiday", () => {
    expect(active(new Date("2026-08-27T15:59:59Z"),"mid-autumn")).toBe(false);
    expect(active(new Date("2026-08-27T16:00:00Z"),"mid-autumn")).toBe(true);
    expect(active(new Date("2026-09-25T15:59:59Z"),"mid-autumn")).toBe(true);
    expect(active(new Date("2026-09-25T16:00:00Z"),"mid-autumn")).toBe(false);
  });
  it("ends US Thanksgiving at Eastern midnight, including winter offset", () => {
    expect(active(new Date("2026-11-27T04:59:59Z"),"thanksgiving")).toBe(true);
    expect(active(new Date("2026-11-27T05:00:00Z"),"thanksgiving")).toBe(false);
  });
  it("ends Japanese occasions at Tokyo midnight", () => {
    expect(activeShoppingOccasions(new Date("2026-10-12T14:59:59Z")).some(e => e.id === "jp-sports-2026")).toBe(true);
    expect(activeShoppingOccasions(new Date("2026-10-12T15:00:00Z")).some(e => e.id === "jp-sports-2026")).toBe(false);
  });
});
describe("automatic ordering without catalogue mutation", () => {
  it.each(["2026-10-12","2027-09-15","2028-10-03","2033-08-20","2040-12-29"])("preserves every product on %s", date => {
    const before = structuredClone(products);
    const result = rankSeasonalProducts(Object.freeze([...products]),at(date));
    expect(result.map(p=>p.id).sort()).toEqual(products.map(p=>p.id).sort());
    expect(products).toEqual(before);
  });
  it("promotes mooncakes before the festival and demotes them afterward in the same running process", () => {
    expect(productSeason(rankSeasonalProducts(products,at("2027-09-15"))[0])).toBe("mid-autumn");
    const after = rankSeasonalProducts(products,at("2027-09-16"));
    expect(after.findIndex(p=>productSeason(p)==="mid-autumn")).toBeGreaterThan(after.findIndex(p=>!productSeason(p)));
    expect(homepageSelection(products,at("2027-09-16")).some(p=>productSeason(p)==="mid-autumn")).toBe(false);
  });
  it("fixes the current mooncake-first hero and homepage", () => {
    expect(featuredShoppingOccasion(products,at("2026-10-12"))?.collection).not.toBe("mid-autumn");
    expect(homepageSelection(products,at("2026-10-12")).some(p=>productSeason(p)==="mid-autumn")).toBe(false);
  });
  it("leads with evergreen products when no holiday is relevant", () => {
    expect(activeShoppingOccasions(at("2027-08-14"))).toEqual([]);
    expect(productSeason(rankSeasonalProducts(products,at("2027-08-14"))[0])).toBeUndefined();
    expect(homepageSelection(products,at("2027-08-14")).every(p=>!productSeason(p))).toBe(true);
    expect(featuredShoppingOccasion(products,at("2027-08-14"))).toBeUndefined();
  });
  it("does not classify a real merchant product by a demo slug or promote an unavailable collection", () => {
    const real = {...holidayProducts[0],isDemo:false};
    expect(productSeason(real)).toBeUndefined();
    expect(featuredShoppingOccasion([real],at("2027-09-15"))).toBeUndefined();
  });
  it("does not multiply boosts for shared regional occasions and preserves stable ties", () => {
    const same = expandedProducts.slice(0,3).map(p=>({...p,featured:false}));
    expect(rankSeasonalProducts(same,at("2026-10-31"))).toEqual(same);
    const home = homepageSelection(products,at("2026-10-31"));
    expect(new Set(home.map(p=>p.id)).size).toBe(home.length);
    expect(home.filter(p=>productSeason(p))).toHaveLength(4);
  });
  it("keeps immutable year cache from freezing future requests", () => {
    expect(Object.isFrozen(shoppingOccasions(2027)[0])).toBe(true);
    expect(active(at("2027-09-15"),"mid-autumn")).toBe(true);
    expect(active(at("2028-09-15"),"mid-autumn")).toBe(true);
    expect(active(at("2028-10-04"),"mid-autumn")).toBe(false);
  });
});
