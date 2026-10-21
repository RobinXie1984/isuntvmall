import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import curated from "./curated-thumbnails.json";
import { broadcastThumbnail } from "./thumbnails";
const url = "https://www.facebook.com/share/v/1HmZq19pUq/";
describe("source-bound broadcast thumbnails", () => {
  it("preserves the admin override", () => {
    expect(broadcastThumbnail({ url, thumbnailUrl: "/editorial/custom.jpg" })).toEqual({ src: "/editorial/custom.jpg" });
  });
  it("recognises the same share link with tracking or without trailing slash", () => {
    for (const source of [url, url + "?mibextid=wwXIfr", url.slice(0, -1)]) expect(broadcastThumbnail({ url: source, thumbnailUrl: "" }).src).toBe("/editorial/broadcasts/kol-01.jpg");
  });
  it("never reuses an unrelated or unavailable source image", () => {
    for (const source of ["invalid", "https://example.com/share/v/1HmZq19pUq/", url.replace("https:", "http:"), url.replace("www.facebook.com", "www.facebook.com:8443"), url.replace("www.facebook.com", "user@www.facebook.com"), "https://www.facebook.com/share/v/16BLWGDnm6F/", "https://www.facebook.com/share/v/new/"]) expect(broadcastThumbnail({ url: source, thumbnailUrl: "" }).src).toBe("");
  });
  it("ships nine distinct verified assets with valid non-destructive framing", () => {
    expect(curated).toHaveLength(9);
    expect(new Set(curated.map(image => image.sourceUrl)).size).toBe(9);
    for (const image of curated) {
      expect(existsSync("public" + image.src)).toBe(true);
      expect(image.cropTop).toBeGreaterThanOrEqual(0);
      expect(image.cropTop).toBeLessThan(image.height);
    }
  });
});
