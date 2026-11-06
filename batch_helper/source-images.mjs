import {boundedFetch} from './network.mjs';
import {identify,MAX_BYTES,sha256} from './processor.mjs';
/** No redirects, credentials or ambient cookies go to supplier hosts. */
export function sourceImageUrl(value){
 let url;try{url=new URL(value);}catch{throw new Error('UNAPPROVED_IMAGE_HOST');}
 if(url.protocol!=='https:'||url.hostname!=='cdn.shopify.com'||url.port||url.username||url.password||url.hash||!url.pathname.startsWith('/s/files/')||!/^https:\/\/cdn[.]shopify[.]com\/s\/files\/[A-Za-z0-9/_%+.,~()-]+([?][A-Za-z0-9_~%+.,=&:-]*)?$/.test(value)||value.length>2048)throw new Error('UNAPPROVED_IMAGE_HOST');
 return url.href;
}
export async function fetchSourceImage(url,{fetchImpl=globalThis.fetch,runSignal}={}){
 const target=sourceImageUrl(url);
 const response=await boundedFetch({fetchImpl,runSignal,timeoutMs:20_000,maxBytes:MAX_BYTES})(target,{redirect:'error',credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw new Error('SOURCE_IMAGE_UNAVAILABLE');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!bytes.length||bytes.length>MAX_BYTES)throw new Error('INPUT_SIZE_LIMIT');
 // Content-Type is advisory; file signatures and the existing decoder decide.
 const mime=identify(bytes);return {bytes,mime,sha256:sha256(bytes)};
}
/** Bind before upload; a crash can only replay the exact immutable original. */
export async function prepareSourceOriginal({item,rpc,download,upload,fetchImpl,runSignal}){
 let bytes;
 try{bytes=await download('batch-originals',item.original_path,MAX_BYTES);}catch{/* Missing original or transient Storage read: bounded source fetch below. */}
 const original=bytes?{bytes,mime:identify(bytes),sha256:sha256(bytes)}:await fetchSourceImage(item.source_url,{fetchImpl,runSignal});
 if(item.source_sha256&&(original.sha256!==item.source_sha256||original.mime!==item.mime||original.bytes.length!==item.byte_size))throw new Error('ORIGINAL_CHANGED');
 const guard={p_item_id:item.id,p_revision:item.revision,p_lease_token:item.lease_token};
 await rpc('batch_bind_source_original',{...guard,p_mime:original.mime,p_byte_size:original.bytes.length,p_sha256:original.sha256});
 if(!bytes){
  // The pre-existing admission reserved a full original before the queue entry.
  // Upload is immutable; any duplicate is accepted only by exact hash readback.
  await upload('batch-originals',item.original_path,original.bytes,original.mime);
  const stored=await download('batch-originals',item.original_path,MAX_BYTES);
  if(sha256(stored)!==original.sha256)throw new Error('UPLOAD_HASH_MISMATCH');
 }
 return original;
}
