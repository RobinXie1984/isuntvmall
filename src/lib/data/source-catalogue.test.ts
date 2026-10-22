import {describe,it,expect,vi} from 'vitest';
import {getStoreProfile} from '../store-profile';
import catalogue from './suntvmall-catalogue.json';
import {enrichSourceProduct,isSourceProductId,sourcePurchaseUrl} from './source-catalogue';
import {productTitle,productDescription} from '../product-copy';
import type {Product} from '@/types/commerce';
vi.mock('server-only',()=>({}));
const db=vi.hoisted(()=>({rows:[] as Record<string,unknown>[]}));
vi.mock('@/lib/env',()=>({hasSupabaseConfig:()=>true}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({from:()=>{const q={select:()=>q,in:()=>q,eq:()=>q,then:(resolve:(r:unknown)=>unknown)=>Promise.resolve({data:db.rows,error:null}).then(resolve)};return q;}})}));
import {getProductsByIds} from './store';
const row=catalogue.products[0];
const base:Product={id:row.id,sku:row.sku,slug:row.slug,title:row.title.en,titleZh:row.title['zh-Hant'],description:row.description.en,descriptionZh:row.description['zh-Hant'],priceAmount:row.priceAmount,currency:'hkd',stockQty:0,category:row.category,status:'published',featured:true,createdAt:'2026-10-22',images:[]};
describe('current SunTVMall catalogue',()=>{
 it('retains 75 unique listings and all 777 exact option identities',()=>{
  expect(catalogue.products).toHaveLength(75);const variants=catalogue.products.flatMap(p=>p.variants);expect(variants).toHaveLength(777);expect(new Set(variants.map(v=>v.id)).size).toBe(777);expect(new Set(catalogue.products.map(p=>p.id)).size).toBe(75);
  for(const p of catalogue.products){expect(p.priceAmount).toBe(Math.min(...p.variants.map(v=>v.priceAmount)));expect(p.variants.every(v=>v.options.length===p.options.length)).toBe(true);for(const v of p.variants){expect(Number.isSafeInteger(v.priceAmount)&&v.priceAmount>0).toBe(true);expect(new URL(sourcePurchaseUrl(p.sourceHandle,v.id)).hostname).toBe('suntvmall.com');for(const o of v.options)expect(Object.values(o).every(Boolean)).toBe(true);}}
 });
 it('keeps every variant selectable without translated-name collisions',()=>{for(const p of catalogue.products){for(const locale of ['en','zh-Hant','zh-Hans','ja'] as const){expect(new Set(p.variants.map(v=>JSON.stringify(v.options.map(o=>o[locale])))).size).toBe(p.variants.length);}}});
 it('localizes all four languages and preserves later merchant edits',()=>{const p=enrichSourceProduct(base);for(const locale of ['en','zh-Hant','zh-Hans','ja'] as const){expect(productTitle(p,locale)).toBe(row.title[locale]);expect(productDescription(p,locale)).toBe(row.description[locale]);}expect(productTitle({...p,title:'New merchant title'},'en')).toBe('New merchant title');expect(productTitle({...p,titleZh:'商家新名稱'},'zh-Hant')).toBe('商家新名稱');});
 it('does not attach source metadata to unrelated IDs or a mismatched SKU',()=>{expect(enrichSourceProduct({...base,id:'other'}).sourceListing).toBeUndefined();expect(enrichSourceProduct({...base,sku:'different'}).sourceListing).toBeUndefined();expect(isSourceProductId(base.id)).toBe(true);});
 it('disables source enrichment for other store configurations',()=>{const previous=process.env.NEXT_PUBLIC_STORE_PROFILE;const profile=getStoreProfile();process.env.NEXT_PUBLIC_STORE_PROFILE=JSON.stringify({...profile,id:'other-store',collections:{...profile.collections,suntvmall:false}});try{expect(enrichSourceProduct(base).sourceListing).toBeUndefined();}finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_STORE_PROFILE;else process.env.NEXT_PUBLIC_STORE_PROFILE=previous;}});
 it('rejects unsafe external destinations',()=>{for(const handle of ['//evil.test','x?next=evil','../x','javascript:alert(1)'])expect(()=>sourcePurchaseUrl(handle,'123')).toThrow();expect(()=>sourcePurchaseUrl('valid','123&other=1')).toThrow();});
 it('rejects source products at server checkout even if their inventory is later increased',async()=>{db.rows=[{id:base.id,sku:base.sku,slug:base.slug,title:base.title,status:'published',stock_qty:100,price_amount:1,currency:'hkd',product_images:[{id:'image',source_url:'https://example.com/real.webp',is_visible:true}]}];expect(await getProductsByIds([base.id])).toEqual([]);});
});
