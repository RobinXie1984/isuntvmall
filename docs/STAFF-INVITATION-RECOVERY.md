# Staff invitation and password setup recovery

The email link and the browser setup session have different lifetimes. An unused email link uses the provider’s configured expiry (currently seven days, owner-approved). Opening it consumes that one-time confirmation and creates a setup session. An email-confirmed account does not prove a password was set.

## Colleague steps

1. Open the newest staff invitation or password setup email.
2. Wait for the setup screen to validate the link and show your invited email.
3. Set a password of at least 12 characters.
4. Sign in at `/admin/login` and complete the required authenticator setup/verification.

Reloading or switching the site language during setup is supported. The protected browser setup cookies expire after one hour without activity; they do not grant console access. After successful password setup, the setup session is revoked and its cookies cleared.

If a colleague already opened the invitation but did not finish setting a password, check their Auth account state. For a confirmed account, send a supported password-recovery email with redirect to `/admin/invite`; do not delete/recreate their identity or change their membership. Use the existing configured sender. Do not repeatedly resend or consume a colleague’s personal link while testing. Supabase’s recovery API may return generic success; verify the target account’s recovery timestamp and delivery separately.

## Operator verification

Check actual provider identity, active membership, ready invitation record, session validation and provider errors independently. “Missing setup session” is not proof of email expiry. No passwords, tokens or full authentication URLs should appear in support screenshots, logs or reports. Maintain normal sign-in and MFA; never bypass them to resolve onboarding.

Regression coverage: client remount/effect replay, full reload, failed request, invalid/expired token, cross-origin request, absent/inactive membership, ready-invitation requirement, rejected password retry, success cleanup and revoked-session replay. Production acceptance uses synthetic accounts and generated links (no test emails), then disables their access and revokes sessions.
