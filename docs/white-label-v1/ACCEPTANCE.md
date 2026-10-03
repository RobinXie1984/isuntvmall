# White-label V1 template acceptance — 3 October 2026

**Delivered as a demonstration template, not an activated live merchant.** Robin deferred Stripe setup, real catalogue/policies/staff and the second client's database until a B2B client is confirmed. No new paid database, payment account, real charge/refund or wallet movement was created during this work.

Implementation commit: `2695bbc41046f9e178745b7f2a8a6a30e42a72af`. Subsequent handoff-only documentation changes do not change the deployed application. First demo: https://www.isuntvmall.com. Worker version: `23b0cf7c-0d12-4e30-b8e7-1e30b44e9e55`. Prior rollback version: `1d5b2b98-21b8-41d1-8733-937382b0fdec`.

## Verified

- Existing MUJI composition, comet identity and catalogue retained. The known internal workflow QA product is hidden from public listing/detail/cart/live rails without deleting its source/audit record.
- Arbitrary validated brand JSON; independent cookie/cart namespaces, metadata/manifest/favicon, information pages and selected sample catalogue. Merchant mode cannot silently substitute demonstration products or rooms.
- Same 512-file implementation snapshot built twice: iSunTVMall and Stillroom. The latter rendered locally with its own name/logo/manifest/favicon and independent Worker target; no iSun public identity or credentials leaked into the neutral page. This is a configuration/build proof, not proof of a second live merchant database.
- Inventory adjustment uses stock revision, stable request ID, reservation floor and audit. Admin/Operator/Super Admin scope is distinct from CSR and finance scope.
- Full remaining-balance refund commands require approved request, current matching reconciliation, expected merchant account/mode, one active command, stable idempotency and explicit Super Admin execution. Unknown outcomes remain unresolved; late events cannot erase confirmed refunds. No automatic restock.
- Private reconciliation/finance records, bounded no-PII CSV and spreadsheet formula protection. Unknown fee/net remain null/blank. Stripe adapter uses the merchant's own account directly; no platform transfer or application fee.
- Managed migration `20261003144046` applied through the existing GitHub integration. Production readback confirmed eight new service-only RPCs, denied anonymous/authenticated direct execution, five private RLS tables, one active owner, zero refund commands and disabled checkout admission.
- Existing scheduled image worker remained healthy after canonical source promotion; an automatic idle cycle completed successfully. This is not a nonempty workload or throughput test.

## Evidence counts and limits

| Evidence | Result | Limit |
|---|---:|---|
| Application tests | 336 passed | Mocked provider and isolated fixtures; no Stripe account access |
| Actual migration/SQL checks | 286 passed across seven suites | Disposable PGlite; new independent-connection contention not tested |
| Deployment generator | 7 passed | Target validation, not a second external deployment |
| Existing SDK worker checks | 7 passed | No new production upload/approval workload |
| Lint, typecheck, Next build, both Vinext profile builds | Passed | No payment credentials in build environment |
| Browser matrix | 40 passed | Five pages × four languages × desktop/mobile; local Next snapshot before final favicon/banner adjustment |
| Actual cart interactions | Passed | Add, quantity increase/decrease, reload, remove/re-add; demonstration cart only |
| Live HTTP/asset checks | 34 passed | Four-language routes, protected denial, closed payment ingress, profile favicon/manifest and exact new bundle hashes |
| Final online visual check | Passed | Existing style retained; Simplified Chinese switching verified |

The local browser matrix found no horizontal overflow, page exceptions or broken loaded images. It does not prove every device or every supplier specification. Final favicon/banner changes received focused route tests, final build and deployed HTTP/visual checks. Authenticated production inventory/refund execution was not performed; route/role/MFA logic was exercised in isolated application and SQL tests.

Private release evidence includes source/build manifests, migration readback, test logs, browser screenshots, neutral build receipt, deployment version and retained rollback. The canonical project holds it under `evidence/white-label-v1-20261003`. Public source contains reproducible checks and the configuration/operations documentation, not credentials, buyer data or wallet-service archives.

## Explicitly not complete

1. **Stripe:** account/plan, test-account end-to-end charge/refund/webhook acceptance, settlement/payout verification and live activation. Robin will arrange the account later. Code presence and mocked tests do not replace these steps.
2. **USDT:** the newer rail has 10,000 EVM address records and controlled Ethereum USDC/USDT collection code plus historical local receipts. This audit did not independently reverify historical transfers on chain. TRON observation is present; production collection and commerce invoice binding are not verified. Base USDT production collection is not verified. The schema accepts only disabled activation.
3. **Merchant custody:** existing external receiving addresses are configured, but ownership is unverified; external destination configuration does not establish merchant ownership of intermediate deposit wallets. No existing treasury or signer was changed.
4. **Second client:** no new database, domain or merchant account is provisioned. Confirmed-client data/credential isolation must be tested on independent resources when that client exists.
5. **Actual sales information:** legal merchant/contact, policies, trustworthy SKU/specifications/stock/shipping/tax and named staff remain supplied inputs, not invented defaults.
6. **Operational acceptance:** production staff journey, real provider playback restrictions, concurrent managed-database behavior, nonempty scheduled batches and recovery/throughput evidence remain pending where not already documented in dated prior audits.

See [release and merchant acceptance SOP](RELEASE-AND-ROLLBACK.md), [configuration](CONFIGURATION.md), [standard scope and staffing](HANDOFF.md), and [USDT boundary](../USDT-INTEGRATION-BOUNDARY.md). No additional information is required from Robin to keep this template as a closed demonstration.
