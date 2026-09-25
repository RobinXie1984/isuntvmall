import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expireInventoryReservations } from './maintenance.mjs';
const exec=promisify(execFile);const root=path.dirname(fileURLToPath(import.meta.url));
test('maintenance opt-in and failure results never fabricate a released count',async()=>{
 assert.equal((await expireInventoryReservations({enabled:false,client:{rpc(){throw Error('must not call');}}})).reason,'DISABLED');
 for(const data of [null,{},-1,1.5,'2']){const result=await expireInventoryReservations({enabled:true,client:{rpc:async()=>({data})}});assert.equal(result.status,'UNKNOWN');assert.equal(result.releasedReservations,null);}
 for(const rpc of [async()=>({error:{message:'secret'}}),async()=>{throw Error('secret');}]){const result=await expireInventoryReservations({enabled:true,client:{rpc}});assert.equal(result.status,'UNKNOWN');assert.equal(JSON.stringify(result).includes('secret'),false);}
 const success=await expireInventoryReservations({enabled:true,client:{rpc:async(name,args)=>{assert.equal(name,'expire_inventory_reservations');assert.deepEqual(args,{});return {data:0};}}});assert.equal(success.status,'PASS');assert.equal(success.releasedReservations,0);
});
test('real SDK performs expiry once before batch work and supports maintenance-only runs',async()=>{
 const requests=[];let fail=false;
 const server=createServer((request,response)=>{requests.push(request.url);response.writeHead(fail?503:200,{'content-type':'application/json'});response.end(fail?JSON.stringify({message:'database unavailable'}):request.url.includes('expire_inventory_reservations')?'3':'[]');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const env={...process.env,SUPABASE_URL:`http://127.0.0.1:${server.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'fixture-only',BATCH_HELPER_ENABLED:'true',COMMERCE_MAINTENANCE_ENABLED:'true'};
 const run=extra=>exec(process.execPath,[path.join(root,'worker.mjs'),'--once','--limit','2','--max-seconds','3'],{env:{...env,...extra}});
 try{
  const summary=JSON.parse((await run()).stdout.trim().split('\n').at(-1));assert.equal(summary.commerceMaintenance.releasedReservations,3);assert.deepEqual(requests,['/rest/v1/rpc/expire_inventory_reservations','/rest/v1/rpc/batch_claim']);
  requests.length=0;await run({BATCH_HELPER_ENABLED:'false'});assert.deepEqual(requests,['/rest/v1/rpc/expire_inventory_reservations']);
  requests.length=0;await run({COMMERCE_MAINTENANCE_ENABLED:'false'});assert.deepEqual(requests,['/rest/v1/rpc/batch_claim']);
  fail=true;await assert.rejects(run({BATCH_HELPER_ENABLED:'false'}),error=>{const last=JSON.parse(error.stdout.trim().split('\n').at(-1));return error.code===1&&last.commerceMaintenance.status==='UNKNOWN'&&last.commerceMaintenance.releasedReservations===null;});
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('stalled expiry is bounded by shared worker deadline and records unknown liveness',async()=>{
 const server=createServer((_request,response)=>{response.writeHead(200,{'content-type':'application/json'});response.write(' ');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const started=performance.now();
 try{await assert.rejects(exec(process.execPath,[path.join(root,'worker.mjs'),'--once','--max-seconds','1'],{timeout:7000,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${server.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'fixture-only',BATCH_HELPER_ENABLED:'false',COMMERCE_MAINTENANCE_ENABLED:'true'}}),error=>{const last=JSON.parse(error.stdout.trim().split('\n').at(-1));return error.code===1&&last.deadlineReached&&last.commerceMaintenance.status==='UNKNOWN'&&last.commerceMaintenance.releasedReservations===null;});assert.ok(performance.now()-started<6500);}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
