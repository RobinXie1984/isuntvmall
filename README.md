# iSunTVMall

A livestream commerce showroom with independent host rooms, per-room product selections, and a shared shopping bag that retains each line's host and stream context.

**Current release: broadcasts and MUJI visual review (8 October 2026), on the white-label V1 demonstration.** Hosts, catalog and stock are illustrative. This version accepts no orders or payments. A server-side release gate prevents payment-session creation even if payment credentials are supplied. See the [release evidence, admin instructions and remaining playback/access checks](docs/BROADCASTS-AND-VISUAL-RELEASE-20261008.md).

The reusable template now includes validated brand profiles, inventory adjustments, guarded Stripe refund/reconciliation operations and a disabled chain-specific USDT receiving template. Start with the [acceptance record](docs/white-label-v1/ACCEPTANCE.md), [configuration](docs/white-label-v1/CONFIGURATION.md), [handoff and service scope](docs/white-label-v1/HANDOFF.md), and [release/rollback SOP](docs/white-label-v1/RELEASE-AND-ROLLBACK.md). iSunTVMall is the first demo; a confirmed customer and its independent database/payment setup are deferred.

## 4 November 2026 — migration data review

The Shopify preview also groups and displays each product’s variant SKUs, option values, source prices, image count and supplied stock quantities. Missing stock is shown as unknown, not zero. “Save review file” exports a local JSON review package containing each original CSV record and all fields, variant rows and image references; the file may contain confidential supplier costs or other private source data. This package is not a database import and does not authorize publication. The supplied `suntvmall_products_export_1.csv` contains no variant quantity column; separate verified inventory data is needed to migrate its stock.

**Remaining gap:** The platform still has no general native product-variant inventory, variant-aware cart, reservation or settlement implementation. Multi-variant products and their photos cannot yet be migrated or sold as native Mall products. The single-variant preparation path below is unchanged. Do not deploy or advertise the review package as a completed Shopify migration.

## 4 November 2026 — Shopify CSV preparation

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
