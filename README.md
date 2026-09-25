# iSunTVMall

A livestream commerce showroom with independent host rooms, per-room product selections, and a shared shopping bag that retains each line's host and stream context.

**Current release: preview.** Hosts, catalog and stock are illustrative. This version accepts no orders or payments. A server-side release gate prevents payment-session creation even if payment credentials are supplied.

## Experience

- Multiple creator rooms, each with its own featured products.
- YouTube player example; explicit provider-aware Facebook/Instagram viewing boundaries.
- Persistent bag across rooms with per-line attribution and in-room review that keeps the player mounted.
- Reservation-backed checkout implementation with frozen order snapshots, stable retry IDs, expiration and manual-review payment exceptions; real checkout remains disabled pending acceptance.
- Approved product catalog, private merchandise batches, and versioned host/session administration.
- Six named staff roles, privileged MFA, immediate membership checks and session revocation.
- Assigned support/fulfillment queues, payment-separated shipping, refund review and scoped aggregate reports.
- Bilingual English/Chinese interface and responsive customer pages.

## Styles and merchandise preparation

Explore `/styles` for six independent design directions. The live storefront remains **muji**. Reusable tokens, image recipes and guidance live in `style/{muji,apple,amazon,openai,daks-burberry,hermes-valentino}`.

`/batch-helper` is a labeled workflow preview. The separate [batch helper](batch_helper/README.md) contains an executable image processor, resumable worker and migration-backed approval workflow. Each batch accepts up to 1,000 images, one image per new product. Images are normalized without cropping or changing product details. English and Traditional Chinese merchandise copy is required before approval.

Named-user team access, private storage, revision-bound super-admin approval and publication exist in source but **online batch mode remains disabled**. Durable aggregate intake limits are implemented. Provisioning, storage-policy checks and an authenticated end-to-end test are required before activation. No staff accounts or database project are assumed by this release. Shared-password access is retired; legacy product/import/upload write routes are permanently closed.

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

See `.env.example`. Server-only database/admin/payment secrets must remain in a secret store or local untracked environment. Missing configuration disables protected operations. The preview release gate is deliberately implemented in code, not an environment toggle.

Do not point this at a production database or enable payment processing without completing the release gates below.

## Before real commerce

1. Approve the merchant catalog, actual inventory, host identities and authorized stream URLs.
2. Provision a dedicated database, apply and verify migrations, and provision individual operator access appropriate to the launch scope.
3. Verify the implemented stock reservation, expiration/release and idempotent fulfillment paths on the actual managed PostgreSQL deployment, including overlapping transactions from independent connections. The included PGlite checks execute actual migrations. A separate local PostgreSQL 17.11 run passed five contention scenarios with eight connections each; it does not prove managed production behavior. Add checkout abuse controls before exposing inventory holds publicly.
4. Verify hosted checkout, exact amount/currency binding, signed webhook replay, cancellation, refunds and retry behavior using the provider's test environment.
5. Provide actual shipping, refund, privacy and contact policies; verify regional payment and fulfillment settings.
6. Run desktop/mobile and deployed-origin player checks. Facebook/Instagram capability depends on supported provider behavior and authorized accounts; embedding, comment ordering and simulcasting are separate integrations.
7. Review and intentionally remove the code-level payment hold only after the evidence above passes.

The named KOL workflow supports own-room drafts, requests, approved product pins and own aggregate results in source. Its production account and provider tests remain pending. Payouts, multi-merchant settlement, automatic comment ordering and native media broadcasting are outside this release. Refund approval records a decision; it does not execute a payment or restock inventory. Settings currently display readiness only; no merchant policies are invented or published.

## Source boundaries

This repository contains application source and synthetic examples only. SHOPLINE served as a workflow reference; this application does not depend on private SHOPLINE admin APIs. No private business archive, customer export, account credentials or third-party stream ownership is conveyed by this source release.
