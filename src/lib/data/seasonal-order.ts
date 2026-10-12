import { Lunar } from "lunar-typescript";
import { Seasons } from "astronomy-engine";
import type { Product } from "@/types/commerce";
import { collectionForProduct } from "./holiday-collections";

type Region = "hk" | "us" | "jp";
export type ShoppingOccasion = { id: string; region: Region; collection: string; date: string; endDate: string; leadDays: number };
const zones = { hk: "Asia/Hong_Kong", us: "America/New_York", jp: "Asia/Tokyo" };
const dayMs = 86_400_000;
const calendarCache = new Map<number, readonly ShoppingOccasion[]>();
function dateKey(date: Date, region: Region) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zones[region], year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}
function shift(date: string, days: number) { return new Date(Date.parse(`${date}T12:00:00Z`) + days * dayMs).toISOString().slice(0, 10); }
function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  return new Date(Date.UTC(year, month - 1, 1 + (weekday - new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 7) % 7 + (nth - 1) * 7)).toISOString().slice(0, 10);
}
function easter(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(Date.UTC(year, Math.floor(n / 31) - 1, n % 31 + 1)).toISOString().slice(0, 10);
}

/** Shopping occasions, not a statutory bank-holiday calendar. Dates are calculated
 * per year; substitute weekdays never extend a festival campaign. See docs/seasonal-ordering.md. */
export function shoppingOccasions(year: number): readonly ShoppingOccasion[] {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new RangeError("Unsupported holiday year");
  const cached = calendarCache.get(year);
  if (cached) return cached;
  const events: ShoppingOccasion[] = [];
  const fixed = (month: number, day: number) => new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  const add = (id: string, region: Region, collection: string, date: string, leadDays = 14, endDate = date) => events.push({ id: `${region}-${id}-${year}`, region, collection, date, endDate, leadDays });
  for (const region of ["hk", "us", "jp"] as const) {
    add("new-year", region, "new-year", fixed(1, 1), 14);
    add("valentine", region, "family-gratitude", fixed(2, 14));
    add("mothers-day", region, "family-gratitude", nthWeekday(year, 5, 0, 2));
    add("fathers-day", region, "family-gratitude", nthWeekday(year, 6, 0, 3));
    add("halloween", region, "halloween", fixed(10, 31), 21);
    add("christmas", region, "winter-gifting", fixed(12, 25), 28, fixed(12, region === "hk" ? 26 : 25));
  }
  // Positive lunar months mean the ordinary month, never its leap repetition.
  // Do not use runtime ICU: its 2027 lunar New Year disagrees with the HKO table.
  const lunarDay = (key: string) => { const [month, day] = key.split("/").map(Number); return Lunar.fromYmd(year, month, day).getSolar().toYmd(); };
  add("lunar-new-year", "hk", "lunar-new-year", lunarDay("1/1"), 28, shift(lunarDay("1/1"), 2));
  add("lantern", "hk", "lantern-wishes", lunarDay("1/15"));
  add("dragon-boat", "hk", "dragon-boat", lunarDay("5/5"), 21);
  add("mid-autumn", "hk", "mid-autumn", lunarDay("8/15"), 28);
  add("easter", "hk", "easter", shift(easter(year), -2), 21, shift(easter(year), 1));
  add("easter", "us", "easter", easter(year), 21);
  add("labour", "hk", "family-gratitude", fixed(5, 1), 7);
  add("establishment", "hk", "national-gatherings", fixed(7, 1), 7);
  add("national-day", "hk", "national-gatherings", fixed(10, 1), 7);
  add("independence", "us", "national-gatherings", fixed(7, 4), 14);
  add("labor", "us", "family-gratitude", nthWeekday(year, 9, 1, 1), 7);
  add("presidents", "us", "national-gatherings", nthWeekday(year, 2, 1, 3), 7);
  add("thanksgiving", "us", "thanksgiving", nthWeekday(year, 11, 4, 4), 21);
  add("coming-of-age", "jp", "family-gratitude", nthWeekday(year, 1, 1, 2), 7);
  add("foundation", "jp", "national-gatherings", fixed(2, 11), 7);
  add("emperor", "jp", "national-gatherings", fixed(2, 23), 7);
  add("hinamatsuri", "jp", "children-play", fixed(3, 3));
  add("golden-week", "jp", "spring-picnic", fixed(4, 29), 14, fixed(5, 5));
  add("children", "jp", "children-play", fixed(5, 5));
  add("tanabata", "jp", "lantern-wishes", fixed(7, 7));
  add("marine", "jp", "summer-journeys", nthWeekday(year, 7, 1, 3), 7);
  add("mountain", "jp", "summer-journeys", fixed(8, 11), 7);
  add("respect-aged", "jp", "family-gratitude", nthWeekday(year, 9, 1, 3), 7);
  add("sports", "jp", "autumn-craft", nthWeekday(year, 10, 1, 2), 7);
  add("culture", "jp", "autumn-craft", fixed(11, 3));
  add("shichi-go-san", "jp", "children-play", fixed(11, 15));
  add("labor-thanks", "jp", "family-gratitude", fixed(11, 23), 7);
  const seasons = Seasons(year);
  add("vernal-equinox", "jp", "spring-picnic", dateKey(seasons.mar_equinox.date, "jp"));
  add("autumn-equinox", "jp", "autumn-craft", dateKey(seasons.sep_equinox.date, "jp"), 7);
  add("winter-solstice", "hk", "winter-solstice", dateKey(seasons.dec_solstice.date, "hk"));
  const result = Object.freeze(events.map(event => Object.freeze(event)));
  // Only immutable year calculations are cached, never today's active selection.
  if (calendarCache.size >= 4) calendarCache.delete(calendarCache.keys().next().value!);
  calendarCache.set(year, result);
  return result;
}

export function activeShoppingOccasions(now = new Date()): ShoppingOccasion[] {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Invalid date");
  const today = Object.fromEntries(Object.keys(zones).map(region => [region, dateKey(now, region as Region)])) as Record<Region, string>;
  const years = new Set(Object.values(today).flatMap(date => [Number(date.slice(0, 4)), Number(date.slice(0, 4)) + 1]));
  return [...years].flatMap(shoppingOccasions).filter(event => today[event.region] >= shift(event.date, -event.leadDays) && today[event.region] <= event.endDate)
    .sort((a, b) => Math.max(0, Date.parse(a.date) - Date.parse(today[a.region])) - Math.max(0, Date.parse(b.date) - Date.parse(today[b.region])) || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function productSeason(product: Product) { return product.isDemo ? collectionForProduct(product.slug)?.id : undefined; }
export function rankSeasonalProducts(products: readonly Product[], now = new Date()): Product[] {
  const active = [...new Set(activeShoppingOccasions(now).map(event => event.collection))];
  const rank = (product: Product) => { const season = productSeason(product); const index = season ? active.indexOf(season) : -1; return index >= 0 ? index : season ? active.length + 1 : active.length; };
  return [...products].sort((a, b) => rank(a) - rank(b) || Number(b.featured) - Number(a.featured));
}
export function featuredShoppingOccasion(products: readonly Product[], now = new Date()) {
  const available = new Set(products.map(productSeason));
  return activeShoppingOccasions(now).find(event => available.has(event.collection));
}
