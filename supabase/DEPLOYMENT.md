# Managed database deployment

The iSunTVMall Supabase project is `fikmqessuraosgoyxede` in the iSunTV Pro organization, created on 26 September 2026. Its project URL is `https://fikmqessuraosgoyxede.supabase.co`; the project reference and URL are public identifiers, not credentials.

The GitHub integration connects only `RobinXie1984/isuntvmall`, uses working directory `.`, and deploys migrations from `main`. Automatic preview branching is disabled. New migration files are reviewed and tested locally before being pushed. Existing migration files must not be rewritten after deployment.

## Verified state — 26 September 2026

The deployment checks for source `c4d0079` confirmed all eleven migrations applied, twenty-four application tables with row-level security enabled, and no anonymous application-table grants. Cloudflare and Studio runtimes are connected using approved runtime secrets, including the existing service-role fallback `SUPABASE_SERVICE_ROLE_KEY`; no credential values are stored here. These checks establish this deployment state, not every Supabase behavior.

A reviewed, separate one-time import preserved 96 explicitly marked demo products, 96 images, three fictional hosts, three public preview rooms and eighteen product links. It created no real saleable inventory or verified broadcasts. The first-owner Auth invitation was issued and the application membership provisioned through a marked manual bootstrap. Inbox delivery, private password setup and successful owner MFA remain **UNKNOWN**; no successful owner-authenticated session is claimed.

The application suite passed 184 checks, and the connected deployment passed 143 HTTP checks. The batch scheduler is not installed, authenticated end-to-end batch approval/publication remains **UNKNOWN**, and real checkout stays closed. Payment-provider, merchant onboarding, recovery and independent commerce-release gates remain unresolved.

The ordered files in `supabase/migrations/` define the backend. Future seed/import work, Auth configuration changes, staff onboarding and worker installation remain separate actions; a GitHub connection alone is not evidence of them. Keep preview merchandise and real merchant data distinct.

For subsequent deployments, recheck migration history, required tables/functions, row-level security, service-role grants and private storage behavior against the actual managed project. Complete real owner sign-in/MFA, storage/worker operations and end-to-end batch verification; schema and HTTP checks do not substitute for these workflows. The code-level checkout release gate remains closed until the independent requirements in [commerce readiness](../docs/COMMERCE-READINESS.md) pass.

Never place database passwords, management tokens, secret API keys or customer uploads in this repository. The Supabase integration manages its own access; application credentials belong in their approved runtime secret stores.
