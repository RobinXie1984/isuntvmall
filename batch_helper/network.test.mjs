import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedFetch, responseLimit } from './network.mjs';
const url='https://example.supabase.co/storage/v1/object/batch-originals/example';
test('download byte limits match private and published bucket boundaries',()=>{
 assert.equal(responseLimit(url),24*1024*1024);
 assert.equal(responseLimit(url.replace('batch-originals','batch-processed')),8*1024*1024);
 assert.equal(responseLimit(url.replace('batch-originals','public/product-images')),8*1024*1024);
 assert.equal(responseLimit('https://example.supabase.co/rest/v1/rpc/batch_claim',{method:'POST'}),1024*1024);
});
test('oversized declared response is refused before body reads',async()=>{
 let reads=0;
 const body=new ReadableStream({pull(){reads++;}} ,{highWaterMark:0});
 const fetch=boundedFetch({maxBytes:10,fetchImpl:async()=>new Response(body,{headers:{'content-length':'11'}})});
 await assert.rejects(fetch(url),/RESPONSE_SIZE_LIMIT/);assert.equal(reads,0);
});
test('chunked and dishonest length responses stop at the byte limit',async()=>{
 for(const headers of [{},{'content-length':'1'}]){
  let cancelled=false;let pulls=0;
  const body=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(6));},cancel(){cancelled=true;}},{highWaterMark:0});
  const fetch=boundedFetch({maxBytes:10,fetchImpl:async()=>new Response(body,{headers})});
  await assert.rejects(fetch(url),/RESPONSE_SIZE_LIMIT/);assert.equal(pulls,2);assert.equal(cancelled,true);
 }
});
test('stalled headers cannot exceed the explicit request deadline',async()=>{
 const fetch=boundedFetch({timeoutMs:20,fetchImpl:async()=>new Promise(()=>{})});
 const start=performance.now();await assert.rejects(fetch(url),/REQUEST_DEADLINE/);assert.ok(performance.now()-start<500);
});
test('stalled body read is cancelled at deadline',async()=>{
 let cancelled=false;
 const fetch=boundedFetch({timeoutMs:20,fetchImpl:async()=>new Response(new ReadableStream({pull(){},cancel(){cancelled=true;}},{highWaterMark:0}))});
 await assert.rejects(fetch(url),/REQUEST_DEADLINE/);assert.equal(cancelled,true);
});
test('run deadline aborts active request even with a longer request budget',async()=>{
 const controller=new AbortController();const fetch=boundedFetch({timeoutMs:1000,runSignal:controller.signal,fetchImpl:async()=>new Promise(()=>{})});
 const operation=fetch(url);controller.abort(new Error('RUN_DEADLINE'));await assert.rejects(operation,/RUN_DEADLINE/);
});
test('bounded response is available for SDK Blob/JSON reading without content changes',async()=>{
 const fetch=boundedFetch({maxBytes:100,fetchImpl:async()=>new Response('safe image bytes',{headers:{'content-type':'image/webp'}})});
 const response=await fetch(url);assert.equal(await(await response.blob()).text(),'safe image bytes');assert.equal(response.headers.get('content-length'),'16');
});
