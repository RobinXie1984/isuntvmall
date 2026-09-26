# Managed database deployment

The iSunTVMall Supabase project is `fikmqessuraosgoyxede` in the iSunTV Pro organization, created on 26 September 2026. Its project URL is `https://fikmqessuraosgoyxede.supabase.co`; the project reference and URL are public identifiers, not credentials.

The GitHub integration connects only `RobinXie1984/isuntvmall`, uses working directory `.`, and deploys migrations from `main`. Automatic preview branching is disabled. New migration files are reviewed and tested locally before being pushed. Existing migration files must not be rewritten after deployment.

The ordered files in `supabase/migrations/` define the backend. Production seed data, Auth configuration, actual staff accounts, runtime credentials and worker installation are separate steps. Do not infer that they were deployed from a successful GitHub connection. Keep preview merchandise and real merchant data distinct.

After a deployment, verify the migration history, required tables/functions, row-level security, service-role grants and private storage buckets against the actual managed project. Then verify named staff/MFA and end-to-end batch operations. The code-level checkout release gate remains closed until the independent requirements in [commerce readiness](../docs/COMMERCE-READINESS.md) pass.

Never place database passwords, management tokens, secret API keys or customer uploads in this repository. The Supabase integration manages its own access; application credentials belong in their approved runtime secret stores.
