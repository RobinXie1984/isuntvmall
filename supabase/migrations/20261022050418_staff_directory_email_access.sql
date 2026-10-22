-- Auth Admin already exposes named-account emails to this same server credential.
-- Permit the bounded service-only staff_directory RPC to join that email column.
grant select(email) on auth.users to service_role;
