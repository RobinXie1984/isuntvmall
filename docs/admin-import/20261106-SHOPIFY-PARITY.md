# Shopify batch-import parity — 6 November 2026

## Observed reference and scope

Read-only native Chrome walkthrough of the signed-in SunTVMall Shopify store (`anf39x-ga`): Products → Import → choose CSV → selected file and replacement/options → Upload file → Preview your first product → Import products. The preview showed product/SKU/image counts, title, description, status, category, type, vendor and a variant table (variant, SKU, weight, price). A named synthetic one-product/two-variant CSV was uploaded only for validation; the final preview was cancelled. Shopify's final import/progress was **NOT_TESTED**: no Shopify catalogue mutation was authorized or performed. Private screenshots 01–04 are retained with the run evidence, outside GitHub.

The iSunTVMall change reuses private staging, native draft/reconciliation, variants and the existing MUJI batch worker. It changes daily import entry and sequence, not the storefront or payments. CSV and existing Excel support remain. Only final confirmation may create private records. Preview/back/cancel must not mutate the server.

## Mechanism and invariants (first principles)

Fact: the current Mall combines spreadsheet selection, count preview and import on one workspace, with a mandatory collection name. Shopify separates file selection, review and final confirmation. This explains the operator's sequence mismatch; another importer or a redesigned storefront would not address that cause. The smallest correction is a shared import dialog entered from Products, with the observed stages and existing APIs behind its final button. A deterministic file/operator receipt keeps retries safe. Per-product results must distinguish completion, held conflicts and failures, retaining links and backend reasons.

Product/image publication remains an independent business decision. Imported prices and stock are source observations, not verification. MUJI preparation never constitutes approval. Existing listings, colleague edits, stock, IDs, images, order/payment records and access remain unchanged. Shopify overwrite/publish options cannot bypass these invariants; their safe fixed policy must be visible before confirmation. CSV-hosted images are admitted into the existing private review queue only after product confirmation, with bounded downloads and no public image replacement. A URL reference is not evidence of a successful image import.

## Acceptance boundaries

- Products → Import and Batch import use the same file → upload/validate → preview → confirm → results flow; no required internal batch name.
- CSV/Excel multi-variant preview shows source product fields and exact source prices as unapproved reference data; invalid headings/duplicates/limits block confirmation with useful messages.
- Cancel/back/replace cause no import mutation. Double click/retry/reopen use the same receipt; existing edits are retained and conflicts remain held.
- Valid hosted supplier photos enter private MUJI preparation automatically; originals retained; unsupported or failed URLs are reported without publication. Existing local-photo path remains usable.
- Merchandise Admin can prepare; Business Super Admin performs MUJI/final business approval; finance/no-access roles denied by backend. Owner-only migration tools remain restricted.
- Desktop and narrow viewport, four languages, existing catalog/cart/checkout/SEO regressions, queue recovery and backend permission checks pass before deployment. Rollback retains all business rows and secrets.

Implementation and live test outcomes will be appended after verification. No success claim is implied by this plan.
