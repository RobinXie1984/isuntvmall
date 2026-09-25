import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const db=new PGlite();let passed=0;
await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false);create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
const migration='20260925091419_media_batch_workflow.sql';
for(const file of readdirSync(path.join(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')&&f<migration).sort())await db.exec(readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
await db.exec("insert into storage.buckets values('batch-originals','batch-originals',false,25165824,array['image/jpeg','image/png','image/webp']),('batch-processed','batch-processed',false,8388608,array['image/webp']);");
const sql=readFileSync(path.join(root,'supabase/migrations',migration),'utf8');
const query=(q,args=[])=>db.query(q,args);
const state=async id=>(await query('select * from storage.buckets where id=$1',[id])).rows[0];
for(const id of ['batch-originals','batch-processed','product-images']){
 const original=await state(id);
 for(const field of ['public','file_size_limit','allowed_mime_types']){
  if(field==='public')await query('update storage.buckets set public=not public where id=$1',[id]);
  if(field==='file_size_limit')await query('update storage.buckets set file_size_limit=null where id=$1',[id]);
  if(field==='allowed_mime_types')await query("update storage.buckets set allowed_mime_types=array['image/svg+xml'] where id=$1",[id]);
  const incompatible=await state(id);
  let failed=false;
  try{await db.exec(sql);}catch(error){assert.match(String(error),/INCOMPATIBLE_STORAGE_BUCKET/);failed=true;await db.exec('rollback');}
  assert.equal(failed,true,`${id}.${field} must stop migration`);
  assert.deepEqual(await state(id),incompatible,'Pre-existing user configuration must not be changed');
  assert.equal((await query("select to_regclass('public.staff_members') name")).rows[0].name,null,'Whole migration must roll back');
  console.log(`PASS ${++passed}: incompatible ${id}.${field} aborts migration without modifying existing config`);
  await query('update storage.buckets set public=$2,file_size_limit=$3,allowed_mime_types=$4 where id=$1',[id,original.public,original.file_size_limit,original.allowed_mime_types]);
 }
}
// MIME order is irrelevant; compatible existing buckets must pass unchanged.
await query("update storage.buckets set allowed_mime_types=array['image/webp','image/png','image/jpeg'] where id='batch-originals'");
const before=await state('batch-originals');await db.exec(sql);assert.deepEqual(await state('batch-originals'),before);
console.log(`PASS ${++passed}: compatible pre-existing buckets pass without edits`);
await db.close();console.log(JSON.stringify({bucketChecks:passed}));
