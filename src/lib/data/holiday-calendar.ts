import calendar from "./holiday-calendar.json";
export type HolidayRegion = "hk" | "tw" | "jp" | "us";
export type HolidayOccasion = {
  id: string; region: HolidayRegion; date: string; endDate?: string;
  name: [string, string]; kind: "public" | "cultural" | "seasonal";
  note: [string, string]; sourceUrl: string; collectionId: string;
};
export const holidayRegions: { id: HolidayRegion; name: [string,string] }[] = [
  { id: "hk", name: ["Hong Kong", "香港"] },
  { id: "tw", name: ["Taiwan", "台灣"] },
  { id: "jp", name: ["Japan", "日本"] },
  { id: "us", name: ["United States", "美國"] },
];
export const holidayCalendar = calendar as HolidayOccasion[];
export function holidayRegion(value: string | undefined): HolidayRegion | undefined {
  return holidayRegions.find(region => region.id === value)?.id;
}
