// Run only in a disposable Studio candidate. No production credentials.
import {execFileSync,spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readdirSync,readFileSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.cwd();assert(base.includes('/candidates/')&&!existsSync(base+'/pgdata'));
const socket='/private/tmp/isun-variant-'+randomUUID().slice(0,8),bin='/opt/homebrew/opt/postgresql@17/bin/';
mkdirSync(socket,{mode:0o700});
const env={...process.env,PGHOST:socket,PGPORT:'55449',PGUSER:'headlessnick',PGDATABASE:'postgres'};
const run=(name,args)=>execFileSync(bin+name,args,{env,encoding:'utf8',stdio:['pipe','pipe','pipe']});
let rest;
try{
 run('initdb',['-D',base+'/pgdata','--auth-local=trust','--auth-host=reject','--encoding=UTF8','--locale=C']);
 run('pg_ctl',['-D',base+'/pgdata','-l',base+'/postgres.log','-o',`-c listen_addresses='' -c unix_socket_directories=${socket} -c unix_socket_permissions=0700 -p 55449`,'start','-w']);
 const sql=q=>run('psql',['-X','-v','ON_ERROR_STOP=1','-At','-c',q]);
 sql('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,is_anonymous boolean default false);create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const f of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())sql(readFileSync('supabase/migrations/'+f,'utf8'));
 const p=randomUUID(),v=randomUUID(),im=randomUUID(),actor=randomUUID();
 sql(`insert into auth.users(id) values('${actor}'); insert into products(id,sku,slug,title,price_amount,currency,stock_qty,status,is_demo) values('${p}','FIXTURE','fixture','Fixture',1000,'hkd',0,'published',false); insert into product_variants(id,product_id,source_index,sku,option_values,price_amount,stock_qty,price_is_placeholder,active) values('${v}','${p}',0,'FIXTURE-S','[]',1000,2,false,true); insert into product_images(id,product_id,source_url) values('${im}','${p}','/demo/tea.svg'); insert into product_variant_images(product_id,variant_id,image_id,linked_by) values('${p}','${v}','${im}','${actor}'); grant usage on schema public to service_role;`);
 writeFileSync(base+'/postgrest.conf',`db-uri = "postgresql:///postgres?host=${socket}&port=55449&user=headlessnick"\ndb-schemas = "public"\ndb-anon-role = "service_role"\nserver-unix-socket = "${socket}/rest.sock"\nserver-unix-socket-mode = "600"\n`);
 rest=spawn('/opt/homebrew/bin/postgrest',[base+'/postgrest.conf'],{stdio:'ignore'});
 let body;for(let i=0;i<30;i++){try{body=execFileSync('/usr/bin/curl',['-fsS','--unix-socket',socket+'/rest.sock','http://localhost/products?select=*,product_images(*),product_variants(*,product_variant_images(image_id))'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});break;}catch{await new Promise(r=>setTimeout(r,100));}}
 const rows=JSON.parse(body);assert.equal(rows[0].product_variants[0].product_variant_images[0].image_id,im);
 if(process.env.KEEP_FIXTURE==='true'){
  sql(`insert into staff_members(user_id,role) values('${actor}','super_admin'); select checkout_admission_policy_set('${actor}',true,100,20,100); insert into product_variants(id,product_id,source_index,sku,option_values,price_amount,stock_qty,price_is_placeholder,active) values('55b54363-ab4e-4d89-922f-8d35efb58003','${p}',1,'FIXTURE-L','[]',2000,2,false,true);`);
  writeFileSync(base+'/fixture.json',JSON.stringify({socket,productId:p,variantIds:[v,'55b54363-ab4e-4d89-922f-8d35efb58003']}));
  console.log('FIXTURE_READY');
  await new Promise(resolve=>{const timer=setTimeout(done,1800000);function done(){clearTimeout(timer);process.removeListener('SIGTERM',done);process.removeListener('SIGINT',done);resolve();}process.once('SIGTERM',done);process.once('SIGINT',done);});
 }
 console.log(JSON.stringify({engine:'PostgreSQL/PostgREST',nestedVariantImageQuery:'PASS',productionData:false}));
}finally{rest?.kill('SIGTERM');try{run('pg_ctl',['-D',base+'/pgdata','stop','-m','fast','-w']);}catch{}}
