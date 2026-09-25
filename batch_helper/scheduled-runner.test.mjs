import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp,writeFile,readFile,mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);const root=path.dirname(fileURLToPath(import.meta.url));
test('scheduled runner is single-owner, bounded, and exposes stale health without secrets',async()=>{
 let maintenanceFails=false;
 const server=createServer((request,response)=>{const expiry=request.url.includes('expire_inventory_reservations');response.writeHead(expiry&&maintenanceFails?503:200,{'content-type':'application/json'});response.end(expiry?(maintenanceFails?'{"message":"unavailable"}':'0'):'[]');});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const dir=await mkdtemp(path.join(tmpdir(),'isun-scheduled-test-'));const config=path.join(dir,'worker.config.json');
 await writeFile(config,JSON.stringify({name:'isuntvmall-batch-worker',intervalSeconds:11,limit:1,maxSeconds:1,staleAfterSeconds:22,stateDirectory:'state'}));
 const env={...process.env,SUPABASE_URL:`http://127.0.0.1:${server.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'fixture-secret-must-not-leak',BATCH_HELPER_ENABLED:'true',COMMERCE_MAINTENANCE_ENABLED:'true'};
 const run=(extra=[])=>exec(process.execPath,[path.join(root,'scheduled-runner.mjs'),'--config',config,...extra],{env});
 try{
  await run();await run();const status=JSON.parse((await run(['--status'])).stdout);assert.equal(status.verdict,'HEALTHY');assert.equal(status.status.summary.completed,0);
  assert.equal(status.status.summary.commerceMaintenance.status,'PASS');
  maintenanceFails=true;await assert.rejects(run(),error=>error.code===1);await assert.rejects(run(['--status']),error=>{const status=JSON.parse(error.stdout);return status.verdict==='FAILED'&&status.status.summary.commerceMaintenance.status==='UNKNOWN'&&status.status.summary.commerceMaintenance.releasedReservations===null;});maintenanceFails=false;await run();
  const statusPath=path.join(dir,'state/status.json');assert.ok(!(await readFile(statusPath,'utf8')).includes(env.SUPABASE_SERVICE_ROLE_KEY));
  await mkdir(path.join(dir,'state/run.lock'));await assert.rejects(run(),error=>error.code===2&&error.stderr.includes('LOCKED'));
  const stale=status.status;stale.updatedAt='2020-01-01T00:00:00.000Z';await writeFile(statusPath,JSON.stringify(stale));
  await assert.rejects(run(['--status']),error=>error.code===1&&JSON.parse(error.stdout).verdict==='UNKNOWN');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
