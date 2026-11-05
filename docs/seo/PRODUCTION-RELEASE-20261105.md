# SEO/GEO Foundation v1 — production release, 5 November 2026

Deployed after Robin's explicit approval. Current Cloudflare Worker: `1dbddd99-07ae-45fc-a21f-5c3d155d07a2` (100% traffic). Runtime source: `bc652d1`, comprising approved candidate `ba02e29` plus a small verified legacy-draft compatibility fix. Managed migration `20261105022415` is recorded and its schema is live.

## Live links

- [Product editor](https://www.isuntvmall.com/admin/products): expand a product, then **Search Engine Listing**. Choose the SEO language, edit title/description/slug, and inspect the preview. Blank metadata uses the product copy. Save a draft; an authorised publisher approves the saved revision. Name changes do not silently change established URLs.
- [English product](https://www.isuntvmall.com/product/suntv-gtcq-002) · [Japanese version](https://www.isuntvmall.com/product/suntv-gtcq-002?locale=ja).
- [Sitemap](https://www.isuntvmall.com/sitemap.xml) · [Robots](https://www.isuntvmall.com/robots.txt).
- [Permanent redirect proof](https://www.isuntvmall.com/product/seo-foundation-check-20261105): HTTP 301 to the existing `stoneware-mug` demo page. It is not a new merchandise listing. The target is noindex and has no Offer markup. Locale and room attribution survive the redirect.
- [Google's live URL result](https://search.google.com/test/rich-results/result?id=SYGw5c5HwZK9ESt0VkFO9Q).

## Before / after

| Before | Production now |
| --- | --- |
| No product canonical or Product JSON-LD on the inspected page; sitemap returned 404 | Metadata is in the initial HTML head; Product/Offer JSON-LD and visible product copy are server rendered. Sitemap and robots return 200. |
| Existing merchandise draft and approval workflow | Same workflow, with editable four-language SEO overrides, sensible defaults, live search preview and slug conflict errors. |
| Slugs without historical redirect storage | All 250 existing slugs retained; new products receive name-derived unique slugs. Approved renames reserve historical URLs and resolve directly to the current product identity with 301. |
| Demo/unverified price safeguards | Preserved. Uncertain/demo prices are omitted from Offer markup; known source brands are reused and unknown brands are omitted. |

## Actual acceptance evidence

- **614 application tests pass**, plus lint/typecheck and the production Cloudflare build. One pre-existing unused-variable lint warning remains in the older Stripe Sandbox receipt script.
- **137 isolated database regression checks pass**: 23 SEO, 60 Shopify migration, 14 variant checkout and 40 legacy reservation checks. No new live or Sandbox charge was made during this SEO release.
- The reviewed build was deployed app-first. The existing product page returned 200 with canonical/JSON-LD before the schema update. The transactional migration then completed with **250 products and 352 reserved URLs**; no existing product slug changed.
- Production database tests used temporary synthetic product/image rows in a transaction: name-derived creation, draft SEO isolation, Merchandise Admin save, denial of Merchandise Admin publication, Finance write denial, Business Super Admin publication, repeated slug changes, historical URL collision protection, audit records and browser-role access restrictions all passed. The transaction was rolled back. A single named proof alias was then retained for the existing demo, bringing alias count to 353.
- **All 309 live sitemap URLs return HTTP 200**, without redirects. Each product entry has one self-canonical in its initial head; private routes, unpublished and demo merchandise are excluded. Eight representative product/language pages were additionally inspected in raw HTML. Unknown products return 404; unauthenticated merchandise/media APIs return 401; admin/login and cart carry noindex headers. The generated robots directives survive the Cloudflare edge.
- The exact tableware option initially displayed is **HK$376.00**, brand **GONG TING CHUAN QI**, matching the existing catalogue/source record and its Offer. The uncertain nutrition example still displays **demo HK$999.99** and emits no Offer. Availability follows the same catalogue source flag or known native stock as the page; no physical-stock promise beyond that evidence is made.
- Live desktop rendering and Japanese mobile rendering were inspected. At 390px, document width remained 390px, with the expected language, title, price and option controls. Browser language and temporary viewport were restored.
- **Google crawled the real public URL successfully at 12:51:31 p.m. HKT** and detected **two valid items**: Product snippet and Merchant listing. This supersedes the candidate's Code-mode-only verification and subsequent Google service errors. Optional warnings remain for reviews/ratings, shipping details and merchant return policy; none was invented to silence them.

### Business-data preservation

Canonical Studio before/after checksums match across products (excluding the newly added empty SEO/brand columns), public images, native variants, orders, order items, staff memberships and media review items. Counts remain **250 products, 173 images, 1,200 variants, one order and nine staff memberships**. Existing catalogue data, stock, photos, colleague edits, permissions and order/payment state were preserved. Native sales/payment controls were not enabled or changed. No secret was created, exposed or copied.

Ten older draft products had null Chinese-copy fields. The existing editor displays those as blank, but its save contract expects strings. The compatibility fix normalises those two fields to empty strings in the authorised editor response, with a focused regression test. It does not mutate stored product data or loosen validation/access.

### Managed advisors

Supabase Health Advisor: zero errors/warnings. Security Advisor, refreshed after migration: zero errors, four warnings and 49 informational suggestions. The warnings concern the existing provider `public.rls_auto_enable()` execution grants, the previously owner-approved long authentication-link expiry and disabled leaked-password protection. SEO did not alter those objects/settings. Performance Advisor: zero errors/warnings, 68 informational suggestions. These are observed advisory results, not an exhaustive security audit.

## Scope and remaining limits

The storefront was reused. The [implementation report](FOUNDATION-V1-20261105.md) lists the changed files and release/rollback sequence. The production browser workflow was not performed by signing in as a colleague: the full editor flow was tested in the isolated browser candidate, and real production RPCs/roles were verified transactionally without creating colleague sessions.

There is no functional release blocker from these checks. Optional structured-data fields need genuine business/review data before they can be supplied. Indexing, ranking, rich-result appearance and AI/GEO citation outcomes remain unmeasured. Google validating the page does not establish those outcomes.

Rollback: retain additive schema and URL history. After any approved slug change, do not blindly revert to the pre-SEO Worker because it lacks alias resolution; retain the resolver in a forward fix. Never undo colleague revisions, stock, orders or payments to roll back presentation code. Previous production Worker `5f4ae4e2-5a77-466d-8801-79a2016ce997` and the approved candidate archives remain retained.

Public evidence: `evidence/seo-production-20261105/`. Canonical private receipts: `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261105-seo-production-release`, including reviewed SQL, rollback-test SQL, before/after hashes and the final source/build archive.
