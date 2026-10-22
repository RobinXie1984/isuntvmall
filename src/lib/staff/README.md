# Named staff boundary

This module replaces the shared `suntv_admin` password/token with named Supabase Auth sessions. The old token functions always deny access. No account or membership is created by migrations.

## Contract

`requireStaff(request)` and `getStaff()` verify the access token with Supabase `getClaims`, revalidate identity with `getUser`, check the `session_id` against the live session table and local revocation ledger, then load the current active `staff_members` row. Roles come only from that row. User metadata is never an authorization input. The resulting staff object includes `id`, `email`, `role`, `kolId`, `aal`, and `sessionId`.

Use `requirePermission(staff, action, {kolId})` at each operation. SQL mutations must also check the current membership and target ownership, since authorization can change between the HTTP check and commit. Super administrator, admin, operator and CSR sessions require verified `aal2`; the pending `aal1` cookie authorizes only the bounded MFA setup/verification flow. Access cookies last at most one hour; normal sessions deliberately require sign-in again instead of retaining refresh tokens. The pending MFA refresh cookie expires after ten minutes.

Ten roles: `business_super_admin`, `finance_admin`, `merchandise_admin`, `super_admin`, `admin`, `operator`, `catalog_editor`, `kol`, `order_operator`, `analyst`. The display name for `order_operator` is CSR; stored memberships and order assignments retain the stable key. Batch submission is allowlisted to super administrator, admin, operator, catalog editor and assigned KOL. Admin inherits every operator permission and can review all batches and approve/publish merchandise. Other submitters remain limited to their own batches. Admin and Operator can read masked order exceptions but cannot change fulfillment. Business Super Admin manages operations, colleague access and refund review; technical settings/admission limits stay technical-super-administrator only. Finance Admin has read/export-only financial access; Merchandise Admin manages product drafts, categories, private supplier information, approved media submissions and inventory, with no publication, financial or team access. Admin cannot invite, edit, deactivate or remove any staff account.

## Team management

Technical and Business Super Admins with `aal2` can change permitted existing memberships or explicitly invite an email using the supported `inviteUserByEmail` API. The invitation endpoint reserves a request ID before calling the provider, records the result privately and separately commits membership through `staff_set_member`. Failed membership never grants access; its invitation record remains pending for review. Existing-member repair can complete a pending invitation. No retries automatically resend email. Business Super Admin cannot assign or alter technical super administrators. All three new roles require MFA. Self-membership edits are forbidden and SQL serializes changes to prevent last-super-administrator races. Membership changes are audited.

Configure the Supabase Auth Site URL and allowed redirect URL `https://www.isuntvmall.com/admin/invite`, plus functional email delivery. The invitation callback accepts the provider's implicit invitation fragment, immediately removes it from the URL, holds tokens only in component memory, and sets a password through the supported Auth API after server identity/membership verification. It then revokes that session and redirects to named sign-in; privileged members must complete MFA. No credentials are sent to logs, stored in localStorage or included in source.

## Verification

`vitest run src/lib/staff src/lib/batch/auth.test.ts` checks role separation, identity proofs, ownership, revocation, invitation side-effect gates and MFA session promotion with mocked provider calls. `node scripts/verify-staff.mjs` executes the real staff migration in isolated PGlite and checks RPC admission, ownership, grants, audit records and session revocation. These tests do not prove real SMTP delivery, actual Auth MFA enrollment or live database deployment; those require integration validation against the configured project. No real invitations or accounts were created during implementation.

## Colleague release (22 October 2026)

Role-specific practical manuals are at `/admin/help` after sign-in. Finance exports all stored order records (fails explicitly above 20,000), labels test/confirmed/unpaid/unverified evidence and retains unknown amounts. No Stripe connection or live-money execution is implied. Supplier drafts/audit live in the private schema. Product copy/media visibility publication uses saved revisions; existing-product image additions reuse the reviewed batch worker without overwriting product facts.

Verification: `node scripts/verify-colleague-roles.mjs` exercises all migrations, including real service-role column grants. Separate temporary managed Auth accounts are required for production acceptance and must be revoked afterward. Onboarding uses named invitations, individual passwords and individual TOTP authenticators; never share the technical owner account.
