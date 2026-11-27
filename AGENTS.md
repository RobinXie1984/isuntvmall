<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## iSunTVMall ownership and backup

Robin's effective 17 November 2026 storage amendment permits this Maimai/iMac project to keep its authoritative working home at `/Users/robin/Developer/RobinOS/10_isuntvmall`. Build and retain new task evidence locally; do not create redundant Studio copies by default. Preserve historical Studio archives. The amendment is recorded at `/Users/robin/Documents/Codex/2026-08-21/q/work/two_machine_rule_20261117/APPROVED_POLICY.md`; shared Studio-governance synchronization is separately pending connectivity.

Use the existing GitHub repository for reviewed versioned source and the existing `maimai-month-end-backup` automation for dated private Drive backups. Follow `docs/backups/README.md` and its allowlist; do not duplicate the schedule, upload credentials/runtime/customer data, remove originals or infer whole-project recovery from a source-only archive.

## Local worktrees and release history

Use the root checkout for the Mall and put local linked checkouts under the
Git-ignored `.worktrees/` directory. Move registered checkouts with
`git worktree move` after checking for active use, and verify branch, HEAD and
working state after the move. Keep build outputs and private receipts in
task-owned ignored directories. Record dated public release notes in
`CHANGELOG.md` and preserve the underlying commits in the existing GitHub repo.
