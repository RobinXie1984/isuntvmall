import { describe, expect, it } from "vitest";
import { holidayProducts, holidaySamples } from "./holiday-catalogue";
import { holidayCollections, productsForHoliday } from "./holiday-collections";
import { holidayCalendar, holidayRegions } from "./holiday-calendar";

describe("holiday catalogue", () => {
  it("assigns all 50 concepts exactly once to 17 populated collections", () => {
    expect(holidayProducts).toHaveLength(50);
    expect(holidayCollections).toHaveLength(17);
    expect(new Set(holidaySamples.map(item => item.slug)).size).toBe(50);
    const ids = new Set(holidayCollections.map(item => item.id));
    expect(holidaySamples.every(item => ids.has(item.collectionId))).toBe(true);
    expect(holidayCollections.every(item => productsForHoliday(holidayProducts, item.id).length > 0)).toBe(true);
    for (const item of holidayCollections) {
      for (const copy of [item.title, item.description, item.occasion]) {
        expect(copy[0]).not.toMatch(/[\u3400-\u9fff]/);
        expect(copy[1]).toMatch(/[\u3400-\u9fff]/);
      }
    }
  });
  it("does not assign a merchant product to a mock collection by slug alone", () => {
    const product = { ...holidayProducts[0], isDemo: false };
    expect(productsForHoliday([product], "mid-autumn")).toEqual([]);
    expect(productsForHoliday(holidayProducts, "unknown")).toEqual([]);
  });
  it("gives every regional occasion a valid date, bilingual copy, source and collection", () => {
    expect(holidayCalendar).toHaveLength(96);
    expect(new Set(holidayCalendar.map(day => day.id)).size).toBe(96);
    for (const region of holidayRegions) expect(holidayCalendar.some(day => day.region === region.id)).toBe(true);
    for (const day of holidayCalendar) {
      expect(new Date(day.date).toISOString().slice(0, 10)).toBe(day.date);
      expect(day.date.startsWith("2026-")).toBe(true);
      if (day.endDate) expect(day.endDate >= day.date).toBe(true);
      expect(holidayCollections.some(item => item.id === day.collectionId)).toBe(true);
      expect(new URL(day.sourceUrl).protocol).toBe("https:");
      expect(day.name[0]).not.toMatch(/[\u3400-\u9fff]/);
      expect(day.name[1]).toMatch(/[\u3400-\u9fff]/);
    }
  });
  it("distinguishes Mid-Autumn festival day from Hong Kong's following-day holiday", () => {
    const hk = holidayCalendar.filter(day => day.region === "hk" && day.collectionId === "mid-autumn");
    expect(hk.some(day => day.date === "2026-09-25" && day.kind === "cultural")).toBe(true);
    expect(hk.some(day => day.date === "2026-09-26" && day.kind === "public")).toBe(true);
  });
});
