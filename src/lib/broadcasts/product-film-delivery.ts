import type {ProductFilm} from './product-films';
export function filmByteRange(header:string|null,size:number):{start:number;end:number}|null|'invalid'{
 if(!header)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(header.trim());
 if(!m||(!m[1]&&!m[2]))return 'invalid';
 const first=m[1]?Number(m[1]):null,last=m[2]?Number(m[2]):null;
 if((first!==null&&!Number.isSafeInteger(first))||(last!==null&&!Number.isSafeInteger(last)))return 'invalid';
 if(first===null){if(!last||last<1)return 'invalid';return {start:Math.max(0,size-last),end:size-1};}
 if(first>=size||(last!==null&&last<first))return 'invalid';
 return {start:first,end:Math.min(last??size-1,size-1)};
}
// Backpressure and cancellation keep range delivery bounded even for a long file.
function sliceStream(body:ReadableStream<Uint8Array>,start:number,end:number){
 const reader=body.getReader();let offset=0;
 return new ReadableStream<Uint8Array>({
  async pull(controller){try{while(true){const {done,value}=await reader.read();if(done){controller.close();return;}const beginning=offset;offset+=value.byteLength;if(offset<=start)continue;const part=value.subarray(Math.max(0,start-beginning),Math.min(value.byteLength,end+1-beginning));if(part.length)controller.enqueue(part);if(offset>end){await reader.cancel();controller.close();}return;}}catch(error){controller.error(error);}},
  cancel(reason){return reader.cancel(reason);}
 });
}
export async function productFilmResponse(request:Request,film:ProductFilm,origin:string,fetcher:typeof fetch=fetch){
 const size=film.bytes,etag='"'+film.sha256+'"';
 const headers=new Headers({'Content-Type':'video/mp4','Accept-Ranges':'bytes','ETag':etag,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
 if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});
 const range=filmByteRange(request.headers.get('If-Range')&&request.headers.get('If-Range')!==etag?null:request.headers.get('Range'),size);
 if(range==='invalid'){headers.set('Content-Range','bytes */'+size);headers.set('Content-Length','0');return new Response(null,{status:416,headers});}
 headers.set('Content-Length',String(range?range.end-range.start+1:size));
 if(range)headers.set('Content-Range',`bytes ${range.start}-${range.end}/${size}`);
 if(request.method==='HEAD')return new Response(null,{status:range?206:200,headers});
 try{
  // Only a manifest-bound static path at the configured store origin is fetched.
  // Cloudflare Static Assets ignore Range, so slice that full stream ourselves.
  const upstream=await fetcher(new URL(film.src,origin),{redirect:'error'});
  if(upstream.status!==200||!upstream.body||(upstream.headers.has('Content-Length')&&Number(upstream.headers.get('Content-Length'))!==size)){await upstream.body?.cancel();return new Response('Film temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store'}});}
  return new Response(range?sliceStream(upstream.body,range.start,range.end):upstream.body,{status:range?206:200,headers});
 }catch{return new Response('Film temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store'}});}
}
