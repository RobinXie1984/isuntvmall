# Release, rollback and merchant acceptance

## Template boundary

Robin confirmed on 2026-10-03 that iSunTVMall is the first demonstration, Stripe setup is deferred, and a separate customer database will be added only after a B2B client is confirmed. This release must not accept actual payment or promise that a real merchant has completed acceptance. The built-in profiles remain demonstrations. No real customer, wallet, supplier stock or shipping policy is invented.

## Reproduce verification

Use Node 22 or later and the committed lockfile, in an isolated checkout:

```sh
npm ci
npm run lint
npm run typecheck
npm run test:run
node scripts/verify-admin-role.mjs
node scripts/verify-merchant-operations.mjs
npm run build
CI=1 npm run build:vinext
```

The database verification scripts use disposable PGlite databases and fixture identities. They do not contact a merchant database or Stripe. They prove SQL transitions and permission denials, not real PostgreSQL multi-connection locking, actual MFA sign-in, email delivery, Stripe operation or chain settlement. Run the existing backend and reservation suites as part of a merchant pilot with their documented local fixtures. Never point a reset command at a managed merchant project.

Maintain a release receipt containing commit, dependency lock hash, source manifest, profile hash, generated deployment target, test counts, database migration versions, artifact hash, prior Worker version, deployed Worker version and browser evidence. Keep private receipts outside the public repository.

## Deploy the first demo

1. Confirm the source diff contains only authorized work and keep the current Worker version as rollback evidence.
2. Run all checks above. Build with the intended profile and without runtime credentials in the build environment. Confirm artifact/config identity before publishing.
3. Apply the additive migration through the existing Supabase GitHub integration. Verify its success before exposing new operational pages. Existing customer/order data is preserved. Do not recreate the project or reapply seed data.
4. Deploy the verified portable Worker artifact to the intended existing Worker, preserving runtime bindings with `wrangler deploy --keep-vars`. Do not copy secrets to a different machine or put them in the artifact.
5. Verify homepage, catalogue, product, cart, language switching, information pages and protected API denials. Confirm a public checkout request remains closed for the demo.
6. Record the actual Worker version and exact source/artifact hashes. Sync the approved source to the canonical project and GitHub with checksum readback; preserve the previous release for rollback.

## Confirmed customer installation

Use one independent Worker/domain and one independent Supabase project per customer, with separate payment credentials and separate private batch-worker configuration. Reuse the same application commit. Supply only that customer's public profile/assets/product import and deployment configuration; do not patch product code per store. Do not deploy a second profile with the first store's Worker config, secret bindings or database credentials.

Before activation, the customer supplies legal merchant identity, contact details, four-language purchase policies, actual SKU/specification/price/stock, shipping countries/rates and applicable tax decisions. An authenticated merchant owner verifies their own receiving account. Provide a single consolidated onboarding sheet instead of piecemeal questions.

Stripe runtime settings:

- `STRIPE_ACCOUNT_ID`: expected merchant account; verified against the account behind the server key.
- `STRIPE_MODE`: `test` or `live`; must match the secret-key mode.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: server secrets belonging to that merchant.
- `CHECKOUT_RELEASE_APPROVED=false`: default. True alone is insufficient: merchant catalogue mode, complete policies, matching origin, database/payment config and checkout verification must also be present.
- `STRIPE_REFUNDS_ENABLED=false`: separate execution gate. Pausing new sales does not disable settlement or refund processing of existing orders.
- Configure Turnstile, shipping and tax inputs, and the existing checkout admission limits explicitly.

Checkout snapshots bind an order to its store, merchant Stripe account and test/live mode. Do not swap an active deployment to another merchant account. Payment uses that account directly; there is no platform collection account, Connect transfer or application fee in V1.

## Merchant acceptance checklist

Record evidence for one complete test order, plus relevant failure cases:

1. Sign in as named Super Admin with MFA. Invite only approved staff. Verify Admin cannot manage/delete staff or execute refunds; CSR cannot edit merchandise; revoked sessions and lower-assurance sessions cannot mutate protected data.
2. Import merchandise/images, review source specifications and style output, approve and publish. Verify rejected/draft/demo products cannot be purchased. Inspect stock audit and stale-revision conflict; held stock cannot be overwritten below reservations.
3. On a mobile browser, repeat browse → detail → quantity → cart → checkout in English, Traditional Chinese, Simplified Chinese and Japanese. Verify policy access, prices, shipping/tax and recipient identity.
4. In the merchant's Stripe test account, pay once; replay duplicate/late webhooks and retry interrupted checkout. Verify one order, correct reserved stock release/decrement, correct amount/currency/account and no duplicate payment invitation.
5. Assign, pack, ship with tracking and deliver. Request refund through CSR/Super Admin; Super Admin approves, refreshes reconciliation and explicitly confirms the full remaining amount. Execute using a durable command/key. Test timeout/retry and independent external refund. Do not restock automatically.
6. Reconcile captured/refunded amounts and provider references. Export bounded CSV pages; amounts are minor units with currency, unknown fee/net stay blank. This is operational reconciliation, not a general ledger, bank payout reconciliation or tax filing.
7. Repeat with a second independent customer configuration/database/payment account. Prove cross-store cookies, catalogue, staff, orders and credentials remain isolated. The current neutral local profile proof is not this external customer acceptance.
8. Only after evidence is reviewed, arrange explicitly approved small real charge/refund amounts. No real funds are part of the template delivery.

## Failure and rollback

- Disable new checkout admission/release first when selling must pause. Keep the signed payment webhook and existing-order operations available while obligations settle.
- Roll back the Worker to the recorded previous version and verify public and protected routes. The V1 migration is additive; leave its audit/finance records intact. Do not run a destructive reverse migration or delete commands to retry money.
- Preserve unknown refund outcomes. Reconcile the same command/refund with the provider. The adapter stops new create attempts after the command's 23-hour retry window, before the documented Stripe key-retention boundary; it then requires reconciliation. Never invent a new key to bypass an unresolved outcome.
- Never change a frozen order's account/address to repair an old payment. Changing merchant identity requires a separately verified deployment transition.
- For a receiving-file change, use the disabled chain-specific template and its change record; do not start Token Rails or copy mnemonic/private keys. See USDT-INTEGRATION-BOUNDARY.md.

Provider references reviewed for this implementation: [refund creation](https://docs.stripe.com/api/refunds/create), [idempotent requests](https://docs.stripe.com/api/idempotent_requests), [refund listing](https://docs.stripe.com/api/refunds/list). Provider behavior still requires merchant-account testing before activation.
