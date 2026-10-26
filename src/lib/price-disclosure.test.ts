import { describe, expect, it } from 'vitest';
import { productPriceDisclosure, sourcePriceDisclosure, priceDisclosureCopy } from './price-disclosure';
import { enrichSourceProduct } from './data/source-catalogue';
import catalogue from './data/suntvmall-catalogue.json';
import { supplierDemoProducts } from './data/supplier-demo';
import { demoProducts } from './data/demo';
import { translate } from './i18n';
import type { Product } from '@/types/commerce';
const product = (entry = catalogue.products.find(p=>p.sourceHandle==='gtcq-002')!): Product => enrichSourceProduct({...demoProducts[0],id:entry.id,sku:entry.sku,isDemo:false,priceAmount:entry.priceAmount,currency:'hkd'});
describe('price provenance across the catalogue',()=>{
 it('identifies every source amount without changing it',()=>{
  let demo=0,source=0;
  for(const entry of catalogue.products){
   const p=product(entry);expect(p.priceAmount).toBe(entry.priceAmount);
   expect(productPriceDisclosure(p)).toBe(entry.variants.some(v=>'priceIsPlaceholder' in v&&v.priceIsPlaceholder)?'demo':'source');
   for(const v of p.sourceListing!.variants){if(sourcePriceDisclosure(v)==='demo')demo++;else if(sourcePriceDisclosure(v)==='source')source++;}
  }
  expect(demo).toBe(346);expect(source).toBe(431);
 });
 it('explicitly labels all mock-up prices',()=>{for(const p of [...demoProducts,...supplierDemoProducts])expect(productPriceDisclosure(p)).toBe('demo');});
 it('does not claim a colleague price edit or currency mismatch is verified by SunTVMall',()=>{
  const p=product();expect(productPriceDisclosure({...p,priceAmount:p.priceAmount+1})).toBe('unverified');expect(productPriceDisclosure({...p,currency:'usd'})).toBe('unverified');expect(productPriceDisclosure({...p,sourceListing:undefined})).toBe('unverified');
 });
 it('fails closed for invalid or generic amounts even if flags are missing',()=>{
  const p=product();for(const amount of [1999,0,-1,NaN,Infinity,1.2])expect(sourcePriceDisclosure({...p.sourceListing!.variants[0],priceAmount:amount})).toBe('unverified');
  expect(productPriceDisclosure({...p,sourceListing:{...p.sourceListing!,variants:[]}})).toBe('unverified');
 });
 it('keeps ordinary merchant pricing independent from source and demo rules',()=>{expect(productPriceDisclosure({...product(),sku:'MERCHANT-1',sourceListing:undefined})).toBeNull();});
 it('gives each disclosure distinct four-language wording',()=>{for(const copy of Object.values(priceDisclosureCopy)){const [en,zh,ja]=copy;const values=['en','zh-Hant','zh-Hans','ja'].map(locale=>translate(en,zh,locale as 'en',ja));expect(new Set(values).size).toBe(4);}});
});
