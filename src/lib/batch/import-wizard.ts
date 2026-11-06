import {previewShopifyCsv, type ShopifyPreview} from './shopify-import';
import {shopifyStagePayload} from './shopify-stage';
import {productImportRequestId} from './product-spreadsheet';

export const IMPORT_PLACEHOLDER_ID='00000000-0000-4000-8000-000000000000';
export type PreparedProductImport={preview:ShopifyPreview;payload:ReturnType<typeof shopifyStagePayload>};
export type ProductImportResult={handle:string;title:string;id?:string;replayed?:boolean;code?:string;imageBatches?:string[];imageCode?:string;imageQueued?:number;imageExisting?:number;imageHeld?:number;imageFailed?:number};
export type ImportPost=(path:string,body:unknown)=>Promise<Record<string,unknown>>;

export function importTitle(filename:string){return filename.replace(/\.(csv|xlsx)$/i,'').trim().slice(0,120)||'Product import';}
/** Source HTML is rendered as text, never inserted into the admin DOM. */
export function plainSourceText(html:string){return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();}

/** Validation only: no network request and no trust in CSV publication/stock flags. */
// PostgreSQL jsonb::text adds one space after separators; admission uses those byte limits.
function databaseJsonText(value:unknown):string{
 if(Array.isArray(value))return '['+value.map(databaseJsonText).join(', ')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).map(([key,item])=>JSON.stringify(key)+': '+databaseJsonText(item)).join(', ')+'}';
 return JSON.stringify(value);
}
export function prepareProductImport(csv:string,filename:string):PreparedProductImport{
 const preview=previewShopifyCsv(csv);
 if(preview.items.some(item=>item.reason==='conflicting-product'))throw Error('CONFLICTING_PRODUCT');
 let payload:ReturnType<typeof shopifyStagePayload>;
 try{payload=shopifyStagePayload(preview,IMPORT_PLACEHOLDER_ID,importTitle(filename));}catch{throw Error('INVALID_INPUT');}
 const encoder=new TextEncoder();
 if(encoder.encode(databaseJsonText(payload.products)).length>4000000||payload.products.some(product=>encoder.encode(databaseJsonText(product)).length>200000))throw Error('IMPORT_TOO_LARGE');
 const skus=new Set<string>();
 for(const product of payload.products){
  if(product.variants.length===0)throw Error('NO_VARIANTS');
  const identities=new Set<string>();
  for(const variant of product.variants){
   if(variant.sku){if(skus.has(variant.sku))throw Error('DUPLICATE_SKU');skus.add(variant.sku);}
   const identity=JSON.stringify([...variant.options].sort((a,b)=>a.name.localeCompare(b.name)).map(o=>[o.name,o.value]));
   if(identities.has(identity))throw Error('DUPLICATE_OPTIONS');
   identities.add(identity);
  }
 }
 if(new TextEncoder().encode(JSON.stringify(payload)).length>4*1024*1024)throw Error('IMPORT_TOO_LARGE');
 return {preview,payload};
}

export function safeImportCode(error:unknown){
 const value=error instanceof Error?error.message:'';
 if(error instanceof Error && ['AbortError','TimeoutError'].includes(error.name))return 'CONNECTION_UNCONFIRMED';
 return /^[A-Z][A-Z0-9_]{0,79}$/.test(value)?value:'CONNECTION_UNCONFIRMED';
}

/** Bound the entire request, including JSON response reading. Abort does not prove the server rolled back. */
export async function importPost(path:string,body:unknown,fetcher:typeof fetch=fetch,timeoutMs=45000):Promise<Record<string,unknown>>{
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('CONNECTION_UNCONFIRMED'));},timeoutMs);});
 const request=(async()=>{
  let response:Response;
  try{response=await fetcher(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:controller.signal});}
  catch{throw Error('CONNECTION_UNCONFIRMED');}
  // Authentication/permission failures stop the whole file, even if a provider returned an unexpected body.
  if(response.status===401)throw Error('SIGN_IN_REQUIRED');
  if(response.status===429)throw Error('IMPORT_RATE_LIMITED');
  if(response.status>=500)throw Error('CONNECTION_UNCONFIRMED');
  let result:unknown;
  try{result=await response.json();}catch{throw Error('CONNECTION_UNCONFIRMED');}
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('CONNECTION_UNCONFIRMED');
  const value=result as Record<string,unknown>;
  if(response.status===403)throw Error(value.code==='MFA_REQUIRED'?'MFA_REQUIRED':'STAFF_FORBIDDEN');
  if(!response.ok)throw Error(typeof value.code==='string'?safeImportCode(Error(value.code)):'BATCH_OPERATION_FAILED');
  return value;
 })();
 try{return await Promise.race([request,deadline]);}finally{clearTimeout(timer);}
}

function stopImport(code:string){return ['CONNECTION_UNCONFIRMED','BATCH_OPERATION_FAILED','SIGN_IN_REQUIRED','STAFF_UNAUTHENTICATED','MFA_REQUIRED','STAFF_FORBIDDEN','INVALID_ORIGIN','IMPORT_RATE_LIMITED','IMPORT_RECEIPT_MISSING','MEDIA_RECEIPT_MISSING','BATCH_NOT_CONFIGURED','STAFF_NOT_CONFIGURED'].includes(code);}

/** Called only after final confirmation. Stage receipts are stable across page reload/reselection. */
export async function confirmProductImport(prepared:PreparedProductImport,actor:string,post:ImportPost,onProgress:(results:ProductImportResult[],batch:string)=>void,enqueueImages?:(batch:string,handle:string)=>Promise<{batches:string[];queued:number;existing:number;held:number;failed:number}>){
 const input={...prepared.payload,requestId:await productImportRequestId(actor,{title:prepared.payload.title,products:prepared.payload.products})};
 let saved:Record<string,unknown>;
 try{
  saved=await post('/api/admin/shopify-stage',input);
  if(typeof saved.id!=='string'||!saved.id)throw Error('IMPORT_RECEIPT_MISSING');
 }catch(error){
  onProgress(prepared.payload.products.map(product=>({handle:product.handle,title:product.title,code:'NOT_ATTEMPTED'})),'');
  throw error;
 }
 const batch=saved.id as string,results:ProductImportResult[]=[];
 for(let index=0;index<prepared.payload.products.length;index++){
  const product=prepared.payload.products[index];
  const item:ProductImportResult={handle:product.handle,title:product.title};
  try{
   const draft=await post('/api/admin/shopify-stage/draft',{batch,handle:product.handle});
   if(typeof draft.id!=='string'||!draft.id)throw Error('IMPORT_RECEIPT_MISSING');
   item.id=draft.id;item.replayed=draft.replayed===true;
   if(enqueueImages && (product.images.length || product.variants.some(v=>v.imageUrl))){
    try{const media=await enqueueImages(batch,product.handle);item.imageBatches=media.batches;item.imageQueued=media.queued;item.imageExisting=media.existing;item.imageHeld=media.held;item.imageFailed=media.failed;}
    catch(error){item.imageCode=safeImportCode(error);}
   }
  }catch(error){item.code=safeImportCode(error);}
  results.push(item);
  if(stopImport(item.code||item.imageCode||'')){
   for(const pending of prepared.payload.products.slice(index+1))results.push({handle:pending.handle,title:pending.title,code:'NOT_ATTEMPTED'});
   onProgress([...results],batch);break;
  }
  onProgress([...results],batch);
 }
 return {batch,results};
}
