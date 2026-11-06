# iSunTVMall

## Batch import — 6 November 2026

The product-import entry follows the observed SunTVMall Shopify sequence: **Products → Import → choose/replace file → Upload file → preview → Import products → results**. The same dialog is available from Batch import. It accepts Shopify-format CSV or Excel `.xlsx` (first worksheet), validates before confirmation, and creates private review drafts with a stable retry receipt. No internal collection name is required. The preview includes product/SKU/image-reference counts, first-product fields and variant source prices. Back/Cancel do not import anything.

Existing staging/reconciliation, variants and the MUJI worker are reused. Supported Shopify-hosted image references are queued into private image preparation after confirmation; unsupported URLs and conflicts require attention. Originals remain private and publication requires the existing review/approval. New products retain demo-price and unknown-stock safeguards. Existing public listings and colleague edits are preserved. Merchandise Admin prepares the data/photos; Business Super Admin handles formal photo review and final approval. The working instructions are at `/admin/help#batch-import`.

Reference walkthrough and acceptance scope: [Shopify parity record](docs/admin-import/20261106-SHOPIFY-PARITY.md). The Shopify reference was inspected without completing an import or changing that store. Release/test results are recorded separately after verification.

A livestream commerce showroom with independent host rooms, per-room product selections, and a shared shopping bag that retains each line's host and stream context.

**Current release: SEO/GEO Foundation v1 (5 November 2026), retaining the Shopify migration and merchandise-review workflow.** See the [production release and live verification](docs/seo/PRODUCTION-RELEASE-20261105.md). Existing SunTVMall listings retain their current checkout. Imported native variants remain inactive, demo-priced and stock-unknown until verified business review; native sales activation remains disabled. The separately authorized one-fan Stripe pilot is retained. See the [migration release](docs/SHOPIFY-MIGRATION-RELEASE-20261104.md), [current review preparation](docs/SHOPIFY-REVIEW-PREPARATION-20261104.md) and [fan payment boundary](docs/stripe/FAN-COLLECTION-PILOT.md). The dated sections below retain historical implementation notes and are superseded by these release records.

The reusable template now includes validated brand profiles, inventory adjustments, guarded Stripe refund/reconciliation operations and a disabled chain-specific USDT receiving template. Start with the [acceptance record](docs/white-label-v1/ACCEPTANCE.md), [configuration](docs/white-label-v1/CONFIGURATION.md), [handoff and service scope](docs/white-label-v1/HANDOFF.md), and [release/rollback SOP](docs/white-label-v1/RELEASE-AND-ROLLBACK.md). iSunTVMall is the first demo; a confirmed customer and its independent database/payment setup are deferred.

## 5 November 2026 — SEO/GEO Foundation v1 deployed

The existing merchandise editor, product server rendering and approval workflow now have a tested SEO candidate: editable four-language metadata, name-derived slugs, permanent historical URL redirects, honest Product/Offer markup, canonical/hreflang, sitemap and robots controls. Deployed after Robin’s approval. All 309 live sitemap URLs return 200, Google’s real URL test detects two valid items, and commercial checksums are unchanged. See [the actual production report](docs/seo/PRODUCTION-RELEASE-20261105.md) and [implementation/rollback procedure](docs/seo/FOUNDATION-V1-20261105.md). No search ranking or GEO outcome is claimed.

## 5 November 2026 — final staff admin acceptance

The final signed-in owner-browser check is complete. Valerie and Xinyang have active, email-confirmed accounts with verified authenticators; their actual backend memberships pass the read boundaries and Finance is denied. The variant workspace, one-location stock preview, private image pagination, demo-price safeguards and in-admin manuals are verified. Sixty focused role/workflow tests pass. See [final acceptance and colleague starting points](docs/ADMIN-ACCEPTANCE-20261105.md). Merchandise approvals remain with the colleagues; no stock, prices, images, access or payments were changed. Existing deployed application code is unchanged, so this documentation update needs no runtime redeployment.

## 4 November 2026 — current migration review follow-up

The deployed native preparation release supersedes the historical gaps below: see [migration release](docs/SHOPIFY-MIGRATION-RELEASE-20261104.md). The current follow-up adds private source-price/translation preparation, product-specific MUJI review links and review filters. See [review preparation, staff steps and access status](docs/SHOPIFY-REVIEW-PREPARATION-20261104.md). Source-listed proposals never approve prices or images. All-states inventory is a separate export; missing or malformed counts remain unknown. Native sales activation is still held.

## Historical note — early 4 November 2026 migration data review

The Shopify preview also groups and displays each product’s variant SKUs, option values, source prices, image count and supplied stock quantities. Missing stock is shown as unknown, not zero. “Save review file” exports a local JSON review package containing each original CSV record and all fields, variant rows and image references; the file may contain confidential supplier costs or other private source data. This package is not a database import and does not authorize publication. The supplied `suntvmall_products_export_1.csv` contains no variant quantity column; separate verified inventory data is needed to migrate its stock.

**Earlier gap, superseded by the deployed migration release above:** At that stage the platform had no general native product-variant inventory, variant-aware cart, reservation or settlement implementation. Multi-variant products and their photos cannot yet be migrated or sold as native Mall products. The single-variant preparation path below is unchanged. Do not deploy or advertise the review package as a completed Shopify migration.

## Historical note — early 4 November 2026 single-image CSV preparation

Merchandise staff can preview a Shopify product CSV locally in `/admin/batches`. Both the current Shopify export headings (`Handle`, `Variant SKU`, `Variant Price`, `Image Src`) and the newer product-template headings (`URL handle`, `SKU`, `Price`, `Product image URL`) are recognized. Rows are grouped by product handle; the preview reports product, variant and image counts and clearly identifies unsupported or ambiguous products. No CSV or remote image URL is sent or fetched merely to preview it.

The current private batch engine can prepare **one chosen primary image per new single-variant product**, using an exactly matching local JPEG/PNG/WebP filename. It does not import multiple variants, additional photos, source descriptions, categories, inventory, tax, shipping, supplier or publication status. A SKU must satisfy the existing ASCII SKU contract. Conflicting filenames or SKUs are held. The CSV remains on the operator's device; preserve it separately. Enter complete English and Traditional Chinese product details and review category, source data and stock before requesting approval. New imported values are deliberately marked demo, stock is zero, and the unverified generic HK$19.99 price remains HK$999.99 as a demo price. Existing SKUs are not overwritten. Review original and processed images under the existing MUJI checklist; approval remains restricted to authorized staff. Photo URLs are not downloaded or published automatically.

Testing against the three locally supplied SunTVMall files found 151 products in the full export: 62 eligible for the single-image preparation path, 55 multi-variant products held and 34 held for incompatible SKU values. These are preview counts, not imports. Native multi-variant product and inventory import, additional images per new product, and full Shopify field fidelity remain future work. Do not interpret the older dated paragraphs below as current live-payment status; the one-item live pilot was completed and new checkout remains held, as described in `docs/stripe/FAN-COLLECTION-PILOT.md`.

## Experience

- Multiple creator rooms, each with its own featured products.
- YouTube player example; explicit provider-aware Facebook/Instagram viewing boundaries.
- Persistent bag across rooms with per-line attribution and in-room review that keeps the player mounted.
- Reservation-backed checkout with frozen order snapshots, stable retry IDs, server-verified Turnstile, trusted edge-IP HMAC scope and atomic client/store quotas; real checkout remains disabled pending acceptance.
- Optional inventory-expiry maintenance in the existing worker, disabled by default; no inventory-expiry schedule is enabled.
- Approved product catalog, private merchandise batches, and versioned host/session administration.
- Seven named staff roles (including Admin and CSR), privileged MFA, immediate membership checks and session revocation.
- Assigned support/fulfillment queues, payment-separated shipping, refund review and scoped aggregate reports.
- Four-language English, Traditional Chinese, Simplified Chinese and Japanese interface and responsive customer pages.

## Styles and merchandise preparation

Explore `/styles` for six independent design directions. The live storefront remains **muji**. Reusable tokens, image recipes and guidance live in `style/{muji,apple,amazon,openai,daks-burberry,hermes-valentino}`.

`/batch-helper` is a labeled workflow preview. The separate [batch helper](batch_helper/README.md) contains an executable image processor, resumable worker and migration-backed approval workflow. Each batch accepts up to 1,000 images, one image per new product. Images are normalized without cropping or changing product details. English and Traditional Chinese merchandise copy is required before approval.

**Online batch mode is enabled as of 26 September 2026.** The managed database and named owner account are connected, owner sign-in and TOTP MFA are confirmed, and one explicit demo item completed authenticated upload, review and approval, with normalization/publication performed by bounded manual worker passes. Its original/processed images denied unsigned public access; the published derivative matched the approved hash. The catalogue now contains 97 demo products, including this zero-stock workflow fixture, and no orders were created. This bounded proof does not establish thousand-image throughput or ordinary authenticated-user storage isolation. The named image worker is now scheduled every minute; two automatic idle cycles passed with no data changes. This verifies idle scheduling, not a nonempty scheduled workload or restart recovery. Inventory-expiry maintenance remains disabled and checkout stays closed. Shared-password access is retired; legacy direct product/import/upload writes are permanently closed.

See the [backend plan and role recommendations](docs/BACKEND-PLAN.md) for customer/admin flows, data model, provider boundaries and the controlled pilot plan.

## Stack

Next.js / React source with a vinext adapter for Cloudflare Workers. PostgreSQL/Supabase schema and Stripe integration are retained for future commerce activation. No database or payment credentials are bundled. Public preview works with clearly marked sample data.

## Develop and verify

Use Node 22.12+ or a current supported Node release.

```sh
npm ci
npm run lint
npm run typecheck
npm run test:run
npm run test:reservations
npm run test:backend
npm run build
npm run build:vinext
npm run start:vinext
```

The original Next development path remains `npm run dev`. Worker preview is `npm run start:vinext`. Configure deployment account/hostname in `wrangler.jsonc` for your own environment. Authenticate using official Wrangler OAuth; never commit credentials.

## Configuration

See `.env.example`. Server-only database/admin/payment secrets must remain in a secret store or local untracked environment. Missing configuration disables protected operations. The server-side release gate requires a merchant profile, complete supplied policies, matching origin/account/mode, abuse protection and explicit release approval. The default demo stays closed even if credentials are present. Refund execution has its own disabled-by-default gate; settlement of existing orders is independent of new-sales admission.

Do not point this at a production database or enable payment processing without completing the release gates below.

## Before real commerce

1. Approve the merchant catalog, actual inventory, host identities and authorized stream URLs.
2. Maintain the verified database/migration configuration and owner access; provision and test additional named operator scopes appropriate to the launch.
3. Verify the implemented stock reservation, expiration/release and idempotent fulfillment paths on the actual managed PostgreSQL deployment, including overlapping transactions from independent connections. The included PGlite checks execute actual migrations. The 25 September checks record 170 application tests, 36 admission SQL checks, and 15 native PostgreSQL 17.11 assertions across nine contention scenarios with eight connections each; none proves managed production behavior. Activate and verify the implemented Turnstile, trusted edge-IP HMAC and owner-approved atomic admission limits before exposing inventory holds publicly. Verify the opt-in expiry worker schedule and actual database statement/lock timeouts.
4. Verify hosted checkout, exact amount/currency binding, signed webhook replay, cancellation, refunds and retry behavior using the provider's test environment.
5. Provide actual shipping, refund, privacy and contact policies; verify regional payment and fulfillment settings.
6. Run desktop/mobile and deployed-origin player checks. Facebook/Instagram capability depends on supported provider behavior and authorized accounts; embedding, comment ordering and simulcasting are separate integrations.
7. Enable the reviewed merchant-specific release configuration only after the evidence above passes; no application-source edit is required to select a new brand or enable an accepted merchant deployment.

The named KOL workflow supports own-room drafts, requests, approved product pins and own aggregate results in source. The owner account is verified; separate KOL account/scoping and actual provider playback tests remain pending. Payouts, multi-merchant settlement, automatic comment ordering and native media broadcasting are outside this release. Refund approval records a decision; separate Super Admin execution uses a durable command, verified provider reconciliation and an explicit confirmation. Its adapter and SQL are tested with isolated fixtures, but actual provider operations remain untested and disabled. Refunds never automatically restock inventory. Settings retain read-only connection readiness and now let the named MFA-verified owner edit audited checkout admission limits. Admission defaults to disabled; saving or enabling it alone never releases checkout. No merchant policies are invented or published. Managed Supabase connectivity, migrations, owner MFA and the one-item batch workflow are verified; remaining scoped-access/recovery tests, real Turnstile/widget and payment activation remain unverified; see [commerce readiness](docs/COMMERCE-READINESS.md).

## Source boundaries

This repository contains application source and synthetic examples only. SHOPLINE served as a workflow reference; this application does not depend on private SHOPLINE admin APIs. No private business archive, customer export, account credentials or third-party stream ownership is conveyed by this source release.

## 2026-11-04: Shopify migration continuation

A private staging and inventory-snapshot candidate is under development; it is not deployed or a complete import. See [work in progress](docs/SHOPIFY-MIGRATION-WORK-IN-PROGRESS.md) for verified coverage and outstanding work. The existing MUJI approval gate and checkout hold remain unchanged.

The current native-variant draft candidate remains incomplete and undeployed. Variant checkout is intentionally refused; see the migration work-in-progress record before attempting release.

### Shopify migration candidate (4 November 2026)

The in-progress variant, approved-image and reservation work is documented in [the migration status](docs/SHOPIFY-MIGRATION-WORK-IN-PROGRESS.md). It has not been deployed; variant checkout remains disabled pending the release checks described there.

Follow-up acceptance on 4 November: exact-handle reconciliation found 141 existing products and 10 new items. An isolated mixed-variant Stripe test payment for HK$30, cancellation, signed payment confirmation, correct stock consumption and duplicate-event replay passed. Evidence is in `evidence/20261104-variant-migration`. Production cutover remains pending; see the migration status for remaining work.

## 4 November 2026 — deployed migration workflow

The migration workspace and handbook are live at `/admin/batches` and `/admin/help#shopify-migration`. The supplied Shopify export was staged through the real Business Super Admin session. All 151 products and 1,200 variants are prepared privately: 141 retain their existing product identities and 10 are new drafts. The 240 original product records, 173 images and existing order were preserved; their catalogue checksum matched before and after preparation. Source drafts remain drafts. Multiple originals can be added to a product using its MUJI image-review link; only reviewed published outputs can be associated with a variant.

The supplied product CSV has no inventory quantities. All 1,200 new variant records therefore retain unknown stock, inactive status and demo HK$999.99 until business review. Source prices, options, image references and supported source attributes are retained privately. The inventory CSV parser accepts Shopify's separate all-states export and retains exact option/location observations; it does not invent stock or automatically approve prices or photos.

The existing checkout handoff remains active. Native variant Checkout, reservations, signed payment confirmation, cancellation and recovery are implemented and tested with real Stripe Sandbox Checkout against an isolated database. Native publishing remains disabled until a separate production sales activation; no new real charge was made. The latest tested Worker is recorded in `docs/SHOPIFY-MIGRATION-RELEASE-20261104.md`.

## 5 November 2026 — daily merchandise intake

Batch import now separates product spreadsheets from photo uploads. Shopify-format CSV and Excel `.xlsx` (first worksheet, 2 MB, 500 products/10,000 rows) use the existing private staging and variant-draft services automatically. Images are added from each draft; MUJI review, demo price/stock safeguards, publication permissions and checkout remain unchanged. Same operator, name and payload produce the same import receipt for safe retries. Failed products have individual results and completed drafts retain their edits. The existing legacy CSV templates remain available; the new intake template is `public/batch-product-template.csv`.

Advanced saved Shopify stages are visible and readable only by system or Business Super Admins. Merchandise staff retain ordinary private import and product/media preparation rights. Small admin/batch typography increases by 2px. Practical instructions are in `/admin/help#batch-import`; diagnosis and release evidence are in `docs/admin-import/`.

Verified production results and rollback: [5 November merchandise intake release](docs/admin-import/20261105-RELEASE.md). The live Excel/retry/photo checks succeeded; existing merchandise, payment state and colleague permissions were preserved.
