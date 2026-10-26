# Catalogue price audit — 26 October 2026

## Scope and evidence

Audited all 173 database products (98 demo records and 75 imported SunTVMall listings), plus all 102 static supplier demonstration products. Two database demo records are not publicly shown: one lacks a visible picture and one is explicitly excluded. The existing supplier-photo review gate additionally hides 76 static samples whose images are unapproved. The live storefront has 122 demo products and 75 source listings (197 total). The remaining records stay retained behind their existing visibility rules. No numerical prices, product identities, stock or images changed in this release.

The complete public feed and every source product page were archived on Studio. All 777 variant prices matched the pages' HKD structured offers. Initial transient failures on 15 page requests were retained; a bounded sequential retry completed all 75 pages. All 75 database source prices matched the imported variant minimum. No colleague price conflicts or other non-demo/non-source products were found.

- 56 source listings / 431 options retain the source-listed price.
- 19 source listings / 346 options retain owner-approved demo HK$999.99 in place of unverified generic source HK$19.99.
- 98 database demo records and 102 static supplier samples now explicitly identify their prices as demo amounts wherever shown.
- 330 source variants have comparison amounts at or below their listed prices. These comparison amounts and claimed savings are not imported or displayed.

For example, Starry celadon (`suntv-gtcq-002`) has 13 genuinely different configurations: the six-piece coffee set is listed at HK$376, while the 66-piece dinner set is HK$5,554. These are source-verified listed amounts, not presumed errors because of their range. Cosmetics sets at HK$1,314 and HK$1,980 also match their source pages; unreliable comparison prices do not establish that the listed sale amounts are demos.

## Mechanism and acceptance

The old UI described demo items as “Sample product” but did not explicitly explain that their displayed amounts were invented. The required invariant is visible price provenance beside the amount, on cards, selected variants, detail pages and retained cart lines. A shared disclosure helper restores that distinction without changing commerce data or adding a pricing subsystem. Source card conflicts are labelled unverified instead of overwriting colleague edits. Existing merchant-owned pricing remains independent from this source/demo distinction.

Source-listed means matching the published supplier page as of the snapshot date. Intended retail economics, real stock, fulfilment and a completed checkout remain unverified by this audit. Customers must confirm their selected option and final price at SunTVMall. The weekly script continues enforcing the 19.99 safeguard; image approval stays separate.

Checks cover every source option and demo sample, missing source metadata, conflicting card amounts/currency, invalid numbers, missing placeholder flags, mixed-option behaviour and all four languages. Ordinary typecheck, lint, unit tests and production build precede a separate adversarial review and live verification. Final deployment and exact evidence hashes are retained in the canonical receipt.

## Locations and rollback

Canonical evidence: `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261026-catalogue-audit/`.

It contains the complete feed, source-page HTML, per-variant comparison results, private database readback, source/build manifests, QA output and release evidence. The snapshot date is advanced to 2026-10-26 after this audit. No database mutation or schema migration is required. Previous Worker: `93b88340-190c-47dd-9b7d-247c3ffd311d`; previous Git commit: `f06b52a75ef4d988bf838bc46f8f57ebd8a2744a`.
