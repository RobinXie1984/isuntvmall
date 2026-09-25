import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const db=new PGlite();let checks=0;
const q=(sql,args=[])=>db.query(sql,args);const one=async(sql,args=[])=>(await q(sql,args)).rows[0];
const check=(name,value)=>{assert.ok(value,name);console.log(`PASS ${++checks}: ${name}`);};
const fail=async(fn,needle)=>{await db.exec('savepoint expected_failure');try{await fn();await db.exec('release savepoint expected_failure');return false;}catch(error){await db.exec('rollback to savepoint expected_failure');await db.exec('release savepoint expected_failure');return String(error).includes(needle);}};
await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false);create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
for(const file of readdirSync(path.join(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
const admin=randomUUID(),editor=randomUUID(),other=randomUUID();for(const id of [admin,editor,other])await q('insert into auth.users(id) values($1)',[id]);
await q("insert into staff_members(user_id,role) values($1,'super_admin'),($2,'catalog_editor'),($3,'catalog_editor')",[admin,editor,other]);
const style=JSON.parse(readFileSync(path.join(root,'style/muji/tokens.json'),'utf8'));
const item=(name='cup.jpg')=>({filename:name,mime:'image/jpeg',byte_size:100,product_data:{sku:'SKU-'+randomUUID(),title:'Tea cup',description:'A cup for tea.',titleZh:'茶杯',descriptionZh:'日常品茶用的茶杯。',category:'Lifestyle',priceAmount:10000,currency:'hkd',stockQty:1}});
const create=async(actor=editor,items=[item()],request=randomUUID())=>(await one('select batch_create($1,$2,$3,$4::jsonb,$5::jsonb,$6) id',[actor,'Capacity test','muji',JSON.stringify(style),JSON.stringify(items),request])).id;
const configure=data=>q('select batch_configure_capacity($1,$2::jsonb)',[admin,JSON.stringify(data)]);
const capacity=async(actor=editor)=>(await one('select batch_capacity($1) result',[actor])).result;
const scenario=async fn=>{await db.exec('begin');try{await fn();}finally{await db.exec('rollback');}};
await scenario(async()=>{
 const data=[item()];const request=randomUUID();const id=await create(editor,data,request);const before=await capacity();
 check('admission reserves full24MiB upload capability, not100-byte claim',Number(before.actorRetainedBytes)===25165824);
 check('identical create retry returns original batch',await create(editor,data,request)===id);
 check('idempotent retry adds no capacity charge',Number((await capacity()).actorRetainedBytes)===25165824);
 await configure({enabled:false});check('completed idempotent retry succeeds while new admissions paused',await create(editor,data,request)===id);
 check('paused admission rejects new batch',await fail(()=>create(),'BATCH_ADMISSION_PAUSED'));
});
await scenario(async()=>{
 await configure({max_actor_outstanding:1,max_store_outstanding:2});await create();
 check('per-actor outstanding backpressure is enforced',await fail(()=>create(),'BACKPRESSURE'));
 await create(other);check('store outstanding backpressure is enforced across actors',await fail(()=>create(admin),'BACKPRESSURE'));
 check('rejected admission leaves no extra batch or charge',(await one('select count(*)::int n from media_batches')).n===2&&Number((await capacity()).storeRetainedBytes)===2*25165824);
});
await scenario(async()=>{
 await configure({max_actor_retained_bytes:25165824,max_store_retained_bytes:50331648});await create();
 check('per-actor retained storage limit is enforced',await fail(()=>create(),'STORAGE_LIMIT'));
 await create(other);check('global retained storage limit is enforced across actors',await fail(()=>create(admin),'STORAGE_LIMIT'));
});
await scenario(async()=>{
 await configure({max_batch_items:1,max_batch_bytes:100});
 check('declared aggregate batch bytes are bounded',await fail(()=>create(editor,[{...item(),byte_size:101}]),'BATCH_LIMIT'));
 check('configured batch item limit is bounded',await fail(()=>create(editor,[item(),item('other.jpg')]),'BATCH_LIMIT'));
 check('failed transaction leaves zero reservations',(await one('select count(*)::int n from private.batch_storage_reservations')).n===0);
 check('editor cannot expand capacity',await fail(()=>q('select batch_configure_capacity($1,$2::jsonb)',[editor,'{"enabled":false}']),'STAFF_FORBIDDEN'));
});
await scenario(async()=>{
 const b=await create();let i=await one('select * from media_batch_items where batch_id=$1',[b]);
 await q('select batch_finalize($1,$2,1)',[editor,i.id]);i=await one('select * from batch_claim(1)');const hash='b'.repeat(64),sourceHash='a'.repeat(64),presetHash='c'.repeat(64);const processed=`${b}/${i.id}/r1-${hash}.webp`;
 const reserve=(bytes=100,token=i.lease_token)=>q('select batch_reserve_object($1,1,$2,$3,$4,$5,$6)',[i.id,token,'batch-processed',processed,bytes,hash]);
 check('stale workers cannot reserve storage',await fail(()=>reserve(100,randomUUID()),'STALE_LEASE'));
 const complete=()=>q('select batch_processed($1,1,$2,$3,$4,$5,$6,$7)',[i.id,i.lease_token,sourceHash,hash,processed,presetHash,'sharp-0.35.4/v1']);
 check('old worker cannot complete without a storage reservation',await fail(complete,'MISSING_OBJECT_RESERVATION'));
 await configure({max_actor_retained_bytes:25165824,max_store_retained_bytes:25165824});
 check('derivative allocation is checked before upload',await fail(()=>reserve(),'STORAGE_LIMIT'));
 await configure({max_actor_retained_bytes:25165824+1000,max_store_retained_bytes:25165824+1000});await reserve();const usage=Number((await capacity()).actorRetainedBytes);await reserve();
 check('exact derivative retry does not double-charge',usage===25165824+100&&Number((await capacity()).actorRetainedBytes)===usage);
 check('changed derivative reservation cannot reuse path',await fail(()=>reserve(101),'OBJECT_RESERVATION_CHANGED'));
 await complete();await q("select batch_review($1,$2,1,'approve','')",[admin,i.id]);i=await one('select * from batch_claim(1)');
 const pub=`batch/${i.id}/r1-${hash}.webp`;await q('select batch_reserve_object($1,1,$2,$3,$4,100,$5)',[i.id,i.lease_token,'product-images',pub,hash]);
 await q('select batch_publish($1,1,$2,$3,$4,$5)',[i.id,i.lease_token,`https://example.supabase.co/storage/v1/object/public/product-images/${pub}`,pub,hash]);
 const after=await capacity();check('publication frees outstanding count but retains all original and derived bytes',Number(after.actorOutstanding)===0&&Number(after.actorRetainedBytes)===25165824+200);
 check('published originals still prevent exceeding retained budget',await fail(()=>create(),'STORAGE_LIMIT'));
});
await scenario(async()=>{
 await db.exec('set role authenticated');check('ordinary authenticated users cannot inspect private quota policy',await fail(()=>q('select * from private.batch_admission_policy'),'permission denied'));await db.exec('reset role');
});
console.log(JSON.stringify({capacityChecks:checks,concurrentConnections:'UNKNOWN',reason:'PGlite uses one serialized connection; transactional rollback/boundaries are tested, independent PostgreSQL connection races require deployment QA.'}));await db.close();
