import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { reviewedSupplierImage, SUPPLIER_IMAGE_PLACEHOLDER } from "./supplier-image-review";
import { batchActionSchema } from "./batch/contracts";
import crops from "../../docs/MUJI-CROP-LEDGER-20261008.json";
import review from "../../docs/MUJI-IMAGE-REVIEW-20261008.json";
const visualReview = { version: "muji-v1", calmBackground: true, cleanComposition: true, faithfulAppearance: true, noPromotionalText: true };
describe("MUJI public image policy", () => {
 it("keeps original supplier bytes and enforces each recorded visual decision", () => {
  expect(review.images).toHaveLength(97);
  for (const entry of review.images) {
   const source = `/products/supplier-demo/${entry.file}`;
   expect(createHash("sha256").update(readFileSync(`public${source}`)).digest("hex")).toBe(entry.sha256);
   expect(reviewedSupplierImage(source)).toBe(entry.decision === "approved" ? source : entry.decision === "approved_crop" ? entry.publicImage : SUPPLIER_IMAGE_PLACEHOLDER);
  }
 });
 it("binds every approved crop to its verified derivative bytes", () => {
  expect(crops).toHaveLength(17);
  for (const crop of crops) {
   expect(createHash("sha256").update(readFileSync(`public${crop.output}`)).digest("hex")).toBe(crop.outputSha256);
   expect(crop.decodedProductPixelsEqual).toBe(true);
   expect(reviewedSupplierImage(crop.source)).toBe(crop.output);
  }
 });
 it("quarantines unreviewed supplier additions", () => {
  expect(reviewedSupplierImage("/products/supplier-demo/new-supplier-photo.webp")).toBe(SUPPLIER_IMAGE_PLACEHOLDER);
  expect(reviewedSupplierImage("/editorial/tea.jpg")).toBe("/editorial/tea.jpg");
 });
 it("requires all four truthful boolean checks for approval, not for return", () => {
  expect(batchActionSchema.safeParse({action:"approve",revision:1,visualReview}).success).toBe(true);
  for (const bad of [undefined, {...visualReview, noPromotionalText:false}, {...visualReview, faithfulAppearance:"true"}, {...visualReview, version:"old"}]) expect(batchActionSchema.safeParse({action:"approve",revision:1,visualReview:bad}).success).toBe(false);
  expect(batchActionSchema.safeParse({action:"reject",revision:1,reason:"Please supply a clean product photo"}).success).toBe(true);
 });
});
