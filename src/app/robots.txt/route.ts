import { getStoreProfile } from '@/lib/store-profile';
export function GET() {
 const p=getStoreProfile();
 const rules=p.indexing==='noindex'?'Disallow: /': ['Allow: /','Disallow: /admin','Disallow: /api/','Disallow: /cart','Disallow: /checkout','Disallow: /success','Disallow: /studio','Disallow: /batch-helper'].join('\n');
 return new Response(`User-agent: *\n${rules}\nSitemap: ${p.origin}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
