# Single scheduled batch worker

Stable service name: `com.isuntvmall.batch-worker`. Stable application name: `isuntvmall-batch-worker`. These files prepare a deployment; none installs a service or creates/copies credentials.

Use one Studio-owned runtime directory and the approved source checkout. Copy the non-secret example configuration into that runtime directory, set absolute paths, and retain the default one-minute schedule, 20 jobs per run, 45-second worker budget and 180-second freshness threshold. The runner has an independent maximum-duration guard. Only one run may own its lock. Each run overwrites a bounded status snapshot; it does not grow a permanent log file. Do not install another scheduler for the same queue.

Provision credentials through the existing approved secret mechanism on Studio. The launcher must inject `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `BATCH_HELPER_ENABLED=true` into the process environment. Never place credential values in the plist, JSON, repository, command arguments or a status report. The supplied plist is a template with explicit placeholders; replace them and validate it before installation. The root task owns activation.

Before scheduling:

1. Apply and verify all migrations. Check actual private object-access policies with anonymous and ordinary authenticated clients; bucket properties alone are insufficient.
2. Inventory existing original, processed and public objects, including orphaned paths, against the capacity ledger. The migration reserves historical item revision allowances but cannot discover objects that never belonged to a database item. Reconcile those through explicit reservations before enabling admission.
3. Confirm the configured allowance fits the approved hosting/storage plan. Pilot values are constraints, not a claim of included storage or permission to spend more.
4. Run `node worker.mjs --once --limit 1 --max-seconds 45` with approved environment. Verify original preservation, generated output, staff review, approved publication, quota charging and audit evidence using a designated staging batch.
5. Run `node scheduled-runner.mjs --config /absolute/runtime/worker.config.json` once, then `node scheduled-runner.mjs --config /absolute/runtime/worker.config.json --status`. Verify the bounded status file contains no credentials.
6. Only then install the single named scheduler using the owning task's deployment procedure. Record its exact source revision, config hash, runtime directory, service domain/label and rollback procedure.

Health distinguishes `RUNNING`, `HEALTHY`, `FAILED` and `UNKNOWN` (absent/stale evidence). A recent successful empty-queue run is healthy. Worker failure, quota rejection and stale status need diagnosis; a healthy scheduler alone does not prove a product was approved or published. No notification service is configured here.

For a retained crash lock: stop the named scheduler first, inspect `state/run.lock/owner.json`, verify both runner and child have exited, preserve the small lock/status records as incident evidence, then remove only that exact abandoned lock directory. Restart the same service and confirm status freshness. Never clear a lock while its process is alive. Database leases expire independently; no manual item status override is needed.

Pause by stopping the named scheduler. Pause new storage admissions with the super-admin capacity policy if needed. Roll back source only to a version that understands `batch_reserve_object`; old workers are blocked at database completion. Retained originals and old derivative reservations are never automatically released when items are published, rejected, edited or retried. A later retention/cleanup workflow must verify object deletion and references before any budget release; no such destructive workflow is included.
