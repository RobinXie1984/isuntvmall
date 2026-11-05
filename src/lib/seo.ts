import type { Metadata } from 'next';
import { LOCALES, localize, type Locale } from '@/lib/i18n';
import { productTitle, productDescription } from '@/lib/product-copy';
import { productImage, hasProductImage } from '@/lib/product-image';
import { sourcePriceDisclosure, productPriceDisclosure } from '@/lib/price-disclosure';
import { sourcePurchaseUrl } from '@/lib/data/source-catalogue';
import { getStoreProfile } from '@/lib/store-profile';
import type { Product } from '@/types/commerce';

export type ProductSeo = Partial<Record<Locale, { title?: string; description?: string }>>;
export function slugFromName(name: string) {
 return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,160).replace(/-$/,'') || 'product';
}
export const validSlug = (slug:string) => slug.length<=180 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug) && slug === slug.toLowerCase();
export function plainText(text:string) { return text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim(); }
export function productUrl(slug:string,locale:Locale='en') { return `${getStoreProfile().origin}/product/${encodeURIComponent(slug)}${locale==='en'?'':`?locale=${locale}`}`; }
export function translatedLocales(p:Product):Locale[] {
 const enTitle=productTitle(p,'en'),enDescription=productDescription(p,'en');
 return LOCALES.filter(l=>getStoreProfile().locales.supported.includes(l) && (l==='en'||(productTitle(p,l).trim()!==enTitle.trim() && !!productDescription(p,l).trim() && productDescription(p,l).trim()!==enDescription.trim())));
}
export function indexableProduct(p:Product) { return getStoreProfile().indexing==='index' && p.status==='published' && !p.isDemo && hasProductImage(p); }
export function productSearchCopy(p:Product,locale:Locale) {
 const title=plainText(p.seo?.[locale]?.title?.trim() || productTitle(p,locale));
 const description=plainText(p.seo?.[locale]?.description?.trim() || productDescription(p,locale)) || `${productTitle(p,locale)} · ${localize(p.category,locale)} · ${getStoreProfile().name}`;
 return { title:`${title} · ${getStoreProfile().name}`, description:description.slice(0,320) };
}
export function productMetadata(p:Product,locale:Locale):Metadata {
 const copy=productSearchCopy(p,locale),languages=translatedLocales(p),genuine=languages.includes(locale),canonical=productUrl(p.slug,genuine?locale:'en');
 const indexed=indexableProduct(p)&&genuine;
 return {title:{absolute:copy.title},description:copy.description,alternates:{canonical,languages:indexed?Object.fromEntries([...languages.map(l=>[l,productUrl(p.slug,l)]),['x-default',productUrl(p.slug)]]):undefined},robots:{index:indexed,follow:true},openGraph:{type:'website',url:canonical,title:copy.title,description:copy.description,siteName:getStoreProfile().name,locale:{en:'en_HK','zh-Hant':'zh_HK','zh-Hans':'zh_CN',ja:'ja_JP'}[locale],images:[{url:new URL(productImage(p),getStoreProfile().origin).href,alt:productTitle(p,locale)}]}};
}
export function productStructuredData(p:Product,locale:Locale) {
 const url=productUrl(p.slug,translatedLocales(p).includes(locale)?locale:'en');
 const data:Record<string,unknown>={'@context':'https://schema.org','@type':'Product','@id':`${productUrl(p.slug)}#product`,name:productTitle(p,locale),description:plainText(productDescription(p,locale)),sku:p.sku,url,image:[new URL(productImage(p),getStoreProfile().origin).href]};
 if(p.brand?.trim())data.brand={'@type':'Brand',name:p.brand.trim()};
 // Never describe illustrative or uncertain amounts as a real offer. For source
 // products, match the initially selected exact variant, not a different minimum.
 if(!p.isDemo && p.sourceListing) {
  const v=p.sourceListing.variants[0];
  if(v && ['source','reviewed'].includes(sourcePriceDisclosure(v)))data.offers={'@type':'Offer',url:sourcePurchaseUrl(p.sourceListing.handle,v.id),price:(v.priceAmount/100).toFixed(2),priceCurrency:'HKD',availability:`https://schema.org/${v.available?'InStock':'OutOfStock'}`};
 } else if(!p.isDemo && p.nativeVariants?.length) {
  data.offers=p.nativeVariants.filter(v=>v.active&&!v.priceIsPlaceholder&&Number.isSafeInteger(v.priceAmount)&&v.priceAmount>0&&v.stockQty!==null).map(v=>({'@type':'Offer',sku:v.sku,url,price:(v.priceAmount/100).toFixed(2),priceCurrency:p.currency.toUpperCase(),availability:`https://schema.org/${v.stockQty!>0?'InStock':'OutOfStock'}`}));
  if(!(data.offers as unknown[]).length)delete data.offers;
 } else if(!p.isDemo && productPriceDisclosure(p)===null && Number.isSafeInteger(p.priceAmount)&&p.priceAmount>0 && Number.isSafeInteger(p.stockQty)&&p.stockQty>=0) {
  data.offers={'@type':'Offer',url,price:(p.priceAmount/100).toFixed(2),priceCurrency:p.currency.toUpperCase(),availability:`https://schema.org/${p.stockQty>0?'InStock':'OutOfStock'}`};
 }
 return data;
}
export function jsonLd(value:unknown) { return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'); }
export function xml(value:string) { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
