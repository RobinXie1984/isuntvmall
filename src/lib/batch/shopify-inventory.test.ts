import {describe,it,expect} from 'vitest';
import {previewShopifyCsv} from './shopify-import';
import {matchShopifyInventory} from './shopify-inventory';
const products=previewShopifyCsv('Handle,Title,Variant SKU,Variant Price,Option1 Name,Option1 Value\nhat,Hat,S,20,Size,Small\nhat,,L,20,Size,Large');
const headers='Handle,Option1 Value,Option2 Value,Option3 Value,Location,Bin name,Available (not editable),On hand (current)\n';
describe('Shopify inventory snapshots',()=>{
 it('joins exact combinations and keeps locations separate',()=>{const r=matchShopifyInventory(products,headers+'hat,Small,,,HK,A,4,5\nhat,Small,,,US,,2,3\nhat,Large,,,HK,,0,0');expect(r.observations[0][0]).toHaveLength(2);expect(r.observations[0][1][0].available).toBe(0);});
 it('refuses an ambiguous duplicate location instead of choosing stock',()=>{const r=matchShopifyInventory(products,headers+'hat,Small,,,HK,A,4,5\nhat,Small,,,HK,A,3,4');expect(r.ambiguous).toBe(1);expect(r.observations[0][0]).toEqual([]);});
 it('does not replace missing or invalid quantities with zero',()=>{const r=matchShopifyInventory(products,headers+'hat,Small,,,HK,A,,5');expect(r.invalid).toBe(1);expect(r.observations[0][0]).toEqual([]);});
});
