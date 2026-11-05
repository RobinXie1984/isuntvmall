# Final staff admin acceptance — 5 November 2026

Valerie and Xinyang can independently use the deployed preparation and review workflow. The pending owner-browser acceptance from 4 November is complete. This closes that verification gate; it does not approve the merchandise or activate native sales.

## Start here

- Sign in: https://www.isuntvmall.com/admin/login
- Practical role manuals: https://www.isuntvmall.com/admin/help
- Migration instructions: https://www.isuntvmall.com/admin/help#shopify-migration
- Product/variant and private image workspace: https://www.isuntvmall.com/admin/batches
- Uncertain-price queue: https://www.isuntvmall.com/admin/prices

**Xinyang — Merchandise Admin:** prepare product copy, categories, private supplier information, four-language option labels, stock and private media. Select the intended fulfilment location and inspect exact quantities before explicitly applying source stock. Save evidence-backed price corrections for business review. No financial records, staff management or final publication approval.

**Valerie — Business Super Admin:** review exact options and price evidence, approve suitable MUJI images and saved merchandise revisions, oversee business operations and manage colleague access. This role does not provide code, infrastructure, database-structure or secret access. Use the preparation filters to work through pending prices, unknown stock, missing translations and missing approved images.

Both accounts are active with confirmed email addresses, previous successful sign-ins and one verified authenticator each, checked directly against Auth on 5 November. Each colleague signs in with their own credentials and authenticator; no new invitation or owner intervention is required. Credentials and recovery links must never be shared. Help is available at admin@tideisun.com; include the screen, time and product ID with sensitive details hidden.

## Checks completed

Verified the actual deployed screens using the owner's existing MFA-authenticated Business Super Admin session, without creating or impersonating a colleague session:

1. Team lists Valerie as active Business Super Admin and Xinyang as active Merchandise Admin.
2. The `gtcq-002` product-specific workspace loads all 13 variants. The first option shows its exact source link, private HK$376 proposal, Demo price HK$999.99 and English, Traditional Chinese, Simplified Chinese and Japanese option labels.
3. Selecting one fulfilment location and previewing stock shows all 13 separate SKU quantities. No warehouse totals are added together. Apply remains disabled until the explicit confirmation is selected. No stock was applied. Exact quantities and location details remain in the private business archive.
4. The product's private photo link opens its 110-image batch; pagination reaches page 2 of 5. Actual original/prepared image pairs render. Images retaining promotional text remain unapproved; all four MUJI checks are initially unchecked and approval is disabled. A neutral canvas does not count as visual approval.
5. The uncertain-price queue opens with 19 products and zero saved corrections. An actual food/nutrition option displays HK$999.99, “Demo price · not a selling price,” an exact source-option link and private evidence fields. Approval is disabled without a saved correction and deliberate confirmation.
6. The in-admin handbook renders login/MFA, role-specific daily work, correcting mistakes, safe price review, migration, one-location stock preparation and support instructions.
7. Fresh production read-only RPC checks using the actual active memberships pass for both Business Super Admins and Xinyang. Finance is denied variant, image and batch access. These checks use existing server-side actor enforcement, not hidden buttons.
8. Sixty focused role, merchandise-route, price-review and stock-review tests pass on unchanged application code. Earlier full-suite results remain dated release evidence rather than being presented as a new full run.

No save, approval, publication, invitation, access change, stock application or payment was executed. The public product/image hashes match the preserved 4 November baseline: 250 products, 173 images and one existing order. All 1,200 native variants remain inactive, stock-unknown and demo-priced; all have four-language labels and 884 private price proposals. The 1,179 private review images remain awaiting business review.

## Remaining ordinary business work

Xinyang prepares and corrects; Valerie reviews and approves. Confirm the fulfilment location and stock freshness, verify uncertain prices, review translations and inspect every image before approval. Reject or replace supplier images with promotional overlays, clutter or misleading appearance. Existing source-linked purchases retain their current checkout; activation of native variant sales remains a separate release gate.

No application defect was found and no runtime redeployment is needed for these verification/documentation changes. Deployed Worker remains `5f4ae4e2-5a77-466d-8801-79a2016ce997`; application code is unchanged from `837d9d8`.

Public redacted evidence: `evidence/20261105-admin-acceptance/`. Private account and database receipts are archived on Studio at `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/candidates/20261105-admin-acceptance`. The UI observations were captured through native Chrome control; they are not separate colleague-browser or mobile acceptance tests.
