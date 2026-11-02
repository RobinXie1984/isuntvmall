#!/bin/bash
set -euo pipefail
source_root=$(cd "$(dirname "$0")/../.." && pwd)
test_root=$(dirname "$source_root")
[[ "$test_root" == */candidates/*stripe-sandbox* ]] || exit 1
if [[ -f "$test_root/postgrest.pid" ]]; then
 test_pid=$(cat "$test_root/postgrest.pid")
 [[ "$test_pid" =~ ^[0-9]+$ ]] || exit 1
 # Never signal a recycled PID belonging to an unrelated process.
 test_command=$(ps -p "$test_pid" -o command= || true)
 if [[ "$test_command" == *"postgrest $test_root/postgrest.conf"* ]]; then kill "$test_pid"; fi
fi
pg_ctl=/opt/homebrew/opt/postgresql@17/bin/pg_ctl
if "$pg_ctl" -D "$test_root/pgdata" status >/dev/null 2>&1; then "$pg_ctl" -D "$test_root/pgdata" stop -m fast -w; fi
