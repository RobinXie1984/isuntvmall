# Separate adversarial review — 6 November 2026

Scope: task worktree relative to `8f7dba9`, after ordinary QA. Read-only review of the shared Shopify-style import dialog, import orchestrator, authenticated media API, additive source-image SQL, worker downloader and existing approval/admission mechanisms. This review did not operate the browser, use credentials or change implementation files.

Ordinary QA reported by the parent: lint/typecheck, 643 application tests and Next build; 35 worker tests; 22 new isolated PostgreSQL source-image checks; existing staging, variant-checkout and reservation regressions. These results are functional evidence, not this review's verdict. Signed-in managed import, real private storage processing, deployment and responsive acceptance were still pending at review time.

## Finding 1 — stalled network can trap a confirmed import

- **Severity:** medium, operational availability; no identified financial or permission bypass.
- **Likelihood:** occasional dependency/network failure, with larger files amplifying the effect.
- **Location:** `src/components/batch/shopify-import-wizard.tsx`, `post()` and `confirm()`; `src/lib/batch/import-wizard.ts`, `confirmProductImport()` per-product loop.
- **Mechanism:** `post()` has no request deadline. While awaiting it, `inFlight` stays true, Close is disabled and Escape is rejected by `close()`. The operator cannot leave the dialog normally. The orchestrator also catches every transport/authentication failure and continues all remaining products. Adding only a 45-second per-request timeout could still spend roughly 500 × 45 seconds during a persistently stalled dependency.
- **Reproduction/simulation:** final confirmation sets `inFlight=true`; let the stage or draft fetch remain pending. No path clears `inFlight` until that promise settles. For the amplification path, make each draft request fail or time out and observe the loop issuing a call for every remaining product. This is established from control flow; a production outage was not induced.
- **Minimal fix:** bound each request (45 seconds is adequate for these small API operations); stop the batch on unconfirmed transport or authentication loss while retaining the known receipt and completed results. Mark remaining products not attempted so they cannot be mistaken for successful rows. Keep normal per-product business conflicts and supported image holds explicit and reviewable. The unchanged-file retry must reuse completed drafts and media.
- **Test to add:** stalled request produces a safe timeout code and unlocks the dialog; one network/auth failure prevents later draft calls, retains completed IDs/receipt and marks untouched products not attempted. Existing conflict-continuation and image-hold tests must still pass.
- **Monitoring:** retain safe request/error codes with the import receipt; keep worker health and failed-item status visible. Do not log source rows, URLs with query secrets, or credentials.
- **Residual uncertainty:** real browser navigation/unload and live dependency timeouts need the parent's browser verification after the fix.

## Hostile paths examined without a blocking finding

- Browser preview has no server mutation. Final confirmation is guarded against duplicate clicks. Back/Cancel/Replace use local state; native-dialog focus and actual narrow-screen behavior still require browser acceptance.
- Imported source markup is rendered as React text, not injected HTML. File/archive/row/header, product, variant, SKU/option and JSONB byte limits are enforced before confirmation; server schemas remain authoritative.
- Media URLs and target product IDs are not accepted from the media API caller. Actor and MUJI preset are server-derived. Session/MFA and `merchandise.manage` checks run before privileged calls. SQL verifies stage ownership (or existing business approval rights) and exact stage/native-product mapping.
- New SQL uses invoker functions and grants execution only to the existing service role; no anonymous/authenticated grants are added. No key or role expansion was identified.
- Queue admission reserves the full original allowance, chunks by existing policy, and fails atomically on capacity. Per-product advisory locking and the product/source URL index prevent duplicate queue rows. Existing failed/rejected records are reported, not automatically retried or approved.
- Downloader accepts only exact HTTPS Shopify CDN paths, rejects redirects/credentials, bounds bytes and time, sniffs signatures, and uses the existing decoder/pixel guards. Immutable private originals bind under a current lease and are hash-read back; a changed source cannot overwrite a bound original. Existing lease recovery is reused.
- Queueing does not approve/publish images, trust stock, clear demo-price flags or alter payment/order logic. Existing approved public images remain in place. The first-product preview's fields remain source observations; the existing native draft creator does not apply every Shopify field to the editable product. Therefore this is sequence parity, not complete Shopify backend equivalence.

## Highest-risk release boundaries

1. A stalled/ambiguous request must not produce an uncloseable or repeatedly amplified import.
2. The new service-only migration and source-aware worker must be active **before** exposing the new media enqueue UI. An old worker can claim a remote item before its original exists and mark it failed.
3. On presentation/app rollback, retain the source-aware worker while any `source_url` jobs remain. Do not roll back schema/data or revert colleague edits, orders, prices, approvals or stock. If the worker itself must be reverted, pause the named worker and preserve queued rows until a compatible worker is restored.
4. Actual signed-in confirm/retry, private original → prepared review image, no-publication, and existing business-data preservation checks are required. Automated role tests are not impersonated colleague sessions.

## Verdict

**CONDITIONAL.** No migration security blocker was identified. Close Finding 1 with focused checks, then satisfy the deployment-order/rollback and real browser/private-storage acceptance conditions above. This verdict does not assert that production deployment, live processing, colleague sessions or mobile behavior have already passed.

## Remediation follow-up — code finding closed

The UI author added a 45-second deadline around fetch **and response-body parsing**, aborts the request, and clears the deadline after settlement. Authentication, rate-limit, server/transport uncertainty, missing receipts and generic `BATCH_OPERATION_FAILED` now stop the file; untouched rows are explicitly `NOT_ATTEMPTED`. Completed product IDs and known stage receipts are retained. Known per-product business conflicts still continue. The dialog returns to results and releases its in-flight guard. Preview/results now reset scroll position and focus their heading.

Independently reran `vitest run src/lib/batch/import-wizard.test.ts src/lib/batch/import-wizard-render.test.tsx`: **24 tests passed**. These include a never-resolving transport at the 45-second boundary, stalled JSON reading, stopping remaining draft requests after timeout/auth/generic backend failure, retaining a created draft on uncertain media enqueue, and continuing after a known source conflict. Review of the final stop list confirms the generic HTTP409 backend failure no longer amplifies across the entire file.

Finding 1 is **closed in code and focused tests**. No further blocking implementation finding remains in the reviewed patch. Overall verdict remains **CONDITIONAL solely on the actual managed/browser/storage acceptance and deployment/rollback conditions**, which belong to the release executor. This review does not claim those external results.

## Final acceptance review — production receipts inspected

Independently read the retained live import, immediate retry and reopened-file retry accessibility receipts. All three identify product `852c1eb0-f5da-4a70-9b32-b84d77e2ba9d`, private photo batch `efb72026-5124-4b68-92ea-9c437cda7f7c` and import receipt `0e4b930c-f82c-4a9b-9568-1c030dc0ebd6`. First import reports one private draft and one queued image; both retries report the existing draft/image batch rather than additional records. The test data is explicitly labelled TEST ONLY.

The private-image receipt shows two inactive variants, unknown variant stock, placeholder HK$999.99 prices, a draft/demo product with native checkout disabled, and one revision-1 media item in `review` with no approver or published product link. Both original and prepared object readbacks returned 200 through the authorized private route and their SHA-256 values match the recorded source/output hashes; unsigned public requests returned 400. The product has zero public image records. This demonstrates actual compatible worker processing into private review, not approval or publication.

The preservation receipt reports zero changed/missing pre-existing rows in all seven checked tables. Additions are exactly the labelled test product, two test variants and one private media item. Public image, order, order-item and staff counts remain unchanged. Binding names/types and existing plaintext settings match the prior runtime; secret values were not part of this review.

The managed schema receipt shows `source_url_exists=true`, migration `20261106093855` and zero browser execution grants on the two new RPCs. Deployment receipts show source `534d225`, Worker `e19c613b-1135-4411-9716-d4273e2480a4` at 100%, created at 09:57:30 UTC. The executor records source-aware worker promotion at 09:51:55 UTC and a healthy scheduled run at 09:52:29 UTC, before app deployment; private object/review evidence independently establishes that a compatible worker processed the live fixture. No direct scheduler/credential inspection was performed by this reviewer.

Viewed the retained narrow-viewport and live desktop preview screenshots: preview starts at its heading, content is readable, narrow controls remain inside the dialog, and the source prices are explicitly unapproved. The executor measured 390px viewport/document width, 16px main text and scroll position zero. Actual Traditional Chinese, Simplified Chinese and Japanese dialog receipts show translated controls; the English handbook receipt confirms the updated main batch workflow. English was restored by the executor. Browser evidence used the owner's Business Super Admin session, not impersonated colleague sessions or a physical-phone test. Role boundaries are established by automated backend/database tests.

The final public HTTP receipt passes all twelve checks, including the test product's 404 and sitemap exclusion. The executor reports final 655 application tests, 35 worker tests and 136 database assertions passed. Those suite totals are executor-provided; this reviewer independently reran the 24 affected timeout/orchestrator/render checks noted above.

**Final verdict: CLEAR within the tested import scope.** The conditional release requirements are satisfied by the code remediation and retained live receipts. Preserve two continuing limits: this matches Shopify's main import **sequence**, not all backend field/publication semantics; and any UI rollback must retain a source-aware worker while remote-source jobs remain. No financial or merchandise approval was performed in this acceptance. A leftover image-first sentence in the general Merchandise Admin handbook was separately flagged to the executor for a narrow wording correction, to prevent conflict with the new main workflow instructions.

Final handbook follow-up: the outdated image-first daily instruction and old result-link wording were corrected in source `4796c1a`, checked with lint/typecheck and a fresh Cloudflare build, then deployed as Worker `a36ce252-6de3-45c8-8f81-7fa22915afdb`. The signed-in live handbook shows Products → Import and the current Review product & photos action; the contradictory sentence is absent. No runtime import/queue/payment logic changed in this follow-up.
