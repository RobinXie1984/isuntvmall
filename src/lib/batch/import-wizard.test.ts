import {describe,it,expect,vi} from 'vitest';
import {confirmProductImport,importPost,prepareProductImport,plainSourceText,safeImportCode} from './import-wizard';
const csv='Handle,Title,Option1 Name,Option1 Value,Variant SKU,Variant Price,Image Src\nnew-fan,Small fan,Colour,White,FAN-W,28,https://cdn.shopify.com/s/files/fan.jpg\nnew-fan,,Colour,Blue,FAN-B,29,';

describe('Shopify-parity confirmation boundary',()=>{
 it('previews multi-variant products with no local photos without server writes',()=>{const prepared=prepareProductImport(csv,'fans.xlsx');expect(prepared.payload.title).toBe('fans');expect(prepared.payload.products[0].variants).toHaveLength(2);expect(prepared.preview.items[0].reason).toBe('variants');expect(prepared.payload.products[0].variants.map(v=>v.price)).toEqual(['28','29']);});
 it('accepts a single variant without images and preserves untrusted price observations',()=>{const prepared=prepareProductImport('Handle,Title,Variant SKU,Variant Price\nfoo,Food,FOO,19.99','food.csv');expect(prepared.payload.products[0].images).toEqual([]);expect(prepared.payload.products[0].variants[0].price).toBe('19.99');});
 it('rejects missing variants and ambiguous duplicate identities before confirmation',()=>{
  expect(()=>prepareProductImport('Handle,Title\nfoo,Foo','x.csv')).toThrow('NO_VARIANTS');
  expect(()=>prepareProductImport(csv.replace('FAN-B','FAN-W'),'x.csv')).toThrow('DUPLICATE_SKU');
  expect(()=>prepareProductImport(csv.replace('Colour,Blue','Colour,White'),'x.csv')).toThrow('DUPLICATE_OPTIONS');
  expect(()=>prepareProductImport(csv.replace('new-fan,,Colour','new-fan,Other,Colour'),'x.csv')).toThrow('CONFLICTING_PRODUCT');
 });
 it('rejects malformed headers, excessive counts and title length before creating stage',()=>{
  expect(()=>prepareProductImport('Handle,Title,Title\nfoo,Foo,Bar','x.csv')).toThrow();
  expect(()=>prepareProductImport('Handle,Title,Variant SKU\nfoo,'+'a'.repeat(181)+',FOO','x.csv')).toThrow();
  expect(()=>prepareProductImport('Handle,Title,Variant SKU\n'+Array.from({length:501},(_,i)=>`foo${i},Foo${i},SKU${i}`).join('\n'),'x.csv')).toThrow();
 });
 it('enforces the database per-product JSONB byte limit before confirmation',()=>{
  const large='Handle,Title,Variant SKU,Body (HTML),Vendor\nfoo,Foo,FOO,'+'a'.repeat(100000)+','+'b'.repeat(100000);
  expect(()=>prepareProductImport(large,'large.csv')).toThrow('IMPORT_TOO_LARGE');
 });
 it('renders supplier markup as plain text and omits scripts',()=>{expect(plainSourceText('<h1>Useful &amp; calm</h1><script>alert(1)</script><img src=x onerror=alert(2)>')).toBe('Useful & calm');});
 it('uses deterministic stage receipts on retry and queues images only after a draft exists',async()=>{
  const prepared=prepareProductImport(csv,'fans.csv');const batches:string[]=[];const calls:string[]=[];
  const post=vi.fn(async(path:string,body:unknown)=>{calls.push(path);if(path.endsWith('/draft'))return {id:'product',replayed:true};batches.push((body as {requestId:string}).requestId);return {id:'batch'};});
  const enqueue=vi.fn(async()=>{expect(calls.at(-1)).toBe('/api/admin/shopify-stage/draft');return {batches:['photos'],queued:1,existing:0,held:0,failed:0};});
  const progress=vi.fn();const first=await confirmProductImport(prepared,'staff@example.com',post,progress,enqueue);await confirmProductImport(prepared,'staff@example.com',post,progress,enqueue);
  expect(batches[0]).toBe(batches[1]);expect(first.results[0]).toMatchObject({id:'product',replayed:true,imageBatches:['photos'],imageQueued:1});expect(enqueue).toHaveBeenCalledWith('batch','new-fan');
 });
 it('continues after per-product conflicts and reports partial image failures truthfully',async()=>{
  const prepared=prepareProductImport(csv+'\nother,Other,,Default,OTHER,38,','fans.csv');
  const post=vi.fn(async(path:string,body:unknown)=>{if(path.endsWith('/draft')){if((body as {handle:string}).handle==='other')throw Error('SOURCE_CONFLICT');return {id:'product'};}return {id:'batch'};});
  const result=await confirmProductImport(prepared,'staff',post,vi.fn(),async()=>({batches:[],queued:0,existing:0,held:1,failed:2}));
  expect(result.results[0]).toMatchObject({id:'product',imageHeld:1,imageFailed:2});expect(result.results[1]).toMatchObject({code:'SOURCE_CONFLICT'});
 });
 it('retains successful draft when image enqueue cannot be confirmed and never queues failed drafts',async()=>{
  const prepared=prepareProductImport(csv,'fans.csv');const enqueue=vi.fn(async()=>{throw Error('CAPACITY_EXCEEDED');});
  const result=await confirmProductImport(prepared,'staff',async p=>p.endsWith('/draft')?{id:'product'}:{id:'batch'},vi.fn(),enqueue);
  expect(result.results[0]).toMatchObject({id:'product',imageCode:'CAPACITY_EXCEEDED'});
  const fail=await confirmProductImport(prepared,'staff',async p=>{if(p.endsWith('/draft'))throw Error('EXISTING_PRODUCT_CONFLICT');return {id:'batch'};},vi.fn(),enqueue);
  expect(fail.results[0].code).toBe('EXISTING_PRODUCT_CONFLICT');expect(enqueue).toHaveBeenCalledTimes(1);
 });
 it('does not expose arbitrary exception text as a server code',()=>{expect(safeImportCode(Error('password=abc'))).toBe('CONNECTION_UNCONFIRMED');});
});


describe('bounded import transport and pause recovery',()=>{
 const twoProducts=()=>prepareProductImport(csv+'\nother,Other,,Default,OTHER,38,','fans.csv');
 it('aborts a never-resolving request at the default 45-second deadline',async()=>{
  vi.useFakeTimers();let signal:AbortSignal|undefined;
  const stalled=vi.fn((_path:RequestInfo|URL,init?:RequestInit)=>{signal=init?.signal as AbortSignal;return new Promise<Response>(()=>{});});
  try{
   const assertion=expect(importPost('/api/admin/shopify-stage',{},stalled)).rejects.toThrow('CONNECTION_UNCONFIRMED');
   await vi.advanceTimersByTimeAsync(44999);expect(signal?.aborted).toBe(false);
   await vi.advanceTimersByTimeAsync(1);await assertion;expect(signal?.aborted).toBe(true);
  }finally{vi.useRealTimers();}
 });
 it('bounds response-body reading as well as the network connection',async()=>{
  const response={status:200,ok:true,json:()=>new Promise(()=>{})} as Response;
  await expect(importPost('/api/admin/shopify-stage',{},async()=>response,5)).rejects.toThrow('CONNECTION_UNCONFIRMED');
 });
 it('stops after a stalled draft request and does not attempt the next product',async()=>{
  let aborted=false;const stalled=vi.fn((_path:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>(()=>{init?.signal?.addEventListener('abort',()=>{aborted=true;});}));
  const post=vi.fn(async(path:string,body:unknown)=>path.endsWith('/draft')?importPost(path,body,stalled,5):{id:'batch'});
  const progress=vi.fn();const result=await confirmProductImport(twoProducts(),'staff',post,progress);
  expect(aborted).toBe(true);expect(stalled).toHaveBeenCalledTimes(1);expect(post).toHaveBeenCalledTimes(2);
  expect(result.batch).toBe('batch');expect(result.results.map(item=>item.code)).toEqual(['CONNECTION_UNCONFIRMED','NOT_ATTEMPTED']);
 });
 it.each(['SIGN_IN_REQUIRED','MFA_REQUIRED','STAFF_FORBIDDEN','IMPORT_RECEIPT_MISSING','BATCH_OPERATION_FAILED'])('stops after %s and retains the stage receipt',async(code)=>{
  const post=vi.fn(async(path:string)=>{if(path.endsWith('/draft')){if(code==='IMPORT_RECEIPT_MISSING')return {};throw Error(code);}return {id:'batch'};});
  const result=await confirmProductImport(twoProducts(),'staff',post,vi.fn());
  expect(post).toHaveBeenCalledTimes(2);expect(result.batch).toBe('batch');expect(result.results.map(item=>item.code)).toEqual([code,'NOT_ATTEMPTED']);
 });
 it('stops remaining products when photo enqueue cannot be confirmed, keeping the created draft',async()=>{
  const post=vi.fn(async(path:string)=>path.endsWith('/draft')?{id:'product'}:{id:'batch'});
  const result=await confirmProductImport(twoProducts(),'staff',post,vi.fn(),async()=>{throw new DOMException('Timed out','TimeoutError');});
  expect(post).toHaveBeenCalledTimes(2);expect(result.results[0]).toMatchObject({id:'product',imageCode:'CONNECTION_UNCONFIRMED'});expect(result.results[1].code).toBe('NOT_ATTEMPTED');
 });
 it('continues to the next product after a held source conflict',async()=>{
  const post=vi.fn(async(path:string,body:unknown)=>{if(path.endsWith('/draft')){if((body as {handle:string}).handle==='new-fan')throw Error('SOURCE_CONFLICT');return {id:'other-product'};}return {id:'batch'};});
  const result=await confirmProductImport(twoProducts(),'staff',post,vi.fn());
  expect(post).toHaveBeenCalledTimes(3);expect(result.results[0].code).toBe('SOURCE_CONFLICT');expect(result.results[1].id).toBe('other-product');
 });
 it('marks every product not attempted if the stage receipt cannot be confirmed',async()=>{
  const progress=vi.fn();await expect(confirmProductImport(twoProducts(),'staff',async()=>{throw Error('CONNECTION_UNCONFIRMED');},progress)).rejects.toThrow('CONNECTION_UNCONFIRMED');
  expect(progress.mock.calls[0][0].map((item:{code:string})=>item.code)).toEqual(['NOT_ATTEMPTED','NOT_ATTEMPTED']);
 });
 it('treats HTTP 401 and 403 as whole-file access failures even with malformed response bodies',async()=>{
  await expect(importPost('/api/admin/shopify-stage',{},async()=>new Response('not json',{status:401}))).rejects.toThrow('SIGN_IN_REQUIRED');
  await expect(importPost('/api/admin/shopify-stage',{},async()=>Response.json({code:'MFA_REQUIRED'},{status:403}))).rejects.toThrow('MFA_REQUIRED');
 });
});
