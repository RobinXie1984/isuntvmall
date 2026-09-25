import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
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
