import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import {sha256} from './processor.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
test('real SDK worker takes a remote source through private originals and MUJI review only',async()=>{
 const bytes=await sharp({create:{width:12,height:18,channels:3,background:'#d1c5ad'}}).png().toBuffer();
 const style=JSON.parse(readFileSync(path.join(root,'../style/muji/tokens.json')));
 const source='https://cdn.shopify.com/s/files/1/123/files/fixture.png';
 const item={id:'00000000-0000-4000-8000-000000000001',batch_id:'00000000-0000-4000-8000-000000000002',lease_token:'00000000-0000-4000-8000-000000000003',status:'processing',revision:1,source_url:source,mime:'image/jpeg',byte_size:25165824,source_sha256:null,original_path:'fixture/original'};
 const calls=[];let original=null,processed=null;
 const server=createServer(async(request,response)=>{
  const p=new URL(request.url,'http://127.0.0.1').pathname,chunks=[];for await(const c of request)chunks.push(c);const body=Buffer.concat(chunks);const args=p.startsWith('/rest/')&&body.length?JSON.parse(body.toString()):null;calls.push({p,method:request.method,args});
  const json=(value,status=200)=>{response.writeHead(status,{'content-type':'application/json'});response.end(JSON.stringify(value));};
  if(p==='/rest/v1/rpc/batch_claim')return json([item]);
  if(p==='/rest/v1/media_batches')return json({style_snapshot:style});
  if(p==='/fixture-source.png'){response.writeHead(200,{'content-type':'image/png'});return response.end(bytes);}
  if(p==='/rest/v1/rpc/batch_bind_source_original')return json(true);
  if(p==='/rest/v1/rpc/batch_reserve_object')return json(true);
  if(p==='/rest/v1/rpc/batch_processed')return json({id:item.id,status:'review'});
  if(p==='/rest/v1/rpc/batch_fail')return json(true);
  if(p.includes('/batch-originals/')&&request.method==='POST'){original=body;return json({Key:'fixture'});}
  if(p.includes('/batch-originals/')&&request.method==='GET'){if(!original)return json({statusCode:'404',error:'not_found',message:'not found'},404);response.writeHead(200,{'content-type':'image/png'});return response.end(original);}
  if(p.includes('/batch-processed/')&&request.method==='POST'){processed=body;return json({Key:'fixture'});}
  if(p.includes('/batch-processed/')&&request.method==='GET'&&processed){response.writeHead(200,{'content-type':'image/webp'});return response.end(processed);}
  return json({message:'UNEXPECTED_FIXTURE_REQUEST'},500);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const local=`http://127.0.0.1:${server.address().port}`;
 // Test-only transport adapter; production code retains its exact public-CDN guard.
 const preload=`const nativeFetch=globalThis.fetch;globalThis.fetch=(input,init)=>nativeFetch(String(input).startsWith(${JSON.stringify(source)})?${JSON.stringify(local+'/fixture-source.png')}:input,init);`;
 const child=spawn(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),path.join(root,'worker.mjs'),'--once','--limit','1','--max-seconds','15'],{env:{...process.env,SUPABASE_URL:local,SUPABASE_SERVICE_ROLE_KEY:'local-fixture-key',BATCH_HELPER_ENABLED:'true',COMMERCE_MAINTENANCE_ENABLED:'false'},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);const safety=setTimeout(()=>child.kill('SIGKILL'),22000);
 try{
  const result=await new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));assert.equal(result.signal,null);assert.equal(result.code,0,stderr);const summary=JSON.parse(stdout.trim().split('\n').at(-1));assert.equal(summary.completed,1);assert.equal(summary.failed,0);
  assert.deepEqual(original,bytes);assert.ok(processed?.length>0);assert.ok(!calls.some(c=>c.p.includes('/product-images/')||c.p.includes('batch_publish')),'No public-copy or publish call');
  const bind=calls.find(c=>c.p.endsWith('/batch_bind_source_original'));assert.equal(bind.args.p_mime,'image/png');assert.equal(bind.args.p_sha256,sha256(bytes));assert.equal(bind.args.p_byte_size,bytes.length);assert.equal(bind.args.p_lease_token,item.lease_token);
  const output=calls.find(c=>c.p.endsWith('/batch_processed'));assert.equal(output.args.p_source_sha256,sha256(bytes));assert.equal(output.args.p_output_sha256,sha256(processed));assert.equal(output.args.p_revision,1);
  const bindIndex=calls.indexOf(bind),uploadIndex=calls.findIndex(c=>c.p.includes('/batch-originals/')&&c.method==='POST');assert.ok(bindIndex>=0&&bindIndex<uploadIndex);
 }finally{clearTimeout(safety);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
