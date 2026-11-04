import type {ShopifyPreview,ShopifySourceVariant} from './shopify-import';
import type {CatalogueCopy} from '@/types/commerce';
import simplified from '@/lib/locales/zh-Hans-characters.json';
export type PublicSourceVariant={id:string|number;sku:string|null;price:string;option1:string|null;option2:string|null;option3:string|null};
export type PublicSourceProduct={id:string|number;handle:string;variants:PublicSourceVariant[]};
export type ReviewCatalogueProduct={sourceHandle:string;sourceId:string;variants:{id:string;priceAmount:number;priceIsPlaceholder?:boolean;options:CatalogueCopy[]}[]};
export type VariantSuggestion={handle:string;sourceIndex:number;sku:string;options:ShopifySourceVariant['options'];labels:CatalogueCopy|null;proposedPrice:number|null;reference:{priceStatus:'source-listed'|'needs-review'|'source-unavailable'|'identity-conflict';rawPrice:string;sourceVariantId:string|null;sourceUrl:string;reason:string;evidenceSha256:string|null;translationStatus:'prepared'|'needs-review'}};
const hans=(s:string)=>[...s].map(c=>(simplified as Record<string,string>)[c]||c).join('');
const amount=(s:string)=>/^\d{1,7}(\.\d{1,2})?$/.test(s)?Math.round(Number(s)*100):null;
const values=(v:PublicSourceVariant)=>[v.option1,v.option2,v.option3].filter((x):x is string=>x!==null);
function defaultLabels(v:ShopifySourceVariant):CatalogueCopy|null{
 if(v.options.length!==1||v.options[0].value!=='Default Title')return null;
 const n=v.options[0].name;
 if(n==='Title'||n==='')return {en:'Standard','zh-Hant':'標準款','zh-Hans':'标准款',ja:'標準'};
 const pack=n.match(/^(\d+(?:\.\d+)?)g[*×](\d+)袋每盒$/);
 return pack?{en:`${pack[1]} g × ${pack[2]} sachets per box`,'zh-Hant':`每盒 ${pack[1]} 克 × ${pack[2]} 袋`,'zh-Hans':`每盒 ${pack[1]} 克 × ${pack[2]} 袋`,ja:`${pack[1]}g × ${pack[2]}包／箱`}:null;
}
/** Preparation only: source-listed is not a business price approval or a stock assertion. */
export function prepareShopifyReview(preview:ShopifyPreview,feed:{products:PublicSourceProduct[]},catalogue:ReviewCatalogueProduct[],evidence:Record<string,{sha256:string;variants:{id:string|number;price:number;sku:string;options:string[]}[]}>) :VariantSuggestion[]{
 return preview.items.flatMap(item=>item.sourceVariants.map((v,sourceIndex)=>{
  const source=feed.products.find(p=>p.handle===item.handle), prior=catalogue.find(p=>p.sourceHandle===item.handle);
  const matches=source?.variants.filter(s=>(s.sku??'')===v.sku&&JSON.stringify(values(s))===JSON.stringify(v.options.map(o=>o.value)))||[];
  const matched=matches.length===1?matches[0]:null;const historicalMatches=prior?.variants.filter(x=>x.options.length===v.options.length&&x.options.every((o,i)=>[o.en,o['zh-Hant'],o['zh-Hans']].some(text=>hans(text).trim()===hans(v.options[i].value).trim())))||[];
  const translated=(matched&&prior?.variants.find(x=>x.id===String(matched.id)))||(historicalMatches.length===1?historicalMatches[0]:undefined);
  let labels=defaultLabels(v);
  if(!labels&&item.handle==='allura20260918-01'&&v.options.length===1){const raw=v.options[0].value;const packs=raw==='全方位護髮軟糖 (28天份量) x 2包 ＝兩個月份量'?2:raw==='全方位護髮軟糖 (28天份量) x 3包 = 三個月份量'?3:null;if(packs)labels={en:`28-day pack × ${packs}`,'zh-Hant':`28 天份量 × ${packs} 包`,'zh-Hans':`28 天份量 × ${packs} 包`,ja:`28日分 × ${packs}袋`};}
  if(!labels&&translated&&translated.options.length===v.options.length){labels=Object.fromEntries((['en','zh-Hant','zh-Hans','ja'] as const).map(locale=>[locale,translated.options.map(o=>locale==='zh-Hans'?hans(o[locale]):o[locale]).join(' · ')])) as CatalogueCopy;}
  if(labels&&Object.values(labels).some(s=>!s.trim()||s.length>240))labels=null;
  const raw=amount(v.price),page=evidence[item.handle];const pageMatch=matched&&page?.variants.find(x=>String(x.id)===String(matched.id)&&x.sku===v.sku&&x.price===raw&&JSON.stringify(x.options)===JSON.stringify(v.options.map(o=>o.value)));
  let status:VariantSuggestion['reference']['priceStatus']='needs-review',reason='Source price or previous uncertainty requires review';
  if(!source){status='source-unavailable';reason='Not present in the current public source; retain the private CSV as reference';}
  else if(!matched){status='identity-conflict';reason='Exact SKU and option identity did not match current source';}
  else if(raw===1999){reason='Generic HK$19.99 remains unverified';}
  else if(raw!==null&&raw>100&&amount(matched.price)===raw&&pageMatch&&translated&&!translated.priceIsPlaceholder&&translated.priceAmount===raw){status='source-listed';reason='Exact source variant, options and unchanged listed price matched fresh product evidence';}
  return {handle:item.handle,sourceIndex,sku:v.sku,options:v.options,labels,proposedPrice:status==='source-listed'?raw:null,reference:{priceStatus:status,rawPrice:v.price,sourceVariantId:matched?String(matched.id):null,sourceUrl:matched?`https://www.suntvmall.com/products/${item.handle}?variant=${matched.id}`:`https://www.suntvmall.com/products/${item.handle}`,reason,evidenceSha256:page?.sha256||null,translationStatus:labels?'prepared':'needs-review'}};
 }));
}
