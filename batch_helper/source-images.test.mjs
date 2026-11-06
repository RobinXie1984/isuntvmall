import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSourceImage,prepareSourceOriginal,sourceImageUrl} from './source-images.mjs';
import {sha256,MAX_BYTES} from './processor.mjs';
const url='https://cdn.shopify.com/s/files/1/1234/files/fan.png?v=123';
const bytes=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]);
test('supplier URL guard accepts only the exact Shopify public CDN path',()=>{
 assert.equal(sourceImageUrl(url),url);
 for(const v of ['http://cdn.shopify.com/s/files/a.jpg','https://cdn.shopify.com.evil.test/s/files/a.jpg','https://cdn.shopify.com@127.0.0.1/s/files/a.jpg','https://cdn.shopify.com:443/s/files/a.jpg','https://cdn.shopify.com/other/a.jpg','https://cdn.shopify.com/s/files/a.jpg#x','https://cdn.shopify.com/s/files/a.jpg\n','https://127.0.0.1/s/files/a.jpg','file:///a.jpg'])assert.throws(()=>sourceImageUrl(v));
});
test('download omits credentials, disallows redirects and sniffs actual MIME',async()=>{
 const result=await fetchSourceImage(url,{fetchImpl:async(input,init)=>{assert.equal(input,url);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');assert.equal(init.referrerPolicy,'no-referrer');return new Response(bytes,{headers:{'content-type':'text/plain'}});}});
 assert.equal(result.mime,'image/png');assert.equal(result.sha256,sha256(bytes));assert.deepEqual(result.bytes,bytes);
});
test('bad status, non-image and declared oversize are held',async()=>{
 await assert.rejects(()=>fetchSourceImage(url,{fetchImpl:async()=>new Response('no',{status:404})}),/SOURCE_IMAGE_UNAVAILABLE/);
 await assert.rejects(()=>fetchSourceImage(url,{fetchImpl:async()=>new Response('<html>wrong</html>')}),/UNSUPPORTED_IMAGE_SIGNATURE/);
 await assert.rejects(()=>fetchSourceImage(url,{fetchImpl:async()=>new Response(bytes,{headers:{'content-length':String(MAX_BYTES+1)}})}),/RESPONSE_SIZE_LIMIT/);
});
test('binds the lease before immutable original upload and verifies private readback',async()=>{
 const calls=[];let stored=null;const item={id:'item',revision:1,lease_token:'lease',original_path:'batch/item/original',source_url:url,source_sha256:null,mime:'image/jpeg',byte_size:MAX_BYTES};
 const result=await prepareSourceOriginal({item,rpc:async(name,args)=>calls.push([name,args]),download:async()=>{calls.push(['read']);if(!stored)throw Error('missing');return stored;},upload:async(bucket,path,b,mime)=>{calls.push(['upload',bucket,path,mime]);stored=b;},fetchImpl:async()=>new Response(bytes)});
 assert.deepEqual(result.bytes,bytes);assert.equal(calls[1][0],'batch_bind_source_original');assert.equal(calls[1][1].p_lease_token,'lease');assert.equal(calls[1][1].p_byte_size,bytes.length);assert.equal(calls[2][0],'upload');assert.equal(calls[2][1],'batch-originals');assert.equal(calls[2][3],'image/png');assert.equal(calls[3][0],'read');
});
test('crash recovery uses the retained original even if supplier is offline',async()=>{
 let fetched=false;let uploaded=false;const item={id:'item',revision:2,lease_token:'newlease',original_path:'original',source_url:url,source_sha256:sha256(bytes),mime:'image/png',byte_size:bytes.length};
 const result=await prepareSourceOriginal({item,rpc:async()=>{},download:async()=>bytes,upload:async()=>{uploaded=true;},fetchImpl:async()=>{fetched=true;throw Error('offline');}});
 assert.equal(result.sha256,item.source_sha256);assert.equal(fetched,false);assert.equal(uploaded,false);
});
test('changed source after a crash cannot replace a bound original',async()=>{
 const item={id:'item',revision:2,lease_token:'lease',original_path:'original',source_url:url,source_sha256:sha256(Buffer.from('other')),mime:'image/png',byte_size:bytes.length};let bound=false,uploaded=false;
 await assert.rejects(()=>prepareSourceOriginal({item,rpc:async()=>{bound=true;},download:async()=>{throw Error('missing');},upload:async()=>{uploaded=true;},fetchImpl:async()=>new Response(bytes)}),/ORIGINAL_CHANGED/);assert.equal(bound,false);assert.equal(uploaded,false);
});
test('stale lease prevents private original upload and readback mismatch fails',async()=>{
 let uploaded=false;const item={id:'i',revision:1,lease_token:'old',original_path:'original',source_url:url};
 await assert.rejects(()=>prepareSourceOriginal({item,rpc:async()=>{throw Error('STALE_LEASE');},download:async()=>{throw Error('missing');},upload:async()=>{uploaded=true;},fetchImpl:async()=>new Response(bytes)}),/STALE_LEASE/);assert.equal(uploaded,false);
 let n=0;await assert.rejects(()=>prepareSourceOriginal({item,rpc:async()=>{},download:async()=>{if(n++===0)throw Error('missing');return Buffer.from('other');},upload:async()=>{},fetchImpl:async()=>new Response(bytes)}),/UPLOAD_HASH_MISMATCH/);
});
