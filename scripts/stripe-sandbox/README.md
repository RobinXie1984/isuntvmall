# Isolated Stripe acceptance harness

This harness exercises the application's existing Checkout creation, signed webhook
route and payment-result reader. It is not deployed, does not use production
Supabase, and does not replace the existing storefront.

## Boundaries

- Stripe account: `acct_1UVopWQ0fHQKbZbH` (iSunTVMall Limited sandbox).
- A test key is mandatory; `launch.mjs` rejects live keys and other accounts.
- Studio owns the disposable native PostgreSQL 17 database and PostgREST 16.5.
  Both listen only on owner-only Unix sockets. No TCP database service is opened.
- The iMac control process exposes the fixture REST bridge on `127.0.0.1:54331`.
  Requests travel over the existing hardened iMac → Studio SSH path. No SSH
  forwarding, Studio → iMac connection, production credential or credential
  copying is involved.
- Minimal synthetic `auth`/`storage` schemas support the real application migrations.
  This is PostgreSQL/PostgREST integration coverage, not hosted Supabase Auth testing.
- The fixture Checkout uses a synthetic server-side client identity. The real
  production route's origin/Turnstile/admission checks remain intact; the harness
  does not claim real Cloudflare challenge coverage.
- The test product is HK$120.00, with 20 initial **synthetic** units. It does not
  enter the live catalogue. Only fixture `@example.com` customer data may be used.
- The browser-facing harness is on `http://127.0.0.1:3031`. It imports actual
  application payment code but is not proof of the production shopping UI.

## Reproduce

1. Use a new Studio candidate path ending in `stripe-sandbox`; install the pinned
   application dependencies and native PostgreSQL 17/PostgREST. Run
   `bash scripts/stripe-sandbox/studio-database.sh` **on Studio** once. It fails on
   existing data rather than resetting it. Existing acceptance data can be resumed
   with `studio-resume.sh` and stopped with `studio-stop.sh`.
2. On iMac run `node scripts/stripe-sandbox/local-rest-bridge.mjs`.
3. For provider-independent coverage:
   `npx vitest run --config scripts/stripe-sandbox/vitest.config.ts`.
   This uses real SQL, PostgREST, application code and Stripe signature verification,
   with synthetic provider objects. It creates only fixture database records.
4. After the owner's Sandbox-key approval, keep the existing test key in an
   owner-only file **outside the repository** on iMac. Never print it or transfer
   it to Studio. Run `node scripts/stripe-sandbox/launch.mjs /absolute/private/key-file`.
   The launcher verifies account identity, starts the official Stripe CLI listener,
   holds its signing secret only in memory, and starts the local acceptance harness.
5. Open the local harness and pay with Stripe test cards only. Test success,
   decline, 3DS challenge, retry, cancellation and webhook replay. Inspect the
   actual Sandbox dashboard and fixture orders/stock. Record object IDs and outcomes
   without keys, customer details or card data.
6. Stop the launcher and bridge, stop the Studio fixture services, remove the
   approved temporary local key file, and archive sanitized receipts on Studio.

## Remaining acceptance gates

Real Stripe-created Checkout, test-card payment, 3DS, decline and actual CLI-forwarded
webhook delivery passed on 2 November 2026; see the dated acceptance report. Future
runs require approved Sandbox credentials. Synthetic tests must not be represented
as real provider checks. Full storefront browser acceptance remains separate.
No live transaction, live key configuration, main-branch merge, production database
migration or production deployment is authorized by this Sandbox task.

Use a Dashboard-managed `STRIPE_PAYMENT_METHOD_CONFIGURATION` to select methods for
the launch. Dynamic payment methods are not hardcoded. Delayed success is fulfilled
only while the original reservation is still valid; after release or expiry it is
held for manual reconciliation, never silently oversold. Do not enable long-settlement
methods for normal sales without agreeing that operational policy.
