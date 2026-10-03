import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
test('real SDK worker exits within run budget against a stalled local API',async()=>{
 const server=createServer((_request,response)=>{response.writeHead(200,{'content-type':'application/json'});response.write('[');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;const started=performance.now();
 const child=spawn(process.execPath,[path.join(root,'worker.mjs'),'--once','--limit','1','--max-seconds','1'],{env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${port}`,SUPABASE_SERVICE_ROLE_KEY:'local-fixture-key',BATCH_HELPER_ENABLED:'true'},stdio:['ignore','pipe','pipe']});
 let stdout='';child.stdout.on('data',data=>{stdout+=data;});
 child.stderr.resume(); // Drain child output without retaining unused diagnostic text.
 const safety=setTimeout(()=>child.kill('SIGKILL'),8000);
 try{const result=await new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
  assert.equal(result.signal,null,'The worker must exit without the test killing it');
  assert.equal(result.code,1);assert.ok(performance.now()-started<7000,'Run deadline plus shutdown grace must hold');
  const summary=JSON.parse(stdout.trim().split('\n').at(-1));assert.equal(summary.deadlineReached,true);assert.equal(summary.commerceMaintenance.status,'UNKNOWN');
 }finally{clearTimeout(safety);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});


// Run the real worker and Supabase SDK against a loopback fixture, exercising
// the pre-copy approval boundary, immutable upload/readback and publish RPC.
const approvalCases = [
 { name: 'active Admin', approver: { role: 'admin', active: true }, allowed: true },
 { name: 'active Super Admin', approver: { role: 'super_admin', active: true }, allowed: true },
 { name: 'Operator', approver: { role: 'operator', active: true }, allowed: false },
 { name: 'revoked Admin', approver: { role: 'admin', active: false }, allowed: false },
 { name: 'missing approver', approver: null, allowed: false },
 { name: 'stale Admin approval revision', approver: { role: 'admin', active: true }, approvedRevision: 1, allowed: false },
];
for (const fixture of approvalCases) test(`publication worker ${fixture.allowed ? 'accepts' : 'refuses'} ${fixture.name}`, async () => {
 const bytes = Buffer.from('immutable approved publication fixture');
 const outputHash = createHash('sha256').update(bytes).digest('hex');
 const item = { id: '00000000-0000-4000-8000-000000000001', batch_id: '00000000-0000-4000-8000-000000000002', lease_token: '00000000-0000-4000-8000-000000000003', approved_by: '00000000-0000-4000-8000-000000000004', status: 'publishing', revision: 2, approved_revision: fixture.approvedRevision ?? 2, processed_path: 'fixture/approved.webp', output_sha256: outputHash };
 const calls = []; let uploaded = null;
 const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const chunks = []; for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const json = value => { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(value)); };
  calls.push({ method: request.method, pathname, body: pathname.startsWith('/rest/') && body.length ? JSON.parse(body.toString()) : null });
  if (pathname === '/rest/v1/rpc/batch_claim') return json([item]);
  if (pathname === '/rest/v1/staff_members') return json(fixture.approver);
  if (pathname === '/rest/v1/rpc/batch_reserve_object') return json(true);
  if (pathname === '/rest/v1/rpc/batch_publish') return json(item.id);
  if (pathname === '/rest/v1/rpc/batch_fail') return json(true);
  if (pathname.includes('/batch-processed/') && request.method === 'GET') { response.writeHead(200, { 'content-type': 'image/webp' }); return response.end(bytes); }
  if (pathname.includes('/product-images/') && request.method === 'POST') { uploaded = body; return json({ Key: 'fixture' }); }
  if (pathname.includes('/product-images/') && request.method === 'GET' && uploaded) { response.writeHead(200, { 'content-type': 'image/webp' }); return response.end(uploaded); }
  response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ message: 'UNEXPECTED_FIXTURE_REQUEST' }));
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const port = server.address().port;
 const child = spawn(process.execPath, [path.join(root, 'worker.mjs'), '--once', '--limit', '1', '--max-seconds', '5'], { env: { ...process.env, SUPABASE_URL: `http://127.0.0.1:${port}`, SUPABASE_SERVICE_ROLE_KEY: 'local-fixture-key', BATCH_HELPER_ENABLED: 'true', COMMERCE_MAINTENANCE_ENABLED: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
 let stdout = '', stderr = '';
 child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
 const safety = setTimeout(() => child.kill('SIGKILL'), 12000);
 try {
  const result = await new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  assert.equal(result.signal, null, 'Worker must exit without being killed');
  assert.equal(result.code, fixture.allowed ? 0 : 1, stderr);
  const summary = JSON.parse(stdout.trim().split('\n').at(-1));
  assert.equal(summary.completed, fixture.allowed ? 1 : 0); assert.equal(summary.failed, fixture.allowed ? 0 : 1);
  const publish = calls.filter(call => call.pathname === '/rest/v1/rpc/batch_publish');
  const failures = calls.filter(call => call.pathname === '/rest/v1/rpc/batch_fail');
  if (fixture.allowed) {
   assert.equal(publish.length, 1); assert.equal(failures.length, 0);
   assert.deepEqual(uploaded, bytes, 'Only approved bytes reach the public copy');
   assert.equal(publish[0].body.p_revision, item.revision); assert.equal(publish[0].body.p_output_sha256, outputHash);
   assert.equal(publish[0].body.p_lease_token, item.lease_token);
   const reserveIndex = calls.findIndex(call => call.pathname === '/rest/v1/rpc/batch_reserve_object');
   const uploadIndex = calls.findIndex(call => call.pathname.includes('/product-images/') && call.method === 'POST');
   const verifyIndex = calls.findIndex(call => call.pathname.includes('/product-images/') && call.method === 'GET');
   const publishIndex = calls.findIndex(call => call.pathname === '/rest/v1/rpc/batch_publish');
   assert.ok(reserveIndex >= 0 && reserveIndex < uploadIndex && uploadIndex < verifyIndex && verifyIndex < publishIndex, 'Reservation, immutable copy and hash readback precede publication');
  } else {
   assert.equal(publish.length, 0); assert.equal(uploaded, null);
   assert.equal(calls.filter(call => call.pathname.startsWith('/storage/')).length, 0, 'Refused approvals cannot copy public bytes or read processed images');
   assert.equal(failures.length, 1); assert.equal(failures[0].body.p_error, 'APPROVAL_REVOKED');
  }
 } finally { clearTimeout(safety); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
