# Local ownership and reviewed backups

Robin's effective storage amendment (17 November 2026) allows Maimai/iMac project homes on the local drive. iSunTVMall keeps its established home at `/Users/robin/Developer/RobinOS/10_isuntvmall`; do not create another working copy or move existing folders. Studio archives remain preserved and are no longer a mandatory destination for each new iMac build/media copy.

The effective approved policy is `/Users/robin/Documents/Codex/2026-08-21/q/work/two_machine_rule_20261117/APPROVED_POLICY.md`. Shared Studio-governance synchronization is separately pending connectivity; do not claim the shared law was changed remotely. The existing **Maimai month-end backup** automation runs at 18:00 HKT on the last day of each month. Reuse that job; do not create a duplicate schedule.

For this project, back up the reviewed Git source commit including approved brand clips, plus reviewed non-reproducible source sections and provenance from the local delivery allowlist. Store a dated private package under the existing Google Drive `My Drive/Bin/Maimai_backup/YYYY-MM-DD/isuntvmall` hierarchy. Preserve source commit, SHA-256/file counts/bytes/exclusions and restore instructions. Verify local archive integrity and independent cloud readback. Keep local originals and existing Studio copies.

Exclude `.git` object stores, dependencies, virtual environments, build caches, `.env`/credentials/keys, account/browser state, production database/customer/order exports and unreviewed personal data. A source/media package is not a production database or credential backup and does not prove recovery of every historical artifact. Older unique source originals still held on Studio must be inventoried before any retirement or deletion.

The deployment receipt and exact private project backup location are recorded locally under `reports/product-clips-release-20261117`. No disk cleanup, eviction, bulk migration, permission change or older-backup deletion is authorized by creating this backup.

Prepare a unique local package with `python3 scripts/backup-reviewed-source.py --repo /Users/robin/Developer/RobinOS/10_isuntvmall --out /private/new-path/isuntvmall_<date>_<commit>.zip`. The helper enforces the project allowlist, blocks credential-like content/paths, keeps a disk reserve, records missing artifacts and verifies a local restore. Upload through the authorized Drive connector; separately retrieve cloud bytes and compare the archive SHA-256 before recording cloud verification. The helper neither uploads nor schedules nor deletes originals.
