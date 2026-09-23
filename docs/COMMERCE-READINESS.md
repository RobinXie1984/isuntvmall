# Commerce release boundary

Checkout remains **HOLD** in code. Credentials alone cannot enable it. The preview does not place orders, reserve real stock, contact payment providers, or accept webhook mutations. No production database migrations or provider calls were performed for this implementation.

## Implemented and locally checked

`reserve_checkout` creates one immutable order per browser attempt UUID, locks inventory, and reserves the aggregated quantity of every SKU across all room-attributed order lines. `stock_qty` is physical on-hand quantity; sellable quantity is on-hand minus active reservations. Price, policy, source attribution, and currency are validated or snapshotted on the server. Stock edits below held quantity fail. The former unreserved order/fulfillment RPCs are revoked from the service role.

V1 serializes inventory operations with one transaction-scoped advisory lock, then locks products in UUID order. This is deliberately simple and limits throughput. Product updates take the same lock before row locks. Payment, expiration, release, and replay checks run in transactions. Wall-clock time is checked after acquiring locks so a waiting transaction cannot use its older transaction-start timestamp to extend a hold.

Reservations last 40 minutes. Stripe sessions are card-only, expire at the reservation deadline, and use a stable idempotency key and frozen order items/policy. Session creation is refused when fewer than 30 minutes remain, because Stripe requires a longer creation window. A missing local session link is not proof that no session exists. Connection errors, provider conflicts, and ambiguous creation/attachment outcomes retain the hold. Definite Stripe invalid-request rejection releases it. The cancel endpoint releases only after retrieving or expiring the provider session and confirming expiration. Visiting a cancel URL never releases inventory. An explicit return-flow cancel button is gated with checkout and confirms the server response. Paid, reviewed, refunded, or unresolved attempts return `CHECKOUT_PAYMENT_PENDING`; they retain their attempt identifier and must not prompt another payment. Only confirmed cancelled/failed attempts can rotate.

Signed webhook facts must match the order, subtotal, currency, total arithmetic, and intact reservation. Event IDs deduplicate successfully recorded replays. Unknown orders raise an error without inserting an event receipt, so the same provider event can retry after recovery. A second completion cannot consume inventory again. Late paid events, missing holds, incompatible totals, unexpected asynchronous payments, session conflicts, and refund/dispute events require manual review. Refunds do not automatically restore stock or mark orders fulfilled. A refund that arrives before completion is remembered by payment intent and blocks later fulfillment. Success UI confirms an order only after local order status is paid.

Expired holds are released lazily on the next reservation or by the server-only `expire_inventory_reservations()` RPC. A scheduled sweep is **not configured**. Until an operator configures it, expired reservations may appear active in admin views between checkout attempts. Payment after expiration goes to manual review even if a sweep has not run.

## Reproduce local checks

Run `npm ci`, `npm run test:run`, and `npm run test:reservations`. The SQL script applies all actual migrations and the seed to a disposable PGlite PostgreSQL instance, then checks failure paths. It never uses Supabase connection credentials. Vitest uses mocked provider responses for timeouts, definite failure, retry, expiration, and confirmed cancellation.

These are sequential SQL execution checks, **not evidence of overlapping database connections**. Native PostgreSQL binaries were unavailable in the inspected test environment. Independent multi-connection contention tests against an authorized disposable PostgreSQL/Supabase environment remain UNKNOWN.

## Required before enabling commerce

- Authorized, active Supabase project; migration review/application, RLS/service-role access verification, backup/recovery rehearsal, and two-connection last-unit/expiry-versus-payment tests.
- Verified merchant Stripe account, test-mode session and webhook lifecycle, signing secret, events enabled, deployed raw-body signature validation, expiry/retry/reconciliation test, and operational alerts. Real provider behavior remains UNKNOWN.
- An operator process and protected interface for manual-review/refund/dispute reconciliation. V1 records exceptions but has no automatic refund execution, accounting reconciliation, or notification delivery.
- Approved shipping rates, destinations, tax handling, return/refund rules, privacy/retention, merchant/support identity, and real catalog availability. Current subtotal/total arithmetic checks do not prove that the configured shipping/tax policy is commercially correct.
- Rate limiting/abuse controls for public reservation attempts. Anonymous UUIDs are high-entropy attempt capabilities, not customer authentication. Do not open the endpoint without anti-hoarding controls and operational quotas.
- Review global-lock throughput, periodic expiration scheduling, provider timeout handling, and operator failure alerts. Deploy preview code separately from any deliberate release-gate removal.

The platform currently demonstrates multi-host watching/shopping and preserves attribution. It does not claim production payment readiness, automatic social comment ordering, KOL payout accounting, or real stream permissions.

## Primary references

- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Stripe Checkout session expiration](https://docs.stripe.com/api/checkout/sessions/expire)
- [Stripe limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory)
- [Stripe webhook handling](https://docs.stripe.com/webhooks)
- [PostgreSQL advisory locks](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS)
