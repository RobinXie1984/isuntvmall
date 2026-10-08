# MUJI visual standard audit and enforcement — 8 October 2026

## Result

All 97 existing supplier-demo photographs were visually inspected against the original stoneware-mug demo and the saved `style/muji` direction. Nine originals already meet the product presentation standard. Seventeen additional photographs have approved, bounded crops: fourteen footwear hero views, one ceramic tea set and two skincare packages. Seventy-one unsuitable images now resolve to the existing neutral placeholder. The merchandise records remain listed, and every original supplier derivative remains byte-identical.

The crops remove only external promotional headers/borders and repeated montage views. They retain complete shown products, actual packaging text, colours, shapes and shadows. They use a consistent neutral square margin and lossless WebP; no resampling, filters, background invention or AI edits were performed. Decoded RGB pixels inside every crop are exactly equal to the corresponding original rectangle. One initial skincare crop clipped a packaging edge; visual inspection caught it, and the corrected crop was reinspected before approval. The rejected intermediate is outside public assets.

Evidence: `MUJI-IMAGE-REVIEW-20261008.json` records all 97 original hashes and final decisions; `MUJI-CROP-PLAN-20261008.json` records exact crop rectangles; `MUJI-CROP-LEDGER-20261008.json` binds approved derivatives to output hashes and pixel-parity results. `scripts/prepare-muji-reviewed-crops.mjs` reproduces the crops and refuses conflicting existing derivative bytes. The contact sheets are in the owning project's dated evidence directory.

## Mechanism and invariants

Problem: the existing processor padded the entire supplier poster and published it after ordinary merchandise approval; canvas normalization never proved photographic suitability.

Confirmed flow: the shared `productImage()` helper is used by the public product card, detail and shopping bag. The old batch workflow already enforced staff roles, revision-bound approval, private originals, immutable processed images and audited publication. The missing control was explicit visual review.

The smallest change adds a reviewed supplier-image mapping and a required human checklist to the existing batch workflow. Unknown supplier paths fail closed to the neutral placeholder. The original demo editorial collection remains unchanged. Future batch uploads require all four checks: calm background; full product with clean composition and consistent scale; accurate appearance; no promotional overlays (actual product and packaging labels stay).

Admin and Super Admin can attest; Operator and other uploader roles cannot approve. UI selection and individual approval require the checks. API schema validates every value as literal true. `batch_review_visual` validates the exact versioned checklist and atomically records reviewer, revision and output hash with approval. The legacy RPC can reject but cannot approve without the new visual attestation. Editing still clears approval, and stale or revoked approvers cannot publish.

## Ordinary QA

Studio test results: 33 batch/image unit assertions passed, including final image tests binding all 17 derivative hashes. Database workflow 34 checks passed, including legacy endpoint bypass rejection, missing checklist rejection, reviewer access, stale revision, revocation, publication and audit. Demo database tests: 25 passed. Capacity tests: 22 passed. Targeted ESLint passed. All database tests used local PGlite and did not touch managed data.

## Separate adversarial review

- Missing/false/string-valued or obsolete checklist: rejected by API; exact JSON equality also rejects it in SQL. Ordinary staff cannot invoke RPC directly.
- Stale selection or metadata change: revision-specific selection and existing database revision checks prevent reuse. Unchecking a visual criterion removes the item from selected bulk approvals.
- Existing supplier asset replacement at the same path: checksum tests fail. Unknown new supplier filenames remain placeholders. Deliberate approved-image updates require a new review decision and hash evidence.
- Publication bypass through the historical RPC: blocked at the database boundary, tested. Managed service-role holders retain infrastructure-level authority and are outside the staff UI trust boundary.
- Human false attestation: remains possible. The system records accountable human review; it does not claim automated visual understanding.
- Existing queued approvals predating this migration: inspect the managed queue before release. The migration does not silently revoke historical approvals or mutate live products. If any unpublished pre-existing approval exists, it needs explicit new review before a worker publishes it.

Verdict: CONDITIONAL until parent verifies managed migration, pending queue state and deployed browser flow. No known unresolved defect in the scoped local checks. Managed deployment/browser acceptance and the parent’s before/after screenshots are separate evidence.

## Reversal and operation

Image rollback: revert the source mapping; originals remain present. Keep corrected crop assets and audit history for evidence. Do not remove the database review gate as a routine rollback: an older frontend can still upload/reject but its approval call will intentionally fail until updated. Request clean replacement photography for the 71 placeholders; do not publish unreviewed replacements merely to fill a grid.
