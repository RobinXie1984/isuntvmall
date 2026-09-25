# Named staff boundary

This module replaces the shared `suntv_admin` password/token with named Supabase Auth sessions. The old token functions always deny access. No account or membership is created by migrations.

## Contract

`requireStaff(request)` and `getStaff()` verify the access token with Supabase `getClaims`, revalidate identity with `getUser`, check the `session_id` against the live session table and local revocation ledger, then load the current active `staff_members` row. Roles come only from that row. User metadata is never an authorization input. The resulting staff object includes `id`, `email`, `role`, `kolId`, `aal`, and `sessionId`.

Use `requirePermission(staff, action, {kolId})` at each operation. SQL mutations must also check the current membership and target ownership, since authorization can change between the HTTP check and commit. Super administrator, operator and order operator sessions require verified `aal2`; the pending `aal1` cookie authorizes only the bounded MFA setup/verification flow. Access cookies last at most one hour; normal sessions deliberately require sign-in again instead of retaining refresh tokens. The pending MFA refresh cookie expires after ten minutes.

Six roles: `super_admin`, `operator`, `catalog_editor`, `kol`, `order_operator`, `analyst`. Batch submission remains allowlisted to super administrator, operator, catalog editor and assigned KOL. Batch approval remains super-administrator only. Expanded roles do not broaden SQL `batch_require_staff` or batch ownership. Operators can read orders but cannot change fulfillment.

## Team management

Super administrators with `aal2` can change existing memberships or explicitly invite an email using the supported `inviteUserByEmail` API. The invitation endpoint reserves a request ID before calling the provider, records the result privately and separately commits membership through `staff_set_member`. Failed membership never grants access; its invitation record remains pending for review. Existing-member repair can complete a pending invitation. No retries automatically resend email. Self-membership edits are forbidden and SQL serializes changes to prevent last-super-administrator races. Membership changes are audited.

Configure the Supabase Auth Site URL and allowed redirect URL `https://www.isuntvmall.com/admin/invite`, plus functional email delivery. The invitation callback accepts the provider's implicit invitation fragment, immediately removes it from the URL, holds tokens only in component memory, and sets a password through the supported Auth API after server identity/membership verification. It then revokes that session and redirects to named sign-in; privileged members must complete MFA. No credentials are sent to logs, stored in localStorage or included in source.

## Verification

`vitest run src/lib/staff src/lib/batch/auth.test.ts` checks role separation, identity proofs, ownership, revocation, invitation side-effect gates and MFA session promotion with mocked provider calls. `node scripts/verify-staff.mjs` executes the real staff migration in isolated PGlite and checks RPC admission, ownership, grants, audit records and session revocation. These tests do not prove real SMTP delivery, actual Auth MFA enrollment or live database deployment; those require integration validation against the configured project. No real invitations or accounts were created during implementation.
