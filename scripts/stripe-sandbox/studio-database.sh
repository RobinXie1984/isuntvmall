#!/bin/bash
# Disposable fixture database; Unix sockets only, no production credentials.
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/bin:/bin
source_root=$(cd "$(dirname "$0")/../.." && pwd)
test_root=$(dirname "$source_root")
[[ "$test_root" == */candidates/*stripe-sandbox* ]] || { echo 'Sandbox candidate path required'; exit 1; }
pg_bin=/opt/homebrew/opt/postgresql@17/bin
socket_dir=/private/tmp/isuntvmall-stripe-20261102
mkdir -m 700 "$socket_dir"
"$pg_bin/initdb" -D "$test_root/pgdata" --auth-local=trust --auth-host=reject --encoding=UTF8 --locale=C > "$test_root/initdb.log"
"$pg_bin/pg_ctl" -D "$test_root/pgdata" -l "$test_root/postgres.log" -o "-c listen_addresses='' -c unix_socket_directories='$socket_dir' -c unix_socket_permissions=0700 -p 55442" start -w
export PGHOST="$socket_dir" PGPORT=55442 PGUSER=headlessnick PGDATABASE=isuntvmall_contention_stripe_20261102 PSQL_BIN="$pg_bin/psql"
"$pg_bin/createdb" "$PGDATABASE"
cd "$source_root"
node scripts/verify-native-concurrency.mjs > "$test_root/native-concurrency.log" 2>&1
# Separate database for the interactive checkout; no destructive reuse of old data.
export PGDATABASE=isuntvmall_stripe_sandbox_20261102
"$pg_bin/createdb" "$PGDATABASE"
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 > "$test_root/database-init.log" <<'SQL'
create schema auth;
create table auth.users(id uuid primary key,email text,is_anonymous boolean default false);
create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
SQL
for migration in supabase/migrations/*.sql; do "$pg_bin/psql" -X -v ON_ERROR_STOP=1 -f "$migration" >> "$test_root/database-init.log" 2>&1; done
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 >> "$test_root/database-init.log" <<'SQL'
insert into auth.users(id,email) values('8c1b8ab4-088e-49d1-bca5-69d9461e5daa','sandbox-owner@example.com');
insert into staff_members(user_id,role) values('8c1b8ab4-088e-49d1-bca5-69d9461e5daa','super_admin');
select checkout_admission_policy_set('8c1b8ab4-088e-49d1-bca5-69d9461e5daa',true,50,20,100);
insert into products(id,sku,slug,title,description,price_amount,currency,stock_qty,status,is_demo,category) values('55b54363-ab4e-4d89-922f-8d35efb58001','SANDBOX-MUG','sandbox-mug','Sandbox test mug','Test fixture only. No goods or real payment.',12000,'hkd',20,'published',false,'Home & Living');
insert into product_images(product_id,source_url,alt_text,position) values('55b54363-ab4e-4d89-922f-8d35efb58001','/demo/tea.svg','Sandbox test fixture',0);
SQL
cat > "$test_root/postgrest.conf" <<CONF
db-uri = "postgresql:///isuntvmall_stripe_sandbox_20261102?host=$socket_dir&port=55442&user=headlessnick"
db-schemas = "public"
# OS-only socket access is the fixture boundary; this is NEVER a public server.
db-anon-role = "service_role"
server-unix-socket = "$socket_dir/postgrest.sock"
server-unix-socket-mode = "600"
CONF
nohup postgrest "$test_root/postgrest.conf" > "$test_root/postgrest.log" 2>&1 < /dev/null &
printf '%s\n' "$!" > "$test_root/postgrest.pid"
printf 'Isolated PostgreSQL and PostgREST started; no TCP listeners.\n'
