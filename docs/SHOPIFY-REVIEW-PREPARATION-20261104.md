# Shopify review preparation — 4 November 2026

## Ground facts and mechanism

The supplied product CSV has 151 products, 1,200 variants and no stock quantity column. Existing native migration drafts hold unknown stock, demo prices and inactive variants. Today's public source feed has 137 products / 1,030 variants; fresh product JSON evidence was archived for all 137. Exact CSV-to-feed matching found 1,030 unchanged prices, no changed matched prices, 170 variants absent from the current public source. Missing source products are retained.

Import must prepare evidence without granting business approval. The smallest change adds private variant references and proposals, plus a filtered review screen and links to existing private image batches. No storefront catalogue rewrite, native sales activation or Shopify mutation is required. Actual location observations have now been collected and reconciled. Native stock remains unknown until merchandise staff deliberately select the intended fulfilment location and apply its source available quantities.

## Price and translation preparation

Across the full 1,200 variants, 884 have exact fresh source evidence and unchanged previously source-listed amounts; these qualify for private proposed prices only. Another 146 retain uncertainty (including the generic HK$19.99 safeguard) and 170 are absent from the current source. These 316 do not get a proposed selling price. All demo flags remain in place; no price approval is performed by the preparation runner. Source comparison prices and discounts are not imported.

Four-language option labels are prepared for all 1,200 variants using existing translated source options, unique exact historical matches, standard variants and factual packaging labels. Simplified Chinese uses the existing character mapping. The two ALLURA multi-packs say “28-day pack × 2/3”, avoiding the misleading equivalence between 56/84 days and two/three calendar months. These are prepared labels for staff review, not independent professional translation certification or new medical claims.

Tracked private schema: `20261104105425_shopify_prepared_review.sql`. The preparation function validates exact product/SKU/options, source URL and evidence, rejects duplicate variants and generic HK$19.99, protects colleague revisions, and never updates live prices, price flags, stock or readiness. A retry cannot wash away a colleague-edit conflict. Each applied suggestion has an audit event. Private references are never returned by public catalogue APIs.

## Valerie and Xinyang

1. Sign in at https://www.isuntvmall.com/admin/login and open **Batch import**. The saved migration stage already contains the 151 prepared products. Open the product's MUJI workspace.
2. Xinyang uses **Review queue** to find unknown stock, missing translations and unlinked approved images. Check exact option and pack. Correct private proposals with a reason; retain Demo price whenever uncertain. A stale-version warning means refresh, inspect and preserve the colleague's change.
3. Open **Private MUJI photo review** links. Compare the original with the normalized image. Return promotional text, charts, clutter or inaccurate appearance for replacement. Normalization only creates a truthful, consistent canvas; it does not erase text or make every image acceptable. No unreviewed image is public.
4. Valerie checks the exact source link and proposed amount/pack, then explicitly approves the price with evidence. Valerie reviews the MUJI checklist and approves acceptable images; Xinyang cannot approve them. Link each approved photo to the correct variant. A source-listed reference is not approval.
5. Keep unknown inventory blank. A complete inventory export must be matched by exact handle/options and location; do not sum locations or substitute on-hand for available stock. Malformed or duplicate location rows hold the entire option combination.
6. After the complete inventory snapshots are prepared, Xinyang selects one **Stock location**, checks the snapshot time, ticks the confirmation and applies source stock to empty variants. The tool uses available quantities only, never adds warehouses/bins, skips active or previously counted variants, and stops on a stale edit. Partial progress is retained and reported. “Not stocked” does not become zero; untracked or invalid quantities stay unknown. Keep the source file and check the selected fulfilment location before applying.
7. Native publishing and checkout remain disabled. Existing listings retain their current checkout until separately authorized activation and business readiness.

The same instructions are included in `/admin/help#shopify-migration`.

## Reproduction and recovery

Keep original CSVs, evidence, hashes, plan and receipts private on Studio. The run root is `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261104-review-preparation`. Do not place supplier costs, original exports or runtime credentials in GitHub.

- `scripts/shopify-review-evidence.mjs RUN`: acquire/resume exact source evidence from the archived complete feed.
- `scripts/shopify-review-state.mjs RUN`: use the existing private Studio runtime locally to snapshot exact identities and revisions. No credentials transfer.
- Run the TypeScript planner with a pinned `tsx` runner, e.g. `npx --yes tsx@4.21.0 scripts/shopify-review-plan.ts RUN`. Inputs: original product CSV, full public feed, evidence manifest, identity snapshot and repository catalogue.
- Apply the tracked migration transactionally only after isolated checks and a verified production schema baseline. Do not replay older superseded migrations.
- `scripts/shopify-inventory-pages.mjs RUN PAGE_COUNT LAST_ROW`: combine all direct page exports only after the final page shows Next disabled. It validates contiguous page coverage, rejects repeated variants across pages, retains exact originals and records hashes, locations and download times. This is a time-window snapshot, not one atomic inventory lock.
- `scripts/shopify-review-apply.mjs RUN`: apply suggestions with exact revision checks and an invariant receipt proving live prices, stock, product records, image records and order count remain unchanged. It does not approve anything.
- `scripts/shopify-review-media.mjs RUN`: retain exact allowed Shopify CDN originals, validate format/size/hash, reuse existing image hashes, and queue missing files privately by product. Frozen request inputs and readback hashes make partial upload retries safe. Existing admission limits are preserved; capacity holds require review, not a larger queue limit or extra scheduler.

For a UI regression, roll the Worker back to the retained previous version. Leave additive private schema, audit history and unapproved originals intact. Do not undo colleague approvals or stock/order history. No rollback through deleting source records.

## Verified inventory and media evidence

The three originally supplied files include two templates and one full product export. The full product file has no quantity columns. Rather than depend on the export email sent to `mall@tideisun.com`, the agent used Shopify’s native current-page download with all states/all locations, then verified the final Next button was disabled. All 24 exact CSVs are retained: 1,200 unique variants / 2,400 location rows. The merged derivative has SHA-256 `e8f4f00368fea1a0d5815c7d91d81867a176bd1546795969f21453d1bc9377d6`. Locations are `商店地點` and `iSunTVmall`; their quantities are not combined. There were 59 explicit “not stocked” location rows, no unmatched/ambiguous/invalid rows or SKU conflicts, and all 1,200 variants have at least one numeric location observation. This is a download-window snapshot, not an atomic lock of Shopify stock.

iMac handoff folder: `/Users/robin/Downloads/suntvmall/inventory-20261104`, with the raw pages, combined inventory and hash ledger. Canonical source/evidence is on Studio in the run folder above. Neither Shopify product nor stock data was changed.

The media run archived 1,205 unique original URLs, representing 1,049 distinct file hashes and 1,207 per-product URL references. Exact per-product content deduplication reused 352 previously queued items and admitted 827 new items in 85 product batches. The complete private review queue has 1,179 items; all reached review with no processing failures. Three bounded manual passes through the existing worker processed 675 items, while the existing scheduled worker handled the others. No daemon, service setting or new schedule was added.

All 1,049 distinct originals also have exact existing-processor MUJI previews archived privately. Twelve original/preview pairs were visually inspected. Seven products received specific private preparation notes for a branding banner, mannequin/plant clutter or promotional overlays. Normalization preserved appearance and colours; padding did not magically remove promotional text. No image was approved, rejected on behalf of staff or newly published by this run. The 173 public image records, 250 product records and existing order remain unchanged.

The temporary locked-Mac gate was cleared by Robin. Production schema `20261104105425` is installed, and the first preparation applied 1,200 labels without modifying commercial fields. Later reconciliation adds inventory references and correctly treats null source SKUs as blank only when the exact option vector matches. The remaining sign-offs belong in the existing merchandise/business workflow; no extra Robin login or mailbox access is needed for this export.

## Release status

Production Worker: `5f4ae4e2-5a77-466d-8801-79a2016ce997`; schema: `20261104105425`. The full set of 1,200 private variant references now includes source inventory snapshots; 884 price proposals are prepared and 316 remain uncertain or source-unavailable. Business approval is still required. All 1,200 native stock quantities remain unknown until a colleague chooses the intended source location and applies it. The quantity preview is available before confirmation. Actual database read checks passed for Robin and Valerie as Business Super Admin, Xinyang as Merchandise Admin, and Finance denial for Maggie. Source, ledgers, private originals/previews and operation receipts are archived on Studio. The owner’s one-hour browser session expired during the long export; a new sign-in is pending only for final interactive screen acceptance. The data preparation, deployment and backend checks do not depend on that pending sign-in.
