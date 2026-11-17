import {approvedProductFilm} from '@/lib/broadcasts/product-films';
import {productFilmResponse} from '@/lib/broadcasts/product-film-delivery';
import {getStoreProfile} from '@/lib/store-profile';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const film=approvedProductFilm((await params).id);
 const version=new URL(request.url).searchParams.get('v');
 if(!film||(version&&version!==film.sha256.slice(0,16)))return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 let sourceFetch:typeof fetch=fetch;
 try{const {env}=await import(/* webpackIgnore: true */ 'cloudflare:workers');if(env.ASSETS){const assets=env.ASSETS;sourceFetch=(input)=>assets.fetch(new Request(input));}}catch{/* Next.js development has no Worker bindings; its preview uses local files. */}
 return productFilmResponse(request,film,getStoreProfile().origin,sourceFetch);
}
export const HEAD=GET;
