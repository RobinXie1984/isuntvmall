import Papa from 'papaparse';
import { draftProductSchema, type DraftProduct } from './contracts';

type Row = Record<string, string>;
export type ShopifyPreviewItem = { handle: string; title: string; variantCount: number; imageCount: number; imageName?: string; reason?: 'variants'|'no-image'|'sku'|'price'|'name'|'ambiguous-image'|'duplicate-sku'|'conflicting-product'; draft?: DraftProduct };
export type ShopifyPreview = { rows: number; items: ShopifyPreviewItem[] };
const value = (row: Row, ...keys: string[]) => keys.map(k => (row[k] || '').trim()).find(Boolean) || '';
function imageFilename(url: string): string | undefined {
  try { const parsed = new URL(url); if (parsed.protocol !== 'https:') return; const name=decodeURIComponent(parsed.pathname.split('/').pop() || ''); if (!name || /[\\/\u0000-\u001f]/.test(name) || !/\.(jpe?g|png|webp)$/i.test(name)) return; return name; } catch { return; }
}
/** Read locally. No URLs are fetched and no CSV status, inventory or publishing flag is trusted. */
export function previewShopifyCsv(text: string): ShopifyPreview {
  const parsed=Papa.parse<Row>(text,{header:true,skipEmptyLines:'greedy',transformHeader:s=>s.replace(/^\ufeff/,'').trim()});
  if(parsed.errors.length || Object.keys(parsed.meta.renamedHeaders || {}).length>0 || !parsed.meta.fields?.includes('Title') || !parsed.meta.fields.some(x=>x==='Handle'||x==='URL handle') || parsed.data.length===0 || parsed.data.length>10000) throw new Error('INVALID_SHOPIFY_CSV');
  const groups=new Map<string,Row[]>();
  for(const row of parsed.data){const handle=value(row,'Handle','URL handle');if(!handle || handle.length>255 || /[\u0000-\u001f]/.test(handle)) throw new Error('INVALID_SHOPIFY_CSV'); const group=groups.get(handle)||[];group.push(row);groups.set(handle,group);}
  const items: ShopifyPreviewItem[]=[];
  for(const [handle,rows] of groups){
    const head=rows.find(r=>value(r,'Title'))||rows[0];const title=value(head,'Title');
    const variants=rows.filter(r=>value(r,'Variant Price','Price') || value(r,'Variant SKU','SKU'));
    const imageRows=rows.map(r=>({url:value(r,'Image Src','Product image URL'), position:Number(value(r,'Image Position','Image position'))||Number.MAX_SAFE_INTEGER})).filter(x=>x.url).sort((a,b)=>a.position-b.position);
    const imageCount=new Set(imageRows.map(x=>x.url)).size;const imageName=imageFilename(imageRows[0]?.url||'');
    const out:ShopifyPreviewItem={handle,title,variantCount:variants.length,imageCount,imageName};
    if(!title){out.reason='name';items.push(out);continue;}
    if(new Set(rows.map(r=>value(r,'Title')).filter(Boolean)).size>1){out.reason='conflicting-product';items.push(out);continue;}
    if(variants.length!==1){out.reason='variants';items.push(out);continue;}
    if(!imageName){out.reason='no-image';items.push(out);continue;}
    const variant=variants[0],sku=value(variant,'Variant SKU','SKU');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(sku)){out.reason='sku';items.push(out);continue;}
    const raw=value(variant,'Variant Price','Price');if(!/^\d{1,7}(\.\d{1,2})?$/.test(raw)){out.reason='price';items.push(out);continue;}
    const [whole,frac='']=raw.split('.');let price=Number(whole)*100+Number(frac.padEnd(2,'0'));if(price<1||price>100000000){out.reason='price';items.push(out);continue;}if(price===1999)price=99999;
    const options=[1,2,3].map(n=>{const name=value(head,`Option${n} Name`,`Option${n} name`), v=value(variant,`Option${n} Value`,`Option${n} value`);return name && v && v!=='Default Title'?`${name}: ${v}`:'';}).filter(Boolean);
    const draft=draftProductSchema.safeParse({sku,title,description:options.join(' · '),titleZh:'',descriptionZh:'',category:'General',priceAmount:price,currency:'hkd',stockQty:0,isDemo:true});
    if(!draft.success){out.reason='name';items.push(out);continue;}out.draft=draft.data;items.push(out);
  }
  const names=new Map<string,number>(),skus=new Map<string,number>();for(const i of items)if(i.draft&&i.imageName){names.set(i.imageName,(names.get(i.imageName)||0)+1);skus.set(i.draft.sku,(skus.get(i.draft.sku)||0)+1);}
  for(const i of items)if(i.draft&&i.imageName){if((names.get(i.imageName)||0)>1){delete i.draft;i.reason='ambiguous-image';}else if((skus.get(i.draft.sku)||0)>1){delete i.draft;i.reason='duplicate-sku';}}
  return {rows:parsed.data.length,items};
}
export function matchShopifyFiles(preview:ShopifyPreview,filenames:string[]):Map<string,DraftProduct>{
 const eligible=new Map(preview.items.filter(i=>i.draft&&i.imageName).map(i=>[i.imageName!,i.draft!]));const result=new Map<string,DraftProduct>();
 for(const name of filenames){const draft=eligible.get(name);if(!draft||result.has(name))throw new Error('SHOPIFY_IMAGE_MISMATCH');result.set(name,draft);}
 return result;
}
