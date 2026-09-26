# Commerce release boundary

Checkout remains **HOLD** in code. Credentials alone cannot enable it. The preview does not place orders, reserve real stock, contact payment providers, or accept webhook mutations. The managed backend is now connected; that does not release checkout or establish payment-provider readiness.

## Managed deployment evidence — 26 September 2026

For source `c4d0079`, deployment checks confirmed project `fikmqessuraosgoyxede` has all eleven migrations applied and twenty-four application tables with row-level security enabled, with no anonymous application-table grants. Cloudflare and Studio runtimes are connected through approved secret configuration using the existing service-role fallback `SUPABASE_SERVICE_ROLE_KEY`. No secret values are included in this document.

The connected showroom contains 96 demo products, 96 images, three fictional hosts, three public preview rooms and eighteen product links. The owner invitation was issued and application membership provisioned; delivery, private password setup and successful MFA remain **UNKNOWN**. No successful owner-authenticated session, verified broadcast or merchant approval is inferred from those records. The batch scheduler is not installed and authenticated end-to-end batch processing/review/publication remains **UNKNOWN**.

The current application suite passed 184 checks and the connected deployment passed 143 HTTP checks. These bounded results establish the checked pages and guarded endpoints, not all managed database, Auth, storage or payment behavior. Recovery rehearsal, real provider/widget verification, payment merchant/lifecycle tests and the independent checkout gate remain open requirements. See [managed deployment](../supabase/DEPLOYMENT.md).

## Implemented and locally checked

`reserve_checkout` creates one immutable order per browser attempt UUID, locks inventory, and reserves the aggregated quantity of every SKU across all room-attributed order lines. `stock_qty` is physical on-hand quantity; sellable quantity is on-hand minus active reservations. Price, policy, source attribution, and currency are validated or snapshotted on the server. Stock edits below held quantity fail. The former unreserved order/fulfillment RPCs are revoked from the service role.

V1 serializes inventory operations with one transaction-scoped advisory lock, then locks products in UUID order. This is deliberately simple and limits throughput. Product updates take the same lock before row locks. Payment, expiration, release, and replay checks run in transactions. Wall-clock time is checked after acquiring locks so a waiting transaction cannot use its older transaction-start timestamp to extend a hold.

Reservations last 40 minutes. Stripe sessions are card-only, expire at the reservation deadline, and use a stable idempotency key and frozen order items/policy. Session creation is refused when fewer than 30 minutes remain, because Stripe requires a longer creation window. A missing local session link is not proof that no session exists. An unlinked, uncertain attempt with fewer than thirty minutes remaining returns `CHECKOUT_RETRY`, preserving the same attempt rather than treating it as expired. Connection errors, provider conflicts, and ambiguous creation/attachment outcomes retain the hold. Definite Stripe invalid-request rejection releases it. The cancel endpoint releases only after retrieving or expiring the provider session and confirming expiration. Visiting a cancel URL never releases inventory. An explicit return-flow cancel button is gated with checkout and confirms the server response. Paid, reviewed, refunded, or unresolved attempts return `CHECKOUT_PAYMENT_PENDING`; they retain their attempt identifier and must not prompt another payment. Only confirmed cancelled/failed attempts can rotate.

Signed webhook facts must match the order, subtotal, currency, total arithmetic, and intact reservation. Event IDs deduplicate successfully recorded replays. Unknown orders raise an error without inserting an event receipt, so the same provider event can retry after recovery. A second completion cannot consume inventory again. Late paid events, missing holds, incompatible totals, unexpected asynchronous payments, session conflicts, and refund/dispute events require manual review. Refunds do not automatically restore stock or mark orders fulfilled. A refund that arrives before completion is remembered by payment intent and blocks later fulfillment. Success UI confirms an order only after local order status is paid.

Expired holds are released lazily on the next reservation or by the service-only `expire_inventory_reservations()` RPC. The existing image worker now supports an optional sweep with `COMMERCE_MAINTENANCE_ENABLED=true`, disabled by default. It calls expiry once before image jobs, supports maintenance-only runs and shares the same scheduler/lock; no extra daemon is needed. Each request has a ten-second deadline capped by the run budget, bounded response bytes and no in-run retry. An unconfirmed sweep fails the run and records `UNKNOWN` with a null released count; confirmed counts refer to product-reservation rows, not orders. The next run can retry idempotently.

No live schedule has been installed or verified. Until activation, expired reservations may appear active in admin views between checkout attempts. A client deadline does not prove cancellation of a database transaction: managed database/API statement and lock timeouts remain **UNKNOWN**. The expiry RPC updates expired rows in one transaction rather than row-batched sweeps. Payment after expiration goes to manual review even if a sweep has not run. See the [worker deployment runbook](../batch_helper/deploy/RUNBOOK.md).

## Implemented checkout admission

The public route first checks same-origin and the hard release gate. After a future authorized release, it requires server-verified Turnstile proof bound to the configured hostname, `checkout` action and attempt UUID, with a recent challenge timestamp. Verification has an eight-second deadline and bounded response size. The browser widget and server adapter exist; no real widget/account verification was performed.

Client scope is an HMAC of a normalized, trusted Cloudflare edge `cf-connecting-ip`, using a server-only secret. Browser identifiers and generic forwarded headers are ignored; the admission ledger stores the hash, order ID and timestamp, not raw IP or contact data. The raw address is sent to Turnstile for verification. Deployment must establish that only the trusted edge supplies this header; another hosting path needs an equivalent trusted adapter. This is a connection-level control, not customer authentication: shared addresses share a quota, and address changes can prevent a pending attempt from being resumed.

The owner settings panel now edits an audited admission policy after named super-admin authentication and MFA. Default policy is **disabled**, with limits of five successful new admissions per client in fifteen minutes, two active held orders per client and one hundred across the store. A transaction takes the same inventory advisory lock, checks all quotas and reserves stock atomically. Failed reservations consume no admission; release does not erase recent-attempt history. Review orders with active unexpired holds count toward active limits. Exact same-client/same-cart retries recover their frozen order without a second charge, including while new admissions are paused. The old unmetered reservation signature is closed.

Setting limits or enabling admission does **not** remove the hard checkout gate or configure payments. Enabling new admissions through the settings API also requires verification configuration, whose presence is not provider proof. Merchant policies, shipping rules and payment credentials are still outside this editor.

## Reproduce local checks

Run `npm ci`, `npm run test:run`, and `npm run test:reservations`. The SQL script applies all actual migrations and the seed to a disposable PGlite PostgreSQL instance, then checks failure paths. It never uses Supabase connection credentials. Vitest uses mocked provider responses for timeouts, definite failure, retry, expiration, and confirmed cancellation.

The 25 September verification report records 170 application tests and 36 checkout-admission SQL checks. Run `npm run test:backend` for admission and other backend SQL checks; the worker package's `npm test` and `npm run test:db` cover optional maintenance and its expiry SQL. Provider verification responses are mocked in application tests.

PGlite checks are sequential. The separate 25 September disposable PostgreSQL 17.11 run passed 15 assertions across nine contention scenarios, each with eight distinct concurrent connections: last-unit reservation, global batch admission, retained-byte capacity, stale order revisions, duplicate order-request replay, checkout recent-attempt limits, per-client active holds, store-wide active holds and exact checkout retries. The last-unit race committed one reservation; seven competing attempts received OUT_OF_STOCK. `scripts/verify-native-concurrency.mjs` reproduces these checks against an explicitly prepared empty database over a local Unix socket. These results do not establish managed Supabase behavior, expiry-versus-payment races, a live worker, remote statement timeout enforcement or provider lifecycle readiness.

## Required before enabling commerce

- Complete the remaining managed-backend workflow checks after the verified migration/RLS deployment: real owner invitation acceptance/MFA, scoped service-role and private storage operations, end-to-end batch approval/publication, backup/recovery rehearsal, and independent-connection last-unit/expiry-versus-payment tests on the approved project.
- Verified merchant Stripe account, test-mode session and webhook lifecycle, signing secret, events enabled, deployed raw-body signature validation, expiry/retry/reconciliation test, and operational alerts. Real provider behavior remains UNKNOWN.
- An operator process and protected interface for manual-review/refund/dispute reconciliation. V1 records exceptions but has no automatic refund execution, accounting reconciliation, or notification delivery.
- Approved shipping rates, destinations, tax handling, return/refund rules, privacy/retention, merchant/support identity, and real catalog availability. Current subtotal/total arithmetic checks do not prove that the configured shipping/tax policy is commercially correct.
- Activate and verify the implemented abuse controls on the deployed origin: real Turnstile widget/secret/hostname/action, trusted edge-header provenance, server-only client-hash secret, owner-approved quota policy, and mobile/shared-address/retry behavior. Anonymous UUIDs remain attempt capabilities, not customer authentication. The managed Supabase connection is established; real Turnstile/widget activation and deployed admission behavior remain unverified.
- Review global-lock throughput; install and verify the opt-in expiry schedule, fresh maintenance health and an expired test hold; prove managed statement/lock timeouts and provider timeout handling; establish operator failure alerts. Deploy preview code separately from any deliberate release-gate removal.

The platform currently demonstrates multi-host watching/shopping and preserves attribution. It does not claim production payment readiness, automatic social comment ordering, KOL payout accounting, or real stream permissions.

## Primary references

- [Cloudflare Turnstile server-side token validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare Turnstile widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/)

- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Stripe Checkout session expiration](https://docs.stripe.com/api/checkout/sessions/expire)
- [Stripe limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory)
- [Stripe webhook handling](https://docs.stripe.com/webhooks)
- [PostgreSQL advisory locks](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS)
