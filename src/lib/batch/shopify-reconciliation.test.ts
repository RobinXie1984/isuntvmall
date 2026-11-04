import {expect,it} from 'vitest';
import {previewShopifyCsv} from './shopify-import';
import {reconcileShopifyProducts} from './shopify-reconciliation';
const preview=previewShopifyCsv('Handle,Title,Variant SKU,Variant Price\na,Same name,SKU-A,20\nb,Same name,SKU-B,30');
it('uses exact handles and preserves identity without title-based merging',()=>{const result=reconcileShopifyProducts(preview,[{id:'old-a',sku:'SUNTV-1',slug:'suntv-a',sourceHandle:'a'}]);expect(result.map(x=>x.status)).toEqual(['existing','new']);expect(result[0].existingProductId).toBe('old-a');});
it('holds duplicate source identities instead of guessing',()=>{const old={id:'a',sku:'1',slug:'a',sourceHandle:'a'};expect(reconcileShopifyProducts(preview,[old,{...old,id:'b'}])[0].status).toBe('conflict');});
