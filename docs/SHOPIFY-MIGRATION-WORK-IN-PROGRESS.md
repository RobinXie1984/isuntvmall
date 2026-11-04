# Shopify migration implementation — work in progress, 2026-11-04

This is not a finished migration and is not deployed. The live release remains the earlier review-only version. The goal is to accept product and inventory exports, preserve source data, stage products and all images privately, enforce the MUJI approval gate, and then handle each selected variant consistently through inventory, cart, checkout and orders.

## Completed locally

- A private, role-checked, retry-safe staging schema and endpoint for product titles, variants, option combinations, source price strings, image references and selected non-financial product and variant attributes. Original source costs are excluded. Data is not automatically added to the public catalogue or approved.
- A parser for Shopify's all-states inventory CSV, matching exact product handles and option positions while retaining separate location/bin observations. Ambiguous, missing or invalid values are not guessed. It is a snapshot, not live inventory or evidence of physical stock.
- Private stage controls in merchandise studio. They depend on the undeployed schema and are not yet ready for staff use. Raw supplier descriptions remain untrusted text.
- The supplied product CSV was processed into an isolated PGlite database: 151 products, 1,200 variants. PGlite is not a concurrent-client production Postgres test.
- Automated tests cover staged role access, replay and conflict, private fields, no live product changes, duplicate inventory matches and endpoint authorization. No live database or Shopify data was changed.

## Candidate implementation and verification, 2026-11-04

The unshipped candidate now creates native drafts with individual variants. Business staff can link images only after the existing MUJI workflow has approved and published the exact image revision; set four-language option labels; record counted stock and a reviewed source price; and explicitly approve a product. Changes are audited. Drafts stay private and unknown or generic HK$19.99 prices stay marked as demo. A source handle already in the bundled SunTVMall catalogue is held for reconciliation instead of creating another listing. This does not yet migrate the existing listing in place.

The candidate associates the selected variant and approved image with the cart; calculates prices on the server; records variant-level holds and immutable order details; and consumes the correct stock only after a verified payment event. Cancellation, expiry, retries and late payment are handled with a review state where appropriate. Variant sales remain explicitly disabled by default and the existing live sales policy is unchanged.

Verification: 575 automated tests passed, including the duplicate-handle check. The isolated database checks passed 47 staging/approval cases, 14 variant reservation/payment cases, and 40 legacy reservation cases. A separate PostgreSQL 17.11 experiment on Studio used two simultaneous connections: one won the last unit and the other was rejected; duplicate payment events reduced stock once. The signed-event integration uses the actual Stripe signature verifier and checkout handler against isolated data, but simulates Stripe's checkout session rather than contacting Stripe. An earlier candidate's mobile and desktop cart was inspected using test data. The Cloudflare build passed. These are not production or real Stripe Sandbox acceptance results.

## Release blockers and remaining work

- Reconcile existing public source handles with database products and design a safe in-place migration before importing those existing products. The guard prevents duplicates; it is not a migration of those listings.
- Complete source-image acquisition into the private review queue, confirm Shopify inventory from a fresh all-states export and avoid assuming physical stock. Actual product prices, images, and counts still require business review.
- Run an actual Stripe Sandbox order, cancellation and webhook/recovery test, exercise the database through Supabase's real API, verify the current candidate on mobile and desktop in four languages, and rehearse database/deployment rollback. The signed sandbox dashboard is available, but this run did not have a retrievable test secret. No real payments were made.
- Confirm the live release sequence, apply and verify the migrations before deploying code that queries the new relationships, and ensure native listings cannot go live with checkout disabled. Keep the current one-fan production payment boundary until separately authorized to expand actual sales.
- The correct Supabase project is not present in the connected Supabase tool's current account. Cloudflare Worker authentication is available; it does not grant database access. Do not infer production verification from the isolated tests.

## Adversarial release review

Verdict: BLOCK. A partial database/code rollout could break product reads because the candidate queries new relationships, while a public variant listing with the checkout feature flag disabled cannot complete purchase. The duplicate-handle guard reduces duplicate publication but intentionally holds existing source items rather than mapping them. A real Sandbox webhook, live Supabase API relationship behavior, rollback after partial migrations, current four-language interface and actual inventory remain unverified. The highest-risk unresolved effects are broken catalogue reads, duplicate listings, charging an unverified item and stock divergence. Release only after the listed checks and an explicit controlled rollout; alert on failed checkouts, webhook review states, and stock mismatches.

## Studio test-environment note

During isolated PostgreSQL setup, npm resolved its prefix to the existing Studio project and added test dependencies to its node_modules; it also removed two optional packages. The two missing packages were restored to the exact versions in the existing lockfile. The added dependencies remain in place to avoid deleting potentially concurrent work. No project source, credential or live data was intentionally changed by that setup. Future isolated test directories must contain their own package.json before installing dependencies.

## Follow-up verification, 4 November 2026

- Verified the correct live Supabase project through its existing signed-in dashboard. Read-only queries found 240 products, including 141 source listings; their sorted id/SKU/slug digest exactly matched the bundled catalogue (`e47deca31db539f04ea24abeb26df07c`). No production schema or merchandise was changed.
- Reconciled the provided Shopify CSV by exact source handle: 141 existing products, 10 new products, no ambiguous source handles. Existing identity is preserved in the report. This is a verified reconciliation plan, not an executed native-checkout cutover.
- Executed all candidate migrations on an isolated native PostgreSQL database, then verified the actual nested product → variant → image query through PostgREST. This closes the local API relationship check; it does not establish live Supabase migration success.
- Used the previously approved Sandbox key privately on iMac, verified the account, and completed an actual Stripe Checkout payment for two synthetic variants: HK$10 + HK$20 = HK$30. The official CLI delivered the provider event to the actual application webhook handler; the order became paid and both variant stocks went from 2 to 1. Replaying the provider event did not decrement again. An earlier Checkout cancellation was confirmed by Stripe and the reservation layer. The temporary key file was removed and the local harness/listener stopped. No live money moved.
- The existing Mall session explicitly reports it has ended. The owner sign-in page is prepared for renewed login/MFA; real staff-screen acceptance awaits that session.

Evidence is under `evidence/20261104-variant-migration`. Remaining release work includes safe in-place cutover of the existing source listings, current four-language browser acceptance, inventory-source reconciliation, migration/rollback rehearsal and final deployment verification. The earlier notes about absent Sandbox key access and untested local PostgREST are superseded by the successful checks above. The release remains blocked on the remaining implementation and verification, not on a lack of general deployment approval.

The follow-up candidate adds exact-match reconciliation information to the private stage list, so staff see an existing SKU instead of attempting a duplicate draft. It deliberately does not silently replace current source listings. 577 tests, type checks and lint passed (one pre-existing unused-variable warning). The review found that stopping npm could leave its Stripe CLI child running; the launcher now starts controlled process groups and terminates those groups. All test processes from this run were confirmed stopped. Release verdict remains BLOCK until existing-product cutover, real staff acceptance and rollback verification are completed. Renewed staff login is needed for that acceptance, but does not by itself complete the outstanding implementation.

## Current status — deployed preparation release

The older unreleased notes above are historical. The deployed result and exact remaining business gates are documented in `SHOPIFY-MIGRATION-RELEASE-20261104.md`. All 151 products / 1,200 variants are now prepared privately in production, preserving existing catalogue data. Existing source drafts are supported. Migration tools and handbook are live; native sales activation and item-by-item stock/price/media approvals remain intentionally pending.
