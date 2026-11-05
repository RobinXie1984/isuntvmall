# Separate failure review — 5 November 2026

Ordinary QA precedes this review: 623 application tests, lint/typecheck, Next production build and Cloudflare build pass on Studio. 60 migration, 14 variant checkout and 40 reservation database checks pass in isolated PostgreSQL. Existing unused-variable lint warning is unchanged.

Reviewed mechanisms: malformed/duplicate headings, date cells, oversized workbooks and ZIP expansion; asynchronous file selection; wrong role/actor, MFA and origin checks; partially failed imports, identical retries and cross-operator receipts; unexpected publication/stock/price trust; deployment and rollback; dependency additions.

Findings addressed:
- Medium: a late file read could update the wrong intake mode. Mode changes are disabled during reading, while the existing generation counter rejects stale file reads. KOL remains photo-only rather than receiving an unsupported product-import action. Regression rendering checks cover that boundary.
- Medium: random batch identifiers would make reselect/reload retries create another stage and then encounter source conflicts. Import receipt is now deterministic for operator plus the entire validated title/payload. Existing database idempotency preserves completed drafts and colleague edits. A changed payload deliberately creates a new review/conflict instead of overwriting.
- Medium: compressed Excel input alone is not a useful expansion bound. Reject unsupported/encrypted/oversized ZIP metadata before parsing, cap expansion at 32 MiB, retain 2 MiB input and 10,000-row/250-column bounds. No workbook macros or formulas are executed. Legacy .xls is rejected with format guidance.
- Medium: hiding saved migration panels alone would leave their list endpoint accessible to daily staff. GET now requires a system/business Super Admin before any database call. POST import/draft rights remain merchandise-scoped and server-derived. Existing SQL RPCs remain service-role-only.

New dependency read-excel-file 9.3.12 is pinned and used only for lazy browser-side reading; lockfile preserves prior package versions. Production dependency audit reports no finding in it or its newly added transitive packages. Four inherited moderate findings concern existing rendering dependencies; no unrelated upgrades were attempted.

Residual limits: live UI/file parsing and private test-draft state must be verified after deployment; simulated component/SQL tests do not establish a colleague browser session. A spreadsheet with changed content and a conflicting existing handle requires owner review; it is intentionally not auto-overwritten. Bulk import is bounded and sequential, with individual failures visible; no background polling/retry service added.

Verdict: CONDITIONAL before live acceptance. Release conditions: preserve current Worker variables/secrets, verify Excel import and same-file retry against the real private workflow, verify no public test URL, and retain prior Worker for presentation rollback. No schema migration is needed. Do not roll back business rows, staff, orders or media approval state.
