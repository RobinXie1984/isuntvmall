#!/bin/bash
# Resume only this previously prepared disposable database. Never resets data.
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/bin:/bin
source_root=$(cd "$(dirname "$0")/../.." && pwd)
test_root=$(dirname "$source_root")
[[ "$test_root" == */candidates/*stripe-sandbox* ]] || exit 1
test -f "$test_root/pgdata/PG_VERSION"
test -f "$test_root/postgrest.conf"
pg_ctl=/opt/homebrew/opt/postgresql@17/bin/pg_ctl
if ! "$pg_ctl" -D "$test_root/pgdata" status >/dev/null 2>&1; then "$pg_ctl" -D "$test_root/pgdata" -l "$test_root/postgres.log" start -w; fi
if ! curl --silent --fail --unix-socket /private/tmp/isuntvmall-stripe-20261102/postgrest.sock 'http://localhost/products?select=id&limit=1' >/dev/null; then
 nohup postgrest "$test_root/postgrest.conf" > "$test_root/postgrest-resume.log" 2>&1 < /dev/null &
 printf '%s\n' "$!" > "$test_root/postgrest.pid"
fi
