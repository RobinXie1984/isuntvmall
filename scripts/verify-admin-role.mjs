import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const db = new PGlite(); let passed = 0;
const q = (sql, args = []) => db.query(sql, args);
const one = async (sql, args = []) => (await q(sql, args)).rows[0];
const check = (name, value) => { assert.ok(value, name); console.log(`PASS ${++passed}: ${name}`); };
const fails = async (fn, code) => { try { await fn(); return false; } catch (error) { return String(error).includes(code); } };
await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false);create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
let before;
const acl = async () => (await q("select p.oid::regprocedure::text signature,p.proacl::text acl,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by signature")).rows;
for (const file of readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort()) {
  if (file.endsWith('_admin_merchandise_role.sql')) before = await acl();
  await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
}
check('all migrations execute including the admin role', Boolean(before));
check('migration preserves all function ACLs, security modes and search paths', JSON.stringify(before) === JSON.stringify(await acl()));
const users = {};
for (const role of ['super_admin','admin','operator','catalog_editor','order_operator','analyst']) {
  users[role] = randomUUID(); await q('insert into auth.users(id) values($1)', [users[role]]);
  await q('insert into staff_members(user_id,role) values($1,$2)', [users[role],role]);
}
const target = randomUUID(); await q('insert into auth.users(id) values($1)', [target]);
await q("select staff_set_member($1,$2,'admin',true,null)", [users.super_admin,target]);
check('super admin can explicitly grant admin', (await one('select role from staff_members where user_id=$1',[target])).role === 'admin');
await q("insert into staff_invitations(id,actor_id,email,role) values($1,$2,'fixture@example.test','admin')",[randomUUID(),users.super_admin]);
check('admin is valid in the invitation schema',true);
for (const [label,id,role,active] of [
  ['self promotion',users.admin,'super_admin',true],['super administrator demotion',users.super_admin,'operator',true],
  ['super administrator deactivation',users.super_admin,'super_admin',false],['other staff role change',users.operator,'admin',true],
  ['other staff deactivation',users.operator,'operator',false],['new staff grant',target,'analyst',true]
]) check(`admin cannot perform ${label}`,await fails(()=>q('select staff_set_member($1,$2,$3,$4,null)',[users.admin,id,role,active]),'STAFF_FORBIDDEN'));
check('admin cannot change batch capacity',await fails(()=>q("select batch_configure_capacity($1,'{\"enabled\":false}'::jsonb)",[users.admin]),'STAFF_FORBIDDEN'));
check('admin cannot read owner checkout configuration',await fails(()=>q('select checkout_admission_policy_get($1)',[users.admin]),'STAFF_FORBIDDEN'));
check('admin cannot change checkout configuration',await fails(()=>q('select checkout_admission_policy_set($1,true,5,2,100)',[users.admin]),'STAFF_FORBIDDEN'));
check('admin cannot change host identities',await fails(()=>q("select backend_save_kol($1,'fixture-host','Fixture','Fixture','active')",[users.admin]),'STAFF_FORBIDDEN'));
await q("select batch_configure_capacity($1,'{}'::jsonb)",[users.super_admin]);
check('super admin retains batch configuration',true);
const style = JSON.parse(readFileSync('style/muji/tokens.json','utf8'));
const product = {sku:'ADMIN-TEST',title:'Admin test cup',description:'Fixture merchandise.',titleZh:'測試茶杯',descriptionZh:'測試商品。',category:'Lifestyle',priceAmount:12000,currency:'hkd',stockQty:20};
const metadata = [{filename:'cup.jpg',mime:'image/jpeg',byte_size:120,product_data:product}];
const create = async (actor=users.catalog_editor) => (await one('select batch_create($1,$2,$3,$4::jsonb,$5::jsonb,$6) id',[actor,'Admin test','muji',JSON.stringify(style),JSON.stringify(metadata),randomUUID()])).id;
const ownBatch = await create(users.admin); const batch = await create();
check('admin inherits operator batch creation and capacity access',Boolean(ownBatch)&&(await one('select batch_capacity($1) value',[users.admin])).value.actorOutstanding===1);
await q('select batch_require_owner($1,$2)',[users.admin,batch]);
check('admin can review another submitter batch',true);
check('operator still cannot access another submitter batch',await fails(()=>q('select batch_require_owner($1,$2)',[users.operator,batch]),'BATCH_FORBIDDEN'));
const item = (await one('select id from media_batch_items where batch_id=$1',[batch])).id;
const state = () => one('select * from media_batch_items where id=$1',[item]);
await q('select batch_finalize($1,$2,1)',[users.admin,item]);
let claim = await one('select * from batch_claim(1)');
const imagePath = `${batch}/${item}/r1-${'b'.repeat(64)}.webp`;
await q('select batch_reserve_object($1,1,$2,$3,$4,100,$5)',[item,claim.lease_token,'batch-processed',imagePath,'b'.repeat(64)]);
await q("select batch_processed($1,1,$2,$3,$4,$5,repeat('c',64),'sharp-0.35.4/v1')",[item,claim.lease_token,'a'.repeat(64),'b'.repeat(64),imagePath]);
const summary = async actor => (await one('select backend_summary($1) value',[actor])).value;
check('admin report includes another submitter pending review',(await summary(users.admin)).batchNeedsReview===1&&(await summary(users.operator)).batchNeedsReview===0);
check('operator still cannot approve merchandise',await fails(()=>q("select batch_review($1,$2,1,'approve','')",[users.operator,item]),'STAFF_FORBIDDEN'));
await q("select batch_review($1,$2,1,'approve','')",[users.admin,item]);
check('admin can approve merchandise submitted by an editor',(await state()).approved_by===users.admin);
await q("update staff_members set role='operator' where user_id=$1",[users.admin]);
await q('select * from batch_claim(1)');
check('demoted admin approval is revoked before worker claim',(await state()).status==='review'&&(await state()).error==='APPROVAL_REVOKED');
await q("update staff_members set role='admin' where user_id=$1",[users.admin]);
await q("select batch_review($1,$2,1,'approve','')",[users.admin,item]);
await q('update staff_members set active=false where user_id=$1',[users.admin]);
await q('select * from batch_claim(1)');
check('deactivated admin approval is revoked before worker claim',(await state()).status==='review');
await q('update staff_members set active=true where user_id=$1',[users.admin]);
await q("select batch_review($1,$2,1,'approve','')",[users.admin,item]);
claim = await one('select * from batch_claim(1)');
check('active admin approval is claimable for publication',claim.status==='publishing'&&claim.id===item);
const publicPath=`batch/${item}/r1-${'b'.repeat(64)}.webp`;
await q('select batch_reserve_object($1,1,$2,$3,$4,100,$5)',[item,claim.lease_token,'product-images',publicPath,'b'.repeat(64)]);
const publish=()=>q('select batch_publish($1,1,$2,$3,$4,$5)',[item,claim.lease_token,`https://example.supabase.co/storage/v1/object/public/product-images/${publicPath}`,publicPath,'b'.repeat(64)]);
await q("update staff_members set role='operator' where user_id=$1",[users.admin]);
check('demotion after claim blocks publication commit',await fails(publish,'STAFF_FORBIDDEN'));
await q("update staff_members set role='admin',active=false where user_id=$1",[users.admin]);
check('deactivation after claim blocks publication commit',await fails(publish,'STAFF_FORBIDDEN'));
await q('update staff_members set active=true where user_id=$1',[users.admin]);
await publish();
check('admin approved merchandise publishes through normal audited worker path',(await state()).status==='published'&&(await one('select count(*)::int n from products where id=$1',[item])).n===1);
const host=randomUUID();await q("insert into kols(id,slug,display_name,status) values($1,'admin-test','Admin test host','active')",[host]);
const room=randomUUID();
const payload={slug:'admin-room',title:'Admin room',titleZh:'測試直播',description:'Fixture',descriptionZh:'測試',hostName:'Test host',kolId:host,platform:'youtube',externalUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',embedId:null,status:'live',startsAt:'2026-10-03T10:00:00Z',endsAt:null,posterUrl:null,productIds:[item]};
await q('select live_room_save($1,$2,0,$3::jsonb)',[users.admin,room,JSON.stringify(payload)]);
await q('select live_room_request($1,$2,1)',[users.admin,room]);
await q("select live_source_verify($1,$2,1,'embedded','https://www.isuntvmall.com','Fixture only; no real provider playback tested',true,true)",[users.admin,room]);
await q('update staff_members set active=false where user_id=$1',[users.admin]);
check('revoked admin verifier cannot authorize room publication',await fails(()=>q('select live_room_publish($1,$2,1)',[users.operator,room]),'SOURCE_NOT_VERIFIED'));
await q('update staff_members set active=true where user_id=$1',[users.admin]);
await q('select live_room_publish($1,$2,1)',[users.admin,room]);
await q('select live_room_pin($1,$2,1,$3)',[users.admin,room,item]);
const publicRoom=(await one('select live_room_public($1) value',[room])).value;
check('admin inherits live save/request/verify/publish/pin operations',publicRoom.pinnedProductId===item&&publicRoom.products.length===1);
const review=randomUUID(),paid=randomUUID();
for(const [id,status] of [[review,'review'],[paid,'paid']]) await q("insert into orders(id,status,currency,subtotal_amount,total_amount,customer_email,customer_name,shipping_address) values($1,$2,'hkd',12000,12000,'private@example.test','Private buyer','{\"line1\":\"Private address\"}')",[id,status]);
// An old CSR assignment must not survive a change to Admin as buyer access.
await q('insert into order_assignments(order_id,user_id,support,fulfillment) values($1,$2,true,true)',[review,users.admin]);
const list=async actor=>(await one('select order_list_scoped($1) value',[actor])).value;
const masked=await list(users.admin);
check('admin sees only the same review exceptions as operator',JSON.stringify(masked)===JSON.stringify(await list(users.operator))&&masked.count===1&&masked.items[0].id===review);
check('admin sees no buyer PII or residual CSR capabilities',masked.items[0].customerEmail===null&&masked.items[0].customerName===null&&masked.items[0].shippingAddress===null&&!masked.items[0].canFulfill&&!masked.items[0].canRequestRefund&&masked.items[0].refundRequests.length===0);
for(const action of ['assign','pack','ship','deliver','request_refund','review_refund']) check(`admin cannot mutate orders via ${action}`,await fails(()=>q('select order_operate($1,$2,1,$3,$4,$5::jsonb)',[users.admin,review,randomUUID(),action,'{}']),'ORDER_FORBIDDEN'));
const report=await summary(users.admin);
check('admin inherits aggregate operational reporting',report.paidOrders===1&&report.paidRevenueByCurrency.hkd===12000&&report.ordersNeedingReview===1&&!JSON.stringify(report).includes('private@example.test'));
await q('update staff_members set active=false where user_id=$1',[users.admin]);
check('revoked admin loses batch, live, order and reporting access',await fails(()=>q('select batch_capacity($1)',[users.admin]),'STAFF_FORBIDDEN')&&await fails(()=>q('select live_require_actor($1,$2,true)',[users.admin,host]),'LIVE_FORBIDDEN')&&await fails(()=>list(users.admin),'ORDER_FORBIDDEN')&&await fails(()=>summary(users.admin),'STAFF_FORBIDDEN'));
for(const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  check(`${role} cannot delete, update or inspect staff`,await fails(()=>q('delete from staff_members where user_id=$1',[users.super_admin]),'permission denied')&&await fails(()=>q("update staff_members set role='super_admin' where user_id=$1",[users.admin]),'permission denied')&&await fails(()=>q('select * from staff_members'),'permission denied'));
  check(`${role} cannot insert staff invitations`,await fails(()=>q("insert into staff_invitations(id,actor_id,email,role) values($1,$2,'blocked@example.test','super_admin')",[randomUUID(),users.admin]),'permission denied'));
  check(`${role} cannot invoke privileged role or approval RPCs`,await fails(()=>q("select staff_set_member($1,$2,'admin',true,null)",[users.super_admin,target]),'permission denied')&&await fails(()=>q("select batch_review($1,$2,1,'approve','')",[users.admin,item]),'permission denied'));
  await db.exec('reset role');
}
console.log(JSON.stringify({checksPassed:passed,liveDatabaseTouched:false,realProviderPlaybackTested:false,realPaymentsExecuted:false}));
await db.close();
