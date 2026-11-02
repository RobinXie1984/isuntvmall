# HK$28 Pocket fan — limited collection release candidate

Robin confirmed the real Pocket fan, HK$28, with one physical unit available for
collection on 2 November 2026 (HKT).

- Product: `11055abc-3a75-4c61-b99b-dbc732e6f300`
- SKU: `ISUN-PILOT-FAN-28`; slug: `pocket-fan-live-pilot`
- Managed stock: 1, recorded using the existing audited `stock_adjust` workflow.
- Merchandise published through reviewed revision 4 (catalogue revision 2). The original demo and sample 120
  units were preserved. New draft carries no invented speed/charging claims.
- Existing owned illustration is selected privately and explicitly described as
  illustration, not a photograph of the collection item. No supplier photograph
  was approved; no public image was replaced.
- Opt-in build profile: `config/isuntvmall-fan-pilot.json`. Default showroom
  configuration is unchanged; the pilot profile preserves all existing catalogue
  collections and restricts server checkout to this product with aggregate qty 1.
- Fulfilment is collection: no shipping rate/address/phone collection, no automatic
  tax, no adaptive currency conversion. Hosted Checkout collects the buyer email
  and any billing details Stripe requires. Amount is frozen from server data.
- Collection, cancellation/support, privacy and limited-offer copy is supplied in
  English, Traditional Chinese, Simplified Chinese and Japanese. Review this copy
  before activation; the public candidate labels the illustration accurately.
- Stock reservations prevent a second buyer purchasing the confirmed unit. New
  attempt restrictions occur before database/provider calls; split cart lines
  cannot bypass the qty limit. Existing settlement/reconciliation remains active
  independently of admission being paused.

## Verification

547 unit tests pass, including wrong-product rejection, aggregate quantity
rejection and omission of shipping/phone fields for collection. Lint, typecheck,
Next build and Cloudflare/Vinext build pass with the opt-in pilot profile.
The approved production candidate is deployed with admission still closed during verification. The live merchant identity, HKD currency, charges and payouts are verified. The private signing secret was replaced before activation after appearing in a tool image. Credentials were installed only in the existing Worker; no live secret was copied to Studio or Git.

## Production configuration

- Merchant `acct_1UXHoBLOVAOX5yur`, HK / HKD, charges and payouts enabled.
- Restricted live Checkout key: Accounts/Charges and Refunds/Events/Payment Intents read, Checkout Sessions/Customers write. No payout, transfer, refund-write or key-management rights.
- Live webhook `we_1UXNVSLOVAOX5yurMxdQiI6J`, nine payment/exception events; version `2026-10-28.endive`.
- Dedicated Dashboard configuration `pmc_1UXNkULOVAOX5yurEUMV1G9G`: Cards enabled; the Dashboard showed Link disabled, but the actual hosted Checkout still offered Card and Link. Do not describe the observed checkout as strictly card-only. No delayed bank method was listed. This acceptance uses the card form.
- Managed Turnstile hostname is `www.isuntvmall.com`, pre-clearance off.
- Admission max store/client active = 1; max recent attempts = 5 per 15 minutes.
- Existing completed-card settlement is reused. The additive asynchronous-settlement migration remains unapplied in production; delayed methods require separate release verification. No schema change or main-branch migration was needed for the bounded card purchase.
- Existing Supabase and Stream credentials remain bound to the same Worker.
- Closed edge checks passed: checkout 503, unsigned webhook 400, locally signed no-op webhook 200. The last is an endpoint/signing check, not a real provider-delivery claim.
- Public product, illustration disclaimer and stock/price verified in all four languages; measured mobile viewport 300 x 649 and desktop viewport 984 x 692 (the browser's existing zoom changes requested dimensions). The actual live hosted Checkout is now verified at HK$28.00, shipping/tax/discount zero, with one active reservation; real payment remains pending.

## Remaining acceptance

5. Enable the bounded pilot only, then hand the hosted payment page to Robin for
   his own card entry, bank authentication and payment. Do not ask for card data
   in chat. Verify actual provider account/mode, signed event, order, exactly one
   stock decrement and collection state. Payment does not mean collected.
6. Mark collected only after confirmed handover. Refunds are a separate authorized
   financial action, not an automatic cleanup step. Close new admissions after
   the one purchase and preserve webhook settlement/reconciliation.

This document records the bounded release and distinguishes completed setup from pending real-card acceptance.
Evidence resides in the canonical candidate's `evidence/fan-live-pilot` folder.

## Edge runtime correction

Normal Chrome reached a successful real Turnstile challenge, then the server returned CHECKOUT_VERIFICATION_UNAVAILABLE before any order or Stripe session existed. A real workerd probe reproduced the cause: Workers rejects Fetch redirect="error". The request now uses redirect="manual"; the existing non-2xx status check rejects redirects without forwarding credentials. Unit coverage asserts redirect rejection and no provider-error disclosure. A second workerd probe reached the provider and correctly rejected intentionally invalid fixture credentials. The initial test expectation of HTTP 200 was corrected to the observed/documented invalid-secret rejection (HTTP 400); no valid-token result was inferred from that fixture.

## Live hosted Checkout observed

Worker `c6c91e20-0720-4931-a782-915605892ce4` contains the verified runtime correction. Real Turnstile validation, audited reservation and Stripe Checkout creation now pass. Session `cs_live_a1bgDIgp4LTxqvtWOzwyHtFcazCtmyUMnxTGHETmBpWgKILn1Lgc7fmtOy` belongs to order `17f4f561-d9cc-4296-94b6-47ece801dc1f`, live mode, HKD 2800 total, with no shipping, tax or discount. The unit is reserved until 3 November 2026 01:06 HKT. Robin must enter the card and complete payment privately. Provider-delivered settlement, final order/stock and collection state are not claimed before payment.
