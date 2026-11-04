# Separate adversarial review — 4 November 2026

Ordinary QA preceded this review: 597 application tests, TypeScript and lint pass (one pre-existing unused-variable warning); the production vinext build passes. The default Next/Turbopack build cannot follow this isolated worktree's external dependency symlink; the actual deployment adapter builds successfully. Twenty isolated database checks cover preparation permissions and invariants. No production checkout or payment code changed.

## Findings and resolutions

### High impact, plausible on retry — colleague edit could lose conflict visibility

`shopify_prepare_review` originally returned early for an identical preparation fingerprint before checking the current variant revision. It preserved the colleague's values but could misleadingly report a replay instead of a conflict. A changed request could also have washed away the conflict if the runner treated a colleague revision as its own. Fix: retain the last applied preparation revision, mark identical replays held when current revision differs, and never adopt the current revision when a suggestion is held. Tests simulate an actual merchandise correction followed by both identical and changed retries. No overwrite occurs. Residual: a staff member must resolve the conflict deliberately; there is no automatic merge.

### High impact, plausible on malformed export — partial location stock

`matchShopifyInventory` previously discarded an invalid location row but retained another valid row for the same variant. A later operator could mistake a partial snapshot for complete stock. Fix: any invalid location or available quantity holds the entire exact variant combination; duplicate bins already do so. Regression test covers one valid and one invalid location. Negative source observations are preserved as observations, never silently clamped into sellable stock. Actual source export validation found 2,400 rows across two locations and 59 explicit not-stocked rows. These are preserved as unassigned location observations, never zero; an actual malformed number still holds the whole combination. No aggregate or physical-stock assertion is made.

### Medium impact, likely at catalogue scale — repeated image galleries

The variant editor repeated the whole product image library for every variant. Fix: show one shared image library, and only linked/selected images in a variant row. Product-specific pending review links avoid searching hundreds of batches. Residual: up to 1,000 pending rows per product are read; current export has fewer than 250 image references per product. A very large future product would need pagination rather than a wider unbounded query.

### Medium impact, plausible on direct links — native editor missing

A product-specific photo deep link initialized the image workspace but did not select its native variant editor. Fix: the server checks whether that exact product has variants, initializes the native editor only then, and keys the workspace by product/batch so navigation cannot retain a previous product's selection. Server-render checks cover all four languages and confirm ordinary non-migrated products do not receive the native editor. Real signed-in interaction is recorded separately after final deployment.

## Hostile-path boundaries checked

- Finance access is denied before private media/database lookup; merchandise role cannot approve prices or images. Private responses use no-store headers.
- Duplicate variants, malformed labels, mismatched raw options/SKU, generic HK$19.99 and absent evidence fail preparation. Prepared proposals cannot change stock, live amount, demo flags or readiness.
- Evidence includes actual archived source bytes. Fresh matching proves a source-listed reference, not intended economics, available stock or fulfilment. Uncertainty stays sticky; absent source products remain present.
- Images are restricted to HTTPS Shopify CDN paths, bounded to 24 MiB, signature checked, SHA-256 archived and read back after private upload. Original files are retained. The admission function enforces existing limits atomically; a full queue is held, never bypassed. Request inputs are persisted before mutation for retry recovery.
- No extra daemon/schedule, new credentials, security changes, Shopify writes, payment activation, automatic approval or public image replacement is introduced.
- Database migration is additive. The UI tolerates older variant-list responses without preparation metadata, allowing the filtered review UI and private batch links to ship independently. The private suggestions require the new migration before application.

## Release conditions and verdict

**CONDITIONAL** for the backward-compatible review UI. Keep native sales disabled, retain the previous Worker and all private originals. Do not claim the new private suggestions have reached production before applying/verifying their migration and the invariant receipt. Real staff acceptance and responsive-browser evidence must be recorded independently of automated tests. The direct inventory downloads resolved the mailbox dependency. Explicit staff location selection remains necessary before copying stock counts. Do not weaken authentication to remove these gates.

The full catalogue migration remains on business review hold until verified inventory, exact-option prices, accurate product copy, approved MUJI images and approved fulfilment rules are complete. Four-language variant-label preparation does not certify the ten new draft products' full descriptions, especially nutrition/veterinary source claims.

## Follow-up hostile-path checks

- A single source-location selection never sums warehouses or bins. The stock helper rejects missing provenance, negative/oversized available quantities, multiple bins, active variants and previously counted variants. Product-level application uses the existing backend stock/draft endpoint with each current revision and a source-file hash in its reason. A conflict/network failure stops the remaining calls and refreshes actual state; retry skips already counted variants. It never clears demo price labels or approves media.
- Exact null/blank source SKU normalization resolved ten false identity conflicts. No nonblank SKU is substituted or renamed, and a different option vector still fails matching. Fresh exact variant/page evidence and prior uncertainty checks are still required.
- Direct page exports validate 50 unique option combinations per full page, a disabled final Next control, no repeated variant between pages, identical headers, and exact original hashes. Shopify can change during this read-only window; the snapshot is dated and staff must confirm the fulfilment location and current availability.
- The agent does not approve prices or photos, choose a fulfilment location for the merchant, clear uncertainty or enable native sales. The old public catalogue, image records and order count are checked independently before and after preparation.

Final QA: 597 application tests and 20 private-preparation / stock-invariant database checks pass, alongside the 60 migration workflow checks. Actual read-only database calls verified both Business Super Admin memberships and Xinyang can read the prepared variants/images/batches, while Maggie’s Finance Admin cannot. This is not recipient-browser or MFA-session proof. The live owner browser session expired after one hour; its renewal is the sole outstanding interactive screen-verification gate. Native sales remain disabled.
