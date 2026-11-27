# Unanswered merchandise reviews

Robin authorized this procedure on 27 November 2026 HKT. The iMac Codex
automation **iSunTVMall unanswered merchandise approvals** is active and
checks the pending business review queues hourly at 20 minutes past the hour.
It may approve an eligible unchanged revision once it has waited **72 full
hours** without a response. Use `scripts/review-deadline.mjs` for the timing.
The wait restarts when the pending revision changes. An older open review gets
the full window from the policy start on 27 November at 16:44:40 HKT. Check the
last response in admin and any recorded business decision in the task history.
Deferrals take precedence over silence.

## Before deciding

- Work from the authoritative iMac repo. Read the latest project and weekly
  sync instructions. Use the existing approved database access from Studio,
  with SSH preflight. Keep secrets and private photos out of Git and logs.
- Read the live review rows and the current product, image and source revisions.
  Inspect human decisions and any existing release holds. Leave rejected or
  explicitly deferred items alone. The unverified down range stays on hold.
- For a photo, confirm the exact SHA-256 of the original and prepared image
  and review them together. Approve the current revision only after checking
  faithful appearance, calm background, clean composition and absence of
  promotional lettering. Require evidence of real product provenance and an
  existing matched product with a safe price and sales policy. A batch item
  that would create a new published product needs a separate release decision.
- For a price proposal, require current exact-variant evidence for HKD, SKU,
  options or pack size and amount. Match the proposal to the current catalogue
  fingerprint and the public source offer. Apply the weekly price safeguards,
  including HK$19.99 and demo labelling. Missing evidence, a stale source key,
  colour or product ambiguity, conflicting prices and unresolved authenticity
  stay pending. The timeout supplies approval authority, never factual evidence.
- Homepage placement has a separate photo decision bound to the exact live
  image. This queue's approval does not grant it. Checkout, staff access,
  real stock, product publication and payment settings are outside its scope.

## Record the decision

Use the same revision-bound admin RPCs as the existing product/photo/price
workflow. Verify the currently active owner actor, record the approval as
automated under Robin's authority, and keep the rationale, prior revision,
evidence hashes and UTC decision time in a private local receipt. Use the
automated rationale in the photo audit `p_reason`. The existing price RPC
retains the original evidence note. Do not attribute a visual check or
response to a colleague who did not perform it.

Before writing, re-read the pending row and require the same revision and
evidence. Skip concurrent changes. Use the normal batch worker for approved
media and verify resulting status and published image. Verify variant price
and any required disclosure on the live product. Each run must be safe to
resume and must leave existing approved catalogue photos in place during
review. Keep this review sweep independent of weekly product and price
imports. No-change runs are quiet.

## Verify the first automatic approval

The hourly review run should capture the first genuine approval in
`reports/retail-separation-20261127/unanswered-review-activation/`. A timed
dry run or a one-time manual approval does not complete this check.

1. Record the current pending revision, the time it entered review, the
   computed deadline, the source evidence and any hold decisions before
   approving. Capture the current state of known held items, including the
   YY12-YD130403 down listing and its pending photo. The 27 November baseline
   in that directory shows this listing in draft with zero approval events,
   approved price overrides or public images.
2. Use the existing audited approval path only after the deadline. Record
   that the decision was automatic under Robin's delegated authority. For
   photos, include this in the audit reason. For prices, tie the private run
   receipt to the product, variant and approved revision.
3. For a photo, read the approval and worker publication events from
   `media_batch_audit`. Match the actor, timestamps, revision and output
   hash to the batch row. Verify the processed image attached to the
   intended product and hash the published bytes. For a price, read the
   matching `price_approve` merchandise audit event through approved
   database access. Match the revision, actor and source fingerprint to
   the override, then verify the exact variant price and disclosure on
   the storefront.
4. Read the held items again and compare against the baseline. Record any
   intervening human decision separately. Report the first result in this
   chat with the approval time, audit evidence, published result and hold
   state. If any link in the chain is missing, report which check remains
   unverified and keep the receipt open. If no eligible item reaches the
   deadline, continue with the normal schedule.
