# Merchandise batch helper

A working, bounded image-normalization engine and a durable approval workflow. The storefront remains MUJI. Selecting another preset affects this batch's presentation only. No paid AI service, background removal, recoloring or product invention is used.

## What V1 does

- One JPEG, PNG or WebP becomes one draft product. Up to 1,000 image records per batch; larger catalogues use several batches.
- Preserves originals; applies EXIF orientation, converts to sRGB, removes metadata, contains the entire image on a 1,600 px square with the selected preset's padding and neutral background, and writes WebP.
- Rejects animations, corrupt files, false MIME declarations, SVG and other formats, inputs over 24 MiB and images over 40 million pixels. Processing concurrency defaults to two locally, at most four; the online worker processes one item at a time.
- Records source/output SHA-256, preset fingerprint and output revision. Local runs resume exact verified outputs. Different bytes, settings or processor versions create another output revision.
- Draft merchandise needs SKU, separate English and Traditional Chinese titles and descriptions, category, price in HKD minor units, and stock before approval. Human review must confirm image fidelity and merchandising accuracy.
- Only a currently active super admin can approve. Approval binds the reviewed revision. Only approved images and product data can become public catalogue entries.

This is deterministic presentation normalization, not an AI restyling service. It cannot remove an existing photographic background or turn an ordinary photo into a studio shoot. The full original composition remains inside the padded frame, so some originals will still need manual reshooting.

## Local processing

Install dependencies with `npm ci` in this folder. Use Node 22 or later.

```sh
node cli.mjs --input /absolute/path/to/originals --output /absolute/path/to/new-output --style muji --concurrency 2
```

Allowed styles: `muji`, `apple`, `amazon`, `openai`, `daks-burberry`, `hermes-valentino`. The output folder must be outside the input folder. Only immediate regular files are processed; directories and symlinks are excluded. Unsupported files get a failure record. Originals are never modified. A manifest records every successful or failed attempt; successful items remain `review`. Editing a local manifest cannot publish anything.

A `.batch-lock` prevents concurrent commands sharing one output folder. A killed process may leave that lock: confirm that process has stopped before removing only the lock and rerunning. Output filenames include revision and content hash; old versions remain available. The command exits nonzero if any file failed, so partial failures are visible.

## Online staff workflow

The application authenticates Supabase users, then reads active roles from `staff_members` on every operation. Role information supplied by a browser is ignored. Editors can work only on their own batches; super admins can review all. Supabase tables and RPC functions deny anonymous and ordinary authenticated direct access. Original and processed storage buckets are private; the server issues short-lived URLs for authorized operations. All elevated credentials stay server-side.

1. Authenticated editor creates metadata (one stable request UUID makes retries idempotent).
2. Browser uploads each original to its unique private path; the server verifies storage metadata before queuing it.
3. A bounded worker claims a lease, decodes and normalizes the actual bytes, stores an immutable output, and submits its hashes.
4. Editor completes product fields and compares original/output. Super admin approves or rejects.
5. Worker verifies the approved hash and active approver again, copies the immutable approved output into `product-images`, verifies uploaded bytes, then publishes product + image in a single SQL transaction.

```sh
# Set these through the existing approved secret store, never in source control:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BATCH_HELPER_ENABLED=true
node worker.mjs --once --limit 20 --max-seconds 900
```

Every SDK request has a 30-second deadline that covers headers and body reads. Responses are streamed with caps before Blob allocation: 24 MiB for originals, 8 MiB for processed/published images and 1 MiB for API replies. A run defaults to a 15-minute budget; it stops starting work when that budget expires and has a five-second shutdown guard. Interrupted work is recovered through lease expiry, not concurrent overwrite.

The migration refuses any existing bucket whose privacy, maximum size or allowed MIME set differs from the expected configuration. It does not silently modify conflicting user settings. `batch-originals` and `batch-processed` must be private; `product-images` remains public with its existing eight-MiB image policy.

No daemon, scheduled job, staff account, credential or remote database is created by this package. The online workflow is inactive until the owning deployment has a configured Supabase project, applies the migration, explicitly provisions staff membership, enables batch mode, and arranges operator worker runs. `BATCH_HELPER_ENABLED=true` must also disable legacy catalogue write paths in the application so they cannot bypass review. Real payment activation is a separate release gate.

## Recovery rules

| Event | Result |
| --- | --- |
| Network retry during creation | Same request UUID + exact payload returns the original batch. Changed payload is rejected. |
| Worker crashes | Ten-minute lease expires; another bounded run may reclaim it. Maximum three claims before manual recovery. |
| Old worker finishes late | Lease token, expiry and revision checks reject it. |
| Crash after immutable upload | Next worker accepts existing bytes only when the SHA-256 matches. No overwrite. |
| Editor changes approved metadata | New revision; approval cleared; returns to review. |
| Super admin revoked | Claim or publish stops. It cannot publish using the old approval. |
| SKU already exists | Publication transaction fails; existing product is never overwritten. |
| Failed/rejected item explicitly retried | New revision, approval cleared. With an existing output it returns to review; otherwise it queues processing. |
| Duplicate publish completion | Returns the already published product for the same revision/hash without duplicating it. |

A public image copy may remain unlisted if revocation or a transaction failure occurs between the copy and publication; it contains previously approved product imagery, not private originals. Orphan cleanup is deliberately separate and must check references before deleting any object. Local manifests, source files and stored originals are not automatically deleted.

## Validation

```sh
npm test
npm run test:db
```

The database test imports the actual migrations into local WASM PostgreSQL and checks ownership, role denial, atomic creation, idempotency, stale leases, invalid approvals, revocation, SKU collision, retry and duplicate publication. This is not proof that a remote Supabase project, storage policies, auth configuration or credentials have been activated; those require deployment smoke tests.

## Limits and next additions

V1 deliberately requires explicit product metadata and one image per product. Multi-image product grouping, variants, CSV joins, per-image crop selection, virus scanning, duplicate-product detection, resumable TUS uploads for large individual files, and remote worker scheduling remain separate additions. Image normalization preserves composition but a human must verify color and product claims after lossy compression. Public rights, food labels, tax, shipping and refund policies remain merchant responsibilities.
