# Broadcasts and MUJI visual review — 8 October 2026

## Delivery

Deployed to https://www.isuntvmall.com with a prominent homepage introduction, a broadcast shelf before the catalogue, `/watch` filtering and individual watch pages. `/admin/broadcasts` edits the introduction and broadcasts. Related broadcasts appear on product pages with a near-purchase jump link. A product can appear in multiple broadcasts; broadcasts can have zero products.

Worker version: `8eac1b9e-54f8-4e90-8b90-0e0c9bfa9e70`. Previous version: `23b0cf7c-0d12-4e30-b8e7-1e30b44e9e55`.

The existing database, roles, MFA and storefront are reused. Managed migrations `20261008105632_muji_visual_review` and `20261008105655_storefront_broadcasts` were applied and read back. Eleven visible records are present: the requested YouTube introduction and all ten supplied Facebook links. The supplied videos have no verified product associations, so none were invented. Facebook titles are neutral numbered labels, and their status defaults to replay; current live status was not independently established. Checkout remains disabled.

## Administration

1. Sign in and complete MFA, then open **Broadcasts** at `/admin/broadcasts`. Super Admin, Admin and Operator use the existing `live.publish` permission. Other roles cannot publish broadcasts.
2. Select the introduction or a broadcast, or create a hidden draft. Supply English, Traditional Chinese, Simplified Chinese and Japanese titles; a YouTube/Facebook URL; an optional clean HTTPS thumbnail; order; live/replay/upcoming status; visibility; and optional approved products.
3. Save. The server validates the source and products, checks current staff authority, and writes a revision with before/after audit evidence. Concurrent edits are rejected: reload before trying again. After a network error with an unknown save result, reload instead of blindly resubmitting.
4. Reload the public homepage, watch page or relevant product page. Content is read from Supabase on request; no build or deployment is needed. Hidden content is excluded from public lists and direct detail URLs. Hiding preserves the record and history.

Only official player URLs are embedded. A persistent external viewing link is shown even when playback fails. Facebook post/general-share links are deliberately link-only. Broken/missing thumbnails use the neutral visual treatment. The system does not restream media, remove provider restrictions, synchronize provider live status, or claim automatic product recognition.

## Image standard

All 97 supplier photographs were reviewed: nine unchanged approvals, seventeen accurate lossless crops and seventy-one neutral placeholders. Every original remains unchanged. The five supplier records that already lacked photography remain placeholders too. Product records are retained. Homepage featured supplier selections use approved imagery only.

See [the visual audit](MUJI-VISUAL-STANDARD-20261008.md), its decision ledger, crop plan and hash ledger. Crops preserve source RGB pixels, packaging, colours and visible product geometry. No filters, synthetic details or invented backgrounds were used. Future batch approval requires four explicit checks bound to the image hash and item revision; the legacy approval RPC cannot bypass them. This is accountable human review, not automatic photographic judgment. Managed pre-release queue inspection found one historical published fixture and no unpublished approvals needing migration.

## Acceptance evidence

| Check | Observed result |
| --- | --- |
| Application tests | 380 passed across 43 files |
| Broadcast database checks | 27 passed using actual migrations in isolated PGlite |
| Batch database checks | 34 workflow, 25 demo and 22 capacity checks passed |
| Existing backend and merchant regression | Passed; merchant script reported 69 checks; no provider transactions |
| Type checking, lint, production Worker build | Passed |
| Managed database | Two migrations present; eleven broadcasts; both new tables have RLS; browser read/write grants denied; checkout admission false |
| Live HTTP | 26 checks passed; six public routes in each of four languages, exact document language, unauthenticated admin denial and missing broadcast 404 |
| Responsive browser | 390px mobile home/watch and 1440px desktop; watch has eleven cards and no horizontal overflow; four language selections verified |
| Watch filters | YouTube: one; Facebook: ten; Facebook live: honest empty state |
| YouTube real playback | Desktop elapsed 56 seconds and mobile-layout elapsed 26 seconds, both showing Pause video, of a 1:07 video |
| Content update without deployment | Through the already authenticated Supabase SQL editor, the production save RPC changed introduction title at revision 2; a public browser reload displayed it. The approved title was restored at revision 3 and read back publicly. No redeployment between saves. This is database-administration evidence, not staff-form acceptance. |
| Signed-in staff form save | NOT_TESTED: store session expired. Owner deferred MFA until tomorrow morning because the authenticator phone is at home. No session or MFA bypass performed. |
| Real product-linked broadcasts | Relationship/rendering covered in isolated tests; no unverified merchandise links added to real supplied videos. Signed-in end-to-end product assignment remains pending. |
| Facebook playback | All eight supplied video-share links returned Video unavailable in the official player. All ten share pages redirected to Facebook login in this browser. Two post/general-share records have no iframe and retain their external link. |

Browser mobile results use a resized Chrome viewport, not a physical iPhone/Android device. Provider availability can vary with region, account, privacy settings and creator embedding permissions.

Reproduce the core checks in the source checkout:

```sh
npm run typecheck
npm run lint
npm run test:run
node scripts/verify-broadcasts.mjs
node batch_helper/verify-workflow.mjs
node batch_helper/verify-demo.mjs
node batch_helper/verify-capacity.mjs
npm run test:backend
npm run build:vinext
```

Private release evidence includes before/after desktop/mobile captures, provider snapshots, managed readbacks, the live title-change/restore receipt, test logs and hash manifests in the owning Studio project's `evidence/broadcast-visual-20261008/`. No credentials are included. The image-specific contact sheets are separately retained in `evidence/muji-audit-20261008/`.

## Exact remaining inputs

- Tomorrow morning, complete owner sign-in/MFA in the open store admin tab to finish the actual form-save and product-assignment acceptance. The server persistence/readback path already passed; this remaining step tests the signed-in UI/authentication boundary.
- For Facebook embedded playback, provide public **video permalinks** copied from each video itself, with embedding allowed. The eight `/share/v/` tokens supplied were `1HmZq19pUq`, `1CL2mRVbts`, `1CU1MQZPav`, `1BD1byygPb`, `19dsmisXur`, `14qYwDNoCxN`, `1A18rJwHSk`, and `16BLWGDnm6F`. They are already saved; replacement canonical links can be entered in admin without a deployment. The `/share/p/1bFAWQmsx8/` and `/share/1F68N2tf7u/` links need actual video URLs if embedded playback is wanted. A URL alone cannot overcome privacy or embedding restrictions.
- The seventy-one quarantined photographs need clean replacement photos before public imagery can be restored through review. Do not relax the standard to fill the grid.

## Release and rollback

Apply the two migrations before publishing this Worker. Seed merchant-specific content through admin; the migrations contain no iSun-specific broadcast seed. Preserve server secrets in existing runtime bindings. Build on Studio, verify portable build/source manifests, deploy the reviewed Worker with existing variables retained, and repeat managed/public checks.

For application rollback, use the preceding Worker version above and verify public routes. Retain the additive broadcast tables and all audit records. Retain the visual approval gate: an older approval UI will intentionally fail until the current review UI is restored. If rollback is necessary, pause merchandise approvals operationally; do not weaken the database gate or delete evidence. Originals and the pre-release source snapshot provide image/source recovery. A provider-only playback restriction is not a reason to roll back the whole store.
