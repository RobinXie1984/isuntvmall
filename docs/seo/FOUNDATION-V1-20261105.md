# iSunTVMall SEO/GEO Foundation v1 — 5 November 2026

Status: deployed after Robin’s approval. See [production release and actual live checks](PRODUCTION-RELEASE-20261105.md). The candidate results and procedure below remain the preparation record. No SEO ranking, indexing or GEO visibility outcome is claimed.

## Before and after

| Area | Existing production | Tested candidate |
| --- | --- | --- |
| Product editor | Business product drafts, approval, private suppliers and approved images | Same editor plus expandable Search Engine Listing, four language overrides, title/description defaults, editable slug and live search preview |
| Product HTML | Server-rendered content/title/description; no canonical or Product JSON-LD in the inspected page | One absolute title, description, canonical and Open Graph set in the initial HTML head; Product/Offer JSON-LD in server-rendered content |
| URLs | Existing `/product/[slug]` URLs | Existing slugs retained; new generated slugs use product names; approved renames create permanent identity-based aliases and HTTP 301 redirects directly to the latest public slug |
| Discovery | `/sitemap.xml` returned 404; edge-managed robots introduction | Generated sitemap of public indexable URLs, reciprocal translated alternates and application robots rules; private routes also receive noindex headers |
| Price truth | Demo/unverified safeguards and external SunTVMall checkout | Same catalogue and checkout; demo/uncertain amounts omitted from Offer markup; confirmed brand shown only where known |

Shopify's Search engine listing workflow is the UI reference. The implementation uses the existing Next/React server components, vinext/Cloudflare Worker, Supabase products and merchandise draft/publish RPCs. There is no storefront rebuild or extra service.

## Actual URLs

Unchanged live reference: https://www.isuntvmall.com/product/suntv-gtcq-002

Candidate on this iMac:

- http://localhost:8790/admin/products — existing editor with the isolated QA account and disposable fixtures.
- http://localhost:8790/product/suntv-gtcq-002 — exact existing source product, with English metadata.
- http://localhost:8790/product/suntv-gtcq-002?locale=ja — genuine Japanese copy, self-canonical and reciprocal language links.
- http://localhost:8790/product/everyday-stone-cup — synthetic HK$28 acceptance product renamed through the actual editor and approval API. It is not a live offer.
- http://localhost:8790/product/stone-cup — HTTP 301 to the renamed fixture; language and room attribution are preserved.
- http://localhost:8790/sitemap.xml and http://localhost:8790/robots.txt.

The production-built Worker was separately run locally at `http://127.0.0.1:8791` with remote bindings disabled and the same disposable backend. These are local previews, not public deployments. The fixture backend listens only on loopback, uses no real credentials, and does not contact the production database or Stripe.

## Verified results

- 613 application tests pass, including catalogue, cart, checkout, staff permissions and new metadata/redirect/API tests.
- 23 isolated PostgreSQL/PGlite SEO checks pass: creation, name-derived unique slugs, draft isolation, approval, historical URL ownership, static showroom reservations, repeated renames, legacy clients, stale edits, access restrictions, audit history and preservation of price/stock/media identity.
- Existing migration checks: 60 pass. Variant reservation/payment-confirmation checks: 14 pass. Legacy reservation checks: 40 pass. No new real or Sandbox charge was made for this SEO task. PGlite results do not claim independent-connection managed-database contention acceptance.
- Raw HTML: 12 product/language cases, with exactly one title/canonical and one JSON-LD script, plus the renamed URL's 301. Titles, descriptions, canonical and Open Graph are in the initial head, including for a client without JavaScript. Cookie/header spoofing does not change the default product URL's language. Unknown/unpublished products return 404.
- All 17 sitemap URLs from the isolated fixture catalogue return 200 without redirects. Admin, cart, checkout, unpublished and demo products are excluded. Each real translated product version is self-canonical; untranslated fallbacks are noindex and canonicalise to English, without advertising a fictional translation. Arbitrary room/tracking parameters are excluded from canonical URLs. English/invalid/repeated locale parameters are normalised by 301.
- The actual browser editor saved SEO fields, rendered its live preview, approved the revision, and preserved the old link as 301. The cart retained the same product ID and HK$28 line after renaming; checkout remained disabled. Desktop and narrow/mobile layouts and the Japanese language switch were inspected.
- The public source page for `gtcq-002` was read on 5 November: exact option `51611662876915`, HK$376.00, brand `GONG TING CHUAN QI`, matching the candidate's initial visible option and structured data. Availability uses the same source-listing flag as the live catalogue; it is not a promise of physical stock beyond that source snapshot. Native offers use actual approved variant prices/known stock; no demo or unknown price/stock is promoted into an offer.
- Lint passes with one pre-existing unused-variable warning in `scripts/stripe-sandbox/receipt.mjs`; typecheck and Cloudflare/vinext production build pass. No dependency, Stripe, payment flow, access role or catalogue feed changes.

### Google Rich Results Test

The captured initial HTML was submitted in Google's Code mode. Google detected two valid items: one Product snippet and one Merchant listing. The Product has optional `aggregateRating` and `review` warnings; the Merchant listing has optional `shippingDetails` and `hasMerchantReturnPolicy` warnings. These facts were not invented to silence warnings.

Recorded result: https://search.google.com/test/rich-results/result/r%2Fmerchant-listings?id=f5WaVsHnJJmh-vqmhOsrWw

A later full-HTML resubmission after moving metadata into the initial head returned Google's “Something went wrong” service error twice. The JSON-LD bytes are identical to the successful submission, verified directly. Final head placement was independently checked against the production-built local Worker. A public-URL Rich Results Test remains a post-approval deployment check; a Code-mode result is not proof Google can crawl the production URL or will display rich results.

## Changed files

- Existing editor/API: `src/components/admin/merchandise-workspace.tsx`, new `search-engine-listing.tsx`, `src/app/api/admin/merchandise/route.ts` and focused route tests.
- Public output: `src/app/product/[slug]/page.tsx`, `src/lib/seo.ts`, `src/lib/product-redirect.ts`, `src/proxy.ts`, `next.config.ts` and their tests.
- Language/data mapping: `src/lib/locale-server.ts`, `src/components/i18n/locale-provider.tsx`, `src/lib/data/store.ts`, `src/lib/data/source-catalogue.ts`, `src/types/commerce.ts` and a small CSS addition.
- Discovery: `src/app/sitemap.xml/route.ts`, `src/app/robots.txt/route.ts`.
- Additive migration: `supabase/migrations/20261105022415_seo_foundation_v1.sql`.
- Reproducible local verification: `scripts/verify-seo.mjs`, `scripts/verify-seo-http.mjs`, `scripts/seo-preview-fixtures.mjs` and `evidence/seo-foundation-v1-20261105/`.

## Production release and rollback

1. Obtain Robin's approval for the candidate and the SEO migration. Do not merge into the production branch, apply the managed migration or deploy before approval. Retain the current Worker `5f4ae4e2-5a77-466d-8801-79a2016ce997` and source baseline `2f577c6`.
2. Recheck concurrent main/schema changes, the correct Supabase project `fikmqessuraosgoyxede`, Worker account and hashes. Save a bounded read-only commercial-state baseline. Never copy production credentials to this QA fixture or include `.dev.vars` in a release.
3. Deploy the reviewed application first. It tolerates the not-yet-created alias table, and hides SEO controls until the migration exposes them. Other database errors fail visibly. Existing product fields and links remain operational.
4. Apply the reviewed migration transactionally using the existing approved managed-database path. It retains all product IDs/slugs, adds SEO/brand fields, reserves current/historical/showroom slugs, and wraps the existing business RPCs. Legacy product payloads remain compatible; existing actor checks, locks, draft revisions, approvals, media gates and audit history are reused. It grants no browser table/RPC access. Run managed advisors and bounded readback after applying.
5. Verify actual production raw HTML in all four languages, metadata head placement and single canonical; compare product price/stock/image/order digests. Check real sitemap entries with a bounded URL crawl and confirm Cloudflare's managed robots layer preserves the generated rules. Check private endpoint denial and staff draft/publish permissions. Repeat Google's public-URL test after release.
6. Before any slug has been changed, the retained previous Worker is a safe application rollback; additive columns and alias history can remain. **After approved slug changes, an old Worker without alias support would lose those redirects.** Inspect the SEO audit before rollback; retain the new resolver in a forward fix rather than blindly reverting or restoring commercial data. Do not delete aliases, undo colleague revisions or reverse stock/payment history.

## Reproduce locally

Use the existing tested project dependency environment. No production credentials are needed. Start `node scripts/seo-preview-fixtures.mjs`, supply the clearly synthetic localhost values described in that script to a local-only `.dev.vars`, and run vinext on port 8790. Visit `http://localhost:8890/__qa/login` for the isolated QA session. Run `node scripts/verify-seo.mjs` and `node scripts/verify-seo-http.mjs` for database and HTTP checks. To test the production build, use `npm run build:vinext`, then Wrangler local mode with remote bindings disabled and the fake fixture settings. The fixture identity/session represents no real colleague or production authenticator.

This foundation improves machine-readable access and consistency. Indexing, rankings, rich-result display and AI citation/recommendation remain unmeasured outcomes.
