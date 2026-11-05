import { getProducts } from '@/lib/data/store';
import { getStoreProfile } from '@/lib/store-profile';
import { indexableProduct, productUrl, translatedLocales, xml } from '@/lib/seo';
export const dynamic='force-dynamic';
export async function GET() {
 const profile=getStoreProfile();
 const products=(await getProducts()).filter(indexableProduct);
 const urls=profile.indexing==='index'?['/','/shop','/watch','/purchase-information','/contact','/privacy','/terms'].map(p=>`${profile.origin}${p}`):[];
 const entries=urls.map(url=>`<url><loc>${xml(url)}</loc></url>`);
 for(const p of products) {
  const locales=translatedLocales(p),alternates=locales.map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${xml(productUrl(p.slug,l))}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${xml(productUrl(p.slug))}"/>`;
  for(const locale of locales)entries.push(`<url><loc>${xml(productUrl(p.slug,locale))}</loc>${alternates}</url>`);
 }
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
}
