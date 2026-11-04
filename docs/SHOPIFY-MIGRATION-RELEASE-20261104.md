# Shopify migration workflow release — 2026-11-04

## Deployed outcome

Worker: `c3bbdc15-1a9a-4e7c-b14b-81a1d002f467`. Production schema through `20261104082940`. Login: https://www.isuntvmall.com/admin/login. Workspace: https://www.isuntvmall.com/admin/batches. Handbook: https://www.isuntvmall.com/admin/help#shopify-migration.

The real Business Super Admin session saved the supplied product CSV as a private stage. Exact-handle reconciliation prepared 141 existing records plus 10 new private drafts, with 1,200 inactive variants. Existing source IDs and slugs were retained. The existing 240 records have identical catalogue digest `4fa48846a532fa3f8dc4d4ac0a7c56c1` before and after preparation (excluding the new false native-catalogue flag); 173 images and the existing order were unchanged. Of the 141 source records, 66 were drafts and 75 published; their states were preserved. The first bulk preparation rolled back on the draft-status restriction, which was then fixed by a new tracked migration and tested before retry.

## Acceptance evidence

- 578 automated application tests; type checks and lint passed, with one existing unused-variable warning in the prior Sandbox receipt helper.
- 60 dedicated isolated database checks cover role denial, source identity/retry conflicts, unchanged existing listings, exact MUJI media approval, four-language variant labels, price review, revision protection, reviewed in-place cutover and draft-state preservation. See the archived check logs.
- 14 variant reservation/payment checks and 40 legacy reservation checks passed. Separate native PostgreSQL contention tests and PostgREST nested variant/image reads passed. These isolated checks are not production charges.
- Actual Stripe Sandbox Checkout accepted two synthetic variants, HK$10 + HK$20 = HK$30. The official CLI forwarded the provider event into the actual application webhook; order became paid, stock decreased from 2 to 1 for each variant, and duplicate delivery did not decrement again. Real Sandbox cancellation passed. Evidence: `evidence/20261104-variant-migration/stripe-sandbox.json`.
- Live Business Super Admin used the new stage and existing-product preparation controls. The deployed variant editor loaded the existing product's options and publication hold. The handbook was verified live.
- The live source product `suntv-gtcq-002` rendered in Chrome at an observed 390px width with no document overflow, and at desktop 1216px width. Actual language switching produced `ja`, `zh-Hans`, `zh-Hant` and `en` HTML languages and translated product titles. An unavailable combination suppressed purchase; a valid combination showed HK$420 and the exact source variant link `51611662909683`. Native variant shopping UI remains fixture-tested because no actual variant was approved for live sales. No physical-phone test was performed in this run.
- The in-app browser did not run the language handler during its check; the same action worked in Chrome. No production language defect was established from that browser difference.
- Unauthenticated private-stage request returned HTTP 401 with `SIGN_IN_REQUIRED`. Separate real colleague browser sessions were not used in this release; backend role denial was tested in isolated database/application tests.

## Operating boundary and remaining business work

This release finishes and deploys the migration preparation workflow; it does not declare every imported item ready to sell. The supplied product CSV contains no stock quantities. All 1,200 variant records remain stock unknown, inactive and demo-priced. Obtain the separate all-states inventory export, review exact location/option counts, complete localized option copy, verify prices and process actual supplier originals through MUJI business approval. Reference URLs are not approved public images. Packaging/weight/tax/source fields are retained in private staging; they are not all converted into editable native fulfilment rules. The current checkout remains in place for existing listings.

`VARIANT_CHECKOUT_ENABLED` is false/unset. Both native publishing and native Checkout enforce this server-side boundary. A future activation must use approved products and agreed delivery/tax policies, then verify the live payment configuration. The real-money boundary remains the previously authorized Pocket fan pilot. No new real transaction, refund, staff-access change or Shopify mutation occurred in this release.

## Release and rollback SOP

1. Preserve the source commit, migration manifest, previous Worker version and baseline. Test all migrations together on isolated PostgreSQL/PostgREST, legacy payment paths and reviewed existing-product cutover.
2. Apply schema transactionally with a known-baseline guard and short lock timeout. Record migration rows and reload PostgREST schema. Compare existing product digest, image count and order count before deploying code that queries the new relationships.
3. Deploy the exact reviewed source. Verify `/shop`, a source product, protected APIs, real staff workflow, all four languages and mobile/desktop layout. Keep native sales disabled until separately activated.
4. For a code regression, use the retained previous Worker `7233fc51-4441-40ca-a050-1ffce205c1e9` with the official Wrangler rollback command after checking its help and account. Keep the additive schema, private stages and audit history. Do not drop tables or undo stock/order history. Existing code tolerates the additional fields and uses the legacy paths covered by the 40 reservation checks.
5. If a payment discrepancy occurs, pause Checkout using the existing admission control, retain events/holds and reconcile manually. Do not auto-restock or refund on uncertain evidence.

A live rollback was not deliberately executed; this run verified legacy compatibility in isolation and retained the prior deployment. Database restoration is an owner-controlled disaster-recovery action, not a routine rollback script.

## Adversarial verdict

CONDITIONAL for this deployed preparation release. Native sales stay disabled; supplier media and uncertain prices cannot become public merely by import. The original live records are checksum-preserved, business changes are audited and stale revisions fail. Higher-risk native sales activation remains blocked on business stock/price/media approval and fulfilment configuration. Source weekly metadata now holds records already cut over to native pricing instead of replacing their reviewed prices. Test processes are stopped and the approved temporary test-key file was removed after use.
