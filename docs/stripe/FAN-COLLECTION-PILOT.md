# HK$28 Pocket fan — limited collection release candidate

Robin confirmed the real Pocket fan, HK$28, with one physical unit available for
collection on 2 November 2026 (HKT).

- Product: `11055abc-3a75-4c61-b99b-dbc732e6f300`
- SKU: `ISUN-PILOT-FAN-28`; slug: `pocket-fan-live-pilot`
- Managed stock: 1, recorded using the existing audited `stock_adjust` workflow.
- Merchandise working copy: draft revision 3. The original demo and sample 120
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
No production Worker deployment, new Stripe live credential or live transaction
has occurred. Full browser acceptance of the final pilot remains open.

## Remaining activation work

1. Restore working Chrome control. Tab/state operations timed out repeatedly;
   read-only account tools/CLI are available, but no Stripe connector is exposed.
2. Set up an appropriately restricted live Stripe key for merchant
   `acct_1UXHoBLOVAOX5yur`, plus a live raw-body webhook pointing to
   `https://www.isuntvmall.com/api/stripe/webhook`. Confirm/create credentials
   through the owner's required UI handoff. A Sandbox-only key approval does not
   authorize transferring a live key to Cloudflare.
3. Configure the actual Turnstile widget for `www.isuntvmall.com`, public site key,
   server secret and checkout client-hash secret. Current Worker secret inventory
   contains Supabase/Stream secrets but no Stripe or Turnstile secrets. Confirm
   new credential creation/storage permissions at the actual setup step.
4. Save exact production rollback version/config and database function definitions.
   Apply only the required reviewed payment migration and opt-in build, retain
   merchant admission/checkout release closed while verifying the deployed edge.
   Publish only this merchandise revision through the audited publish RPC when
   the limited release is ready. Complete desktop/mobile and four-language checks.
5. Enable the bounded pilot only, then hand the hosted payment page to Robin for
   his own card entry, bank authentication and payment. Do not ask for card data
   in chat. Verify actual provider account/mode, signed event, order, exactly one
   stock decrement and collection state. Payment does not mean collected.
6. Mark collected only after confirmed handover. Refunds are a separate authorized
   financial action, not an automatic cleanup step. Close new admissions after
   the one purchase and preserve webhook settlement/reconciliation.

This document records a candidate, not a claim that live checkout is enabled.
Evidence resides in the canonical candidate's `evidence/fan-live-pilot` folder.
