# Managed database deployment

The iSunTVMall Supabase project is `fikmqessuraosgoyxede` in the iSunTV Pro organization, created on 26 September 2026. Its project URL is `https://fikmqessuraosgoyxede.supabase.co`; the project reference and URL are public identifiers, not credentials.

The GitHub integration connects only `RobinXie1984/isuntvmall`, uses working directory `.`, and deploys migrations from `main`. Automatic preview branching is disabled. New migration files are reviewed and tested locally before being pushed. Existing migration files must not be rewritten after deployment.

## Verified state — 26 September 2026

The deployment checks for source `c4d0079` confirmed all eleven migrations applied, twenty-four application tables with row-level security enabled, and no anonymous application-table grants. Cloudflare and Studio runtimes are connected using approved runtime secrets, including the existing service-role fallback `SUPABASE_SERVICE_ROLE_KEY`; no credential values are stored here. These checks establish this deployment state, not every Supabase behavior.

A reviewed, separate one-time import preserved 96 explicitly marked demo products, 96 images, three fictional hosts, three public preview rooms and eighteen product links. The later explicit-demo batch migration is also applied. Owner sign-in and verified TOTP MFA are now confirmed after the supported invitation and marked first-owner bootstrap; no password, factor secret or owner identity is published here.

Production batch access is enabled. One demo item completed owner-authenticated upload, image review and revision-bound approval, with normalization and publication performed by bounded manual worker passes. Thirty-one read-only publication checks passed: existing private originals/processed objects denied unsigned public access; service downloads matched their hashes; the public derivative returned HTTP 200 with the approved hash; the published row retained `is_demo=true`, zero stock and reviewed bilingual copy; orders remained zero. The catalogue now has 97 demo products. This does not create verified broadcasts or saleable merchant inventory.

The earlier connected release passed 184 application checks and 143 HTTP checks; the explicit-demo batch release passed 186 application tests and its connected deployment passed 143 HTTP checks. The prepared `com.isuntvmall.batch-worker` LaunchAgent was activated in `gui/501` at 10:30:21 UTC on 26 September, with a 60-second interval, 20-job limit and 45-second run budget. Two distinct automatic idle cycles exited successfully, each completing zero jobs with zero failures and releasing its lock. Afterward, the database remained at 97 products/images, one batch/item, seven batch audit records, zero orders and zero reservations. This establishes idle scheduling, not a nonempty scheduled workload or restart recovery. Inventory-expiry maintenance remains disabled. Ordinary authenticated-user storage isolation, large-batch throughput, recovery, actual KOL/provider playback and payment merchant/lifecycle checks remain unresolved. Real checkout stays closed.

Google Workspace alias-domain setup for the storefront domain is verified, including MX, SPF and DKIM setup status. External mail delivery and per-user sending remain untested; this does not establish Supabase Auth SMTP delivery configuration.

The ordered files in `supabase/migrations/` define the backend. Future seed/import work, Auth configuration changes, staff onboarding and worker configuration changes remain separate actions; a GitHub connection alone is not evidence of them. Keep preview merchandise and real merchant data distinct.

For subsequent deployments, recheck migration history, required tables/functions, row-level security, service-role grants and private storage behavior against the actual managed project. Preserve the owner MFA and one-item workflow evidence, then verify the remaining scoped-storage, nonempty scheduled-workload, scale and restart/recovery behavior; schema and HTTP checks do not substitute for these workflows. The code-level checkout release gate remains closed until the independent requirements in [commerce readiness](../docs/COMMERCE-READINESS.md) pass.

Never place database passwords, management tokens, secret API keys or customer uploads in this repository. The Supabase integration manages its own access; application credentials belong in their approved runtime secret stores.
