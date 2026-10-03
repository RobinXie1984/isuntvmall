# White-label V1 handoff

## What Robin receives

A reusable MUJI-style livestream commerce template, with iSunTVMall as its first demonstration. Each future client can supply a validated public profile and deploy the same application commit independently. The included neutral profile is a local proof of configuration separation, not a new customer or merchant.

The immediate scope is template-first. Do not open Stripe, create a new client database, provision staff for an unknown company or publish an invented merchant. Stripe setup follows when Robin supplies the relevant account. A separate Supabase project follows only after a real B2B client is confirmed.

## Standard service scope

- Brand identity, configured homepage copy/assets, icons and metadata using the existing MUJI layout.
- Four supported UI languages, with a configurable supported subset and default. Merchant-authored product text still needs supplied translations.
- Catalogue browsing, search, category filters, product detail and persistent shopping bag.
- Selected demo catalogue, or isolated merchant catalogue with no sample fallback.
- Multiple supported livestream rooms and featured-product rails; platform rights/playback checks remain required for real broadcasts.
- Named staff authentication and role-based access; merchandise review/publishing, scoped orders and the available operations modules.
- Purchase-information, privacy, terms and contact pages displaying supplied text or clearly absent information.
- Profile/build/deployment instructions and bounded validation evidence supplied with a release receipt.

## Minimal staff setup for a confirmed client

1. **Super Admin:** start with the verified owner. Only this role manages staff access and owner-only settings. Require MFA. Do not grant it broadly or change the existing iSun owner during template work.
2. **Admin:** add the trusted day-to-day manager. Has Operator rights plus merchandise approval/publication and cross-batch review. Cannot invite, edit, deactivate or remove staff. Require MFA.
3. **CSR:** add customer-service/fulfillment staff as needed. Access is limited to assigned order tasks; it does not confer catalogue or staff administration. Require MFA. The internal stable role key remains `order_operator`.

Operator, Catalog editor, KOL and Analyst remain available when a client needs those responsibilities separated. Do not create accounts merely to demonstrate a role. Exercise permission boundaries through isolated test fixtures first; use real invitations only for an authorized real staff member.

## Inputs required when a real client is confirmed

Provide the actual brand identity/assets/domain, legal merchant/contact details, product catalogue with trustworthy prices/stock, permitted livestream sources and merchant-supplied shipping/returns/privacy/terms. Confirm the client owner and staff assignment. Record missing inputs rather than filling them with invented policies.

Then prepare an independent project and deployment using the same code. Keep merchant credentials private and separate. Configure redirects, origins, storage, named identity, migrations and worker only for that client. Payment activation is a separate acceptance step, including the real provider account and successful end-to-end evidence.

## Exclusions from standard V1

- Shared multi-tenant database/customer isolation within one project.
- Arbitrary currencies, FX conversion, jurisdiction-specific tax/legal-policy authorship.
- Automatic translation of unknown merchant copy.
- Unsupported social-platform mirroring, circumventing embed restrictions or assuming rights to a stream.
- Production payment activation merely because keys exist; unapproved financial refund execution, automatic KOL payouts or a functioning USDT rail without its own integration and acceptance.
- Unbounded supplier import, AI alteration of product facts, approval bypass or overwriting existing SKUs.
- Guaranteed production scalability, delivery times, regulatory readiness or provider access without measured evidence.

New requirements should be scoped and priced separately instead of silently becoming template promises. Preserve the original iSun demo and its audit records during client-specific work.

## Handoff acceptance boundary

The release owner supplies the exact source commit, profile ID/hash, build target, artifact location, checks performed, local render proof and any deployed version/URL. The profile documents describe behavior and reproducible checks; they do not substitute for a release receipt.

Before a future client is live, prove profile/credential separation, staff restrictions, correct catalogue and mobile/language behavior, honest purchase information, authorized playback and the approved payment/order lifecycle. Until then, retain a clearly labeled demonstration and closed ordering. No real client infrastructure is implied by the presence of the neutral proof profile.
