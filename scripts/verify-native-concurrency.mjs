// Run only against a disposable, empty PostgreSQL database over a Unix socket.
// No provider SDK, production credential or TCP connection is used.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const psql = process.env.PSQL_BIN || '/opt/homebrew/opt/postgresql@17/bin/psql';
const socket = process.env.PGHOST, database = process.env.PGDATABASE, port = process.env.PGPORT || '55439';
assert(socket?.startsWith('/'), 'A local Unix socket PGHOST is mandatory');
assert(/^isuntvmall_contention_[a-z0-9_]+$/.test(database || ''), 'Use a disposable isuntvmall_contention_* database');
assert(/^\d{4,5}$/.test(port), 'Explicit test port required');
assert(!process.env.PGPASSWORD && !process.env.PGSERVICE, 'No credentials or service connection configuration allowed');
const environment = { PATH: '/usr/bin:/bin:/opt/homebrew/bin', LANG: 'en_US.UTF-8', PGHOST: socket, PGPORT: port, PGDATABASE: database, PGUSER: process.env.PGUSER || process.env.USER, PGCONNECT_TIMEOUT: '5' };
const args = ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'];
const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const json = value => `${literal(JSON.stringify(value))}::jsonb`;
const sql = statement => execFileSync(psql, [...args, '-c', statement], { env: environment, encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 }).trim();
const number = statement => Number(sql(statement));
const receipt = { scriptSha256: createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'), engine: execFileSync(psql, ['--version'], { encoding: 'utf8' }).trim(), startedAt: new Date().toISOString(), database, unixSocketOnly: true, liveDatabaseTouched: false, concurrentConnectionsTested: true, migrations: [], checks: [] };
const check = (name, condition, detail = {}) => { assert.ok(condition, name); receipt.checks.push({ name, ...detail }); console.log(`PASS ${receipt.checks.length}: ${name}`); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
check('connection uses Unix socket, not TCP', sql('select inet_server_addr() is null') === 't');
check('database has no application tables before setup', number("select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema')") === 0);
sql('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,is_anonymous boolean default false); create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz); create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
for (const file of readdirSync(path.join(root, 'supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
 const source = readFileSync(path.join(root, 'supabase/migrations', file), 'utf8');
 execFileSync(psql, args, { input: source, env: environment, encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 });
 receipt.migrations.push({ file, sha256: createHash('sha256').update(source).digest('hex') });
}
check('all actual migrations execute on native PostgreSQL', receipt.migrations.length > 0, { count: receipt.migrations.length });
const admissionOwner=randomUUID();sql(`insert into auth.users(id) values(${literal(admissionOwner)}); insert into staff_members(user_id,role) values(${literal(admissionOwner)},'super_admin'); select checkout_admission_policy_set(${literal(admissionOwner)},true,5,2,100)`);
async function contend(name, lockSql, statements) {
 let blockerOut = '', blockerError = ''; const clients = [];
 const blocker = spawn(psql, args, { env: { ...environment, PGAPPNAME: `${name}_barrier` }, stdio: ['pipe', 'pipe', 'pipe'] });
 blocker.stdout.on('data', data => { blockerOut += data; }); blocker.stderr.on('data', data => { blockerError += data; });
 blocker.stdin.write(`begin; set statement_timeout='15s'; ${lockSql};\n\\echo barrier_locked\n`);
 try {
  const deadline = Date.now() + 10000; while (!blockerOut.includes('barrier_locked')) { if (blocker.exitCode !== null) throw new Error(`Barrier failed: ${blockerError}`); if (Date.now() > deadline) throw new Error('Barrier timed out'); await sleep(25); }
  const outcomes = statements.map((statement, index) => new Promise(resolve => {
   const child = spawn(psql, [...args, '-c', `set statement_timeout='15s'; set role service_role; ${statement}`], { env: { ...environment, PGAPPNAME: `${name}_client_${index}` }, stdio: ['ignore', 'pipe', 'pipe'] }); clients.push(child); let out = '', error = '';
   child.stdout.on('data', data => { out += data; }); child.stderr.on('data', data => { error += data; }); child.on('error', err => { error += err.message; }); child.on('close', code => resolve({ code, out: out.trim(), error: error.trim() }));
  }));
  let waiting = 0, distinct = 0; const overlapDeadline = Date.now() + 8000;
  do { [waiting, distinct] = sql(`select count(*),count(distinct pid) from pg_stat_activity where datname=current_database() and application_name like ${literal(`${name}_client_%`)} and wait_event_type='Lock'`).split('|').map(Number); if (waiting < statements.length) await sleep(30); } while (waiting < statements.length && Date.now() < overlapDeadline);
  assert.equal(waiting, statements.length, `${name}: every distinct client must be waiting concurrently before release`);
  assert.equal(distinct, statements.length, `${name}: separate PostgreSQL backend PIDs required`);
  blocker.stdin.end('commit;\n\\q\n');
  const result = await Promise.all(outcomes); return { result, observedConcurrentLockWaiters: waiting, distinctBackendPids: distinct };
 } finally { if (blocker.exitCode === null && !blocker.stdin.writableEnded) { blocker.stdin.end('rollback;\n\\q\n'); } for (const child of clients) if (child.exitCode === null) child.kill('SIGTERM'); }
}
const product = randomUUID(); sql(`insert into products(id,sku,slug,title,price_amount,currency,stock_qty,status,is_demo) values(${literal(product)},'CONTENT-ONE','contention-one','Last-unit test',100,'hkd',1,'published',false)`);
const stock = await contend('stock', 'select pg_advisory_xact_lock(73219023)', Array.from({ length: 8 }, () => `select reserve_checkout(${literal(randomUUID())},${literal('a'.repeat(64))},${json([{ product_id: product, quantity: 1 }])},'{}'::jsonb,${literal(createHash('sha256').update(randomUUID()).digest('hex'))})`));
check('last-unit contention has exactly one committed reservation and seven shortages', stock.result.filter(x => x.code === 0).length === 1 && stock.result.filter(x => x.code !== 0 && x.error.includes('OUT_OF_STOCK')).length === 7, { clients: 8, observedConcurrentLockWaiters: stock.observedConcurrentLockWaiters, distinctBackendPids: stock.distinctBackendPids });
check('stock contention creates no orphan orders or oversell', number('select count(*) from orders') === 1 && number("select coalesce(sum(quantity),0) from inventory_reservations where status='active'") === 1 && number(`select stock_qty from products where id=${literal(product)}`) === 1);
const users = Array.from({ length: 8 }, () => randomUUID()); for (const user of users) sql(`insert into auth.users(id) values(${literal(user)}); insert into staff_members(user_id,role) values(${literal(user)},'catalog_editor')`);
sql('update private.batch_admission_policy set max_actor_outstanding=1,max_store_outstanding=1');
const preset = JSON.parse(readFileSync(path.join(root, 'style/muji/tokens.json'), 'utf8'));
const batchSql = user => `select batch_create(${literal(user)},'Capacity race','muji',${json(preset)},${json([{ filename: 'race.jpg', mime: 'image/jpeg', byte_size: 100 }])},${literal(randomUUID())})`;
const batch = await contend('batch', 'select singleton from private.batch_admission_policy for update', users.map(batchSql));
check('global batch admission commits one and rejects seven concurrent actors', batch.result.filter(x => x.code === 0).length === 1 && batch.result.filter(x => x.code !== 0 && x.error.includes('BATCH_ADMISSION_BACKPRESSURE')).length === 7, { clients: 8, observedConcurrentLockWaiters: batch.observedConcurrentLockWaiters, distinctBackendPids: batch.distinctBackendPids });
check('batch transaction leaves one batch, item and full-size retained reservation', number('select count(*) from media_batches') === 1 && number('select count(*) from media_batch_items') === 1 && number('select coalesce(sum(reserved_bytes),0) from private.batch_storage_reservations') === 25165824);
// A second capacity race raises outstanding limits to isolate retained bytes.
sql("update private.batch_admission_policy set max_actor_outstanding=1000,max_store_outstanding=3000,max_actor_retained_bytes=50331648,max_store_retained_bytes=50331648");
const bytes = await contend('storage', 'select singleton from private.batch_admission_policy for update', users.map(batchSql));
check('retained storage cap is serialized independently of outstanding count limits', bytes.result.filter(x => x.code === 0).length === 1 && bytes.result.filter(x => x.code !== 0 && x.error.includes('BATCH_ADMISSION_STORAGE_LIMIT')).length === 7 && number('select sum(reserved_bytes) from private.batch_storage_reservations') === 50331648, { clients: 8, observedConcurrentLockWaiters: bytes.observedConcurrentLockWaiters, distinctBackendPids: bytes.distinctBackendPids });
const admin = randomUUID(), order = randomUUID(); sql(`insert into auth.users(id) values(${literal(admin)}); insert into staff_members(user_id,role) values(${literal(admin)},'super_admin'); insert into orders(id,status,currency,subtotal_amount,total_amount) values(${literal(order)},'paid','hkd',100,100)`);
const orderRace = await contend('orders', `select id from orders where id=${literal(order)} for update`, Array.from({ length: 8 }, () => `select order_operate(${literal(admin)},${literal(order)},1,${literal(randomUUID())},'pack','{}'::jsonb)`));
check('same-revision order contention commits one and rejects seven stale writes', orderRace.result.filter(x => x.code === 0).length === 1 && orderRace.result.filter(x => x.code !== 0 && x.error.includes('STALE_REVISION')).length === 7, { clients: 8, observedConcurrentLockWaiters: orderRace.observedConcurrentLockWaiters, distinctBackendPids: orderRace.distinctBackendPids });
check('order moves once with one audit record', sql(`select fulfillment_status||'|'||operation_revision from orders where id=${literal(order)}`) === 'packed|2' && number(`select count(*) from order_operation_audit where order_id=${literal(order)}`) === 1);
const sameRequest = randomUUID(); const duplicate = await contend('replay', `select pg_advisory_xact_lock(hashtextextended(${literal(admin + sameRequest)},1))`, Array.from({ length: 8 }, () => `select order_operate(${literal(admin)},${literal(order)},2,${literal(sameRequest)},'ship',${json({ carrier: 'Test carrier', trackingNumber: 'TEST-ONLY' })})`));
check('simultaneous retries share one revision and one additional audit event', duplicate.result.every(x => x.code === 0) && duplicate.result.filter(x => JSON.parse(x.out).replayed === true).length === 7 && sql(`select fulfillment_status||'|'||operation_revision from orders where id=${literal(order)}`) === 'shipped|3' && number(`select count(*) from order_operation_audit where order_id=${literal(order)}`) === 2, { clients: 8, observedConcurrentLockWaiters: duplicate.observedConcurrentLockWaiters, distinctBackendPids: duplicate.distinctBackendPids });

// Admission decisions share the same reservation lock; expensive stock is ample
// so these races measure client/global limits rather than inventory exhaustion.
sql(`update products set stock_qty=100 where id=${literal(product)}; select checkout_admission_policy_set(${literal(admissionOwner)},true,5,20,100)`);
const admissionSql = (hash, attempt=randomUUID()) => `select reserve_checkout(${literal(attempt)},${literal('a'.repeat(64))},${json([{product_id:product,quantity:1}])},'{}'::jsonb,${literal(hash)})`;
const rateHash='b'.repeat(64);
const clientRate=await contend('client_rate','select pg_advisory_xact_lock(73219023)',Array.from({length:8},()=>admissionSql(rateHash)));
check('eight same-client attempts commit five and reject three at the recent quota',clientRate.result.filter(x=>x.code===0).length===5&&clientRate.result.filter(x=>x.code!==0&&x.error.includes('CHECKOUT_CLIENT_RATE_LIMIT')).length===3&&number(`select count(*) from private.checkout_admissions where client_hash=${literal(rateHash)}`)===5,{clients:8,observedConcurrentLockWaiters:clientRate.observedConcurrentLockWaiters,distinctBackendPids:clientRate.distinctBackendPids});
sql(`select checkout_admission_policy_set(${literal(admissionOwner)},true,100,2,100)`);
const activeHash='c'.repeat(64);
const clientActive=await contend('client_active','select pg_advisory_xact_lock(73219023)',Array.from({length:8},()=>admissionSql(activeHash)));
check('eight same-client attempts commit only two active holds',clientActive.result.filter(x=>x.code===0).length===2&&clientActive.result.filter(x=>x.code!==0&&x.error.includes('CHECKOUT_CLIENT_ACTIVE_LIMIT')).length===6&&number(`select count(*) from private.checkout_admissions where client_hash=${literal(activeHash)}`)===2,{clients:8,observedConcurrentLockWaiters:clientActive.observedConcurrentLockWaiters,distinctBackendPids:clientActive.distinctBackendPids});
const activeBefore=number("select count(distinct h.order_id) from inventory_reservations h join orders o on o.id=h.order_id where h.status='active' and h.expires_at>clock_timestamp() and o.status in ('pending','review')");
sql(`select checkout_admission_policy_set(${literal(admissionOwner)},true,100,2,${activeBefore+2})`);
const storeActive=await contend('store_active','select pg_advisory_xact_lock(73219023)',Array.from({length:8},()=>admissionSql(createHash('sha256').update(randomUUID()).digest('hex'))));
check('eight distinct clients cannot overrun the remaining two global slots',storeActive.result.filter(x=>x.code===0).length===2&&storeActive.result.filter(x=>x.code!==0&&x.error.includes('CHECKOUT_STORE_ACTIVE_LIMIT')).length===6&&number("select count(distinct h.order_id) from inventory_reservations h join orders o on o.id=h.order_id where h.status='active' and h.expires_at>clock_timestamp() and o.status in ('pending','review')")===activeBefore+2,{clients:8,observedConcurrentLockWaiters:storeActive.observedConcurrentLockWaiters,distinctBackendPids:storeActive.distinctBackendPids});
// Retries remain idempotent while the policy is disabled and capacity is full.
const retryOrder=clientActive.result.find(x=>x.code===0).out;const retryAttempt=sql(`select checkout_attempt_id from orders where id=${literal(retryOrder)}`);const beforeRetry=number('select count(*) from private.checkout_admissions');
sql(`select checkout_admission_policy_set(${literal(admissionOwner)},false,100,2,${activeBefore+2})`);
const checkoutRetry=await contend('checkout_retry','select pg_advisory_xact_lock(73219023)',Array.from({length:8},()=>admissionSql(activeHash,retryAttempt)));
check('eight simultaneous checkout retries return one frozen order without charging admission again',checkoutRetry.result.every(x=>x.code===0&&x.out===retryOrder)&&number('select count(*) from private.checkout_admissions')===beforeRetry,{clients:8,observedConcurrentLockWaiters:checkoutRetry.observedConcurrentLockWaiters,distinctBackendPids:checkoutRetry.distinctBackendPids});

receipt.completedAt = new Date().toISOString(); receipt.passed = receipt.checks.length; writeFileSync(path.join(root, 'native-concurrency-receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); console.log(JSON.stringify({ passed: receipt.passed, concurrentConnectionsTested: true, liveDatabaseTouched: false }));
