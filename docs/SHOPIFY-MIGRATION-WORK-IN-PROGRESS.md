# Shopify migration implementation — work in progress, 2026-11-04

This is not a finished migration and is not deployed. The live release remains the earlier review-only version. The goal is to accept product and inventory exports, preserve source data, stage products and all images privately, enforce the MUJI approval gate, and then handle each selected variant consistently through inventory, cart, checkout and orders.

## Completed locally

- A private, role-checked, retry-safe staging schema and endpoint for product titles, variants, option combinations, source price strings, image references and selected non-financial product and variant attributes. Original source costs are excluded. Data is not automatically added to the public catalogue or approved.
- A parser for Shopify's all-states inventory CSV, matching exact product handles and option positions while retaining separate location/bin observations. Ambiguous, missing or invalid values are not guessed. It is a snapshot, not live inventory or evidence of physical stock.
- Private stage controls in merchandise studio. They depend on the undeployed schema and are not yet ready for staff use. Raw supplier descriptions remain untrusted text.
- The supplied product CSV was processed into an isolated PGlite database: 151 products, 1,200 variants. PGlite is not a concurrent-client production Postgres test.
- Automated tests cover staged role access, replay and conflict, private fields, no live product changes, duplicate inventory matches and endpoint authorization. No live database or Shopify data was changed.

## Required before completion

1. Add safe resumable promotion from staged products to native drafts, with stable variant identity, per-variant stock, revision checks, conflict handling and source price review; preserve existing colleague edits and ensure no unverified price becomes real.
2. Connect multiple image originals and approved outputs to products and variants using the existing private MUJI batch review with separate human approval. Do not auto-approve, fetch arbitrary private URLs or replace existing approved media.
3. Complete admin editing and promotion of staged product fields and inventory; unknown stock remains unknown. Verify rights and auditing for each business role.
4. Extend product display, cart, reservations, checkout, immutable order item snapshots, payment confirmation and releases to use variant identity and correct per-variant price and stock. Keep production checkout on its existing hold unless independently authorized for an expanded sales scope.
5. Obtain a fresh Shopify inventory export using the inventory screen, identify location/variant conflicts and verify available physical stock before sale. The product CSV supplied by Robin has no inventory quantity column. Shopify's dashboard offers a separate all-states export.
6. Test retries, role denial, mobile and desktop, four languages, concurrent reservations on real Postgres, and payment events in Stripe test mode. Conduct independent adversarial review, rehearse rollback, deploy only verified components, and verify the actual live release.

The connected Supabase tool currently lists a different organization; the correct iSunTVMall dashboard is accessible in Chrome. No new credentials or infrastructure are required merely to continue local implementation.

## Follow-on draft foundation

A second, unshipped migration creates native variant draft records and a role-checked draft creation path. It rejects existing source-product SKU collisions, refuses a later source batch for an already-created handle, and prevents publication of these drafts. New variants have unknown stock, inactive status and a clearly marked HK$999.99 placeholder. A revision-checked audited operation records a human-entered stock count and proposed price without removing the placeholder. The admin candidate can open the existing private image workflow for a draft; an isolated test exercised image processing, denied self-approval and approved attachment by a business administrator. No real image was processed or approved during the test.

The candidate cart now retains a variant ID and distinguishes variants. Checkout explicitly refuses all variant lines before reservation or payment; this is a safety boundary, not a working variant checkout. Still required: connect approved images to specific variants; complete price approval and any required catalog translations; implement variant-aware mixed-cart reservations, inventory concurrency, Stripe snapshots, payment events, cancellation and recovery; remove the safety hold only after those mechanisms and all tests are complete. Existing source-handle linkage must be reconciled with current catalogue identities before any actual import so duplicates are not created. The candidate has not been built, deployed or tested against live accounts or mobile/desktop screens.
