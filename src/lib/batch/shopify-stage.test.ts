import {describe,it,expect} from 'vitest';
import {previewShopifyCsv} from './shopify-import';
import {shopifyStagePayload,shopifyStageSchema} from './shopify-stage';
const input='Handle,Title,Variant SKU,Variant Price,Option1 Name,Option1 Value,Variant Inventory Qty,Image Src,Cost per item\nhat,Hat,S,80,Size,Small,3,https://example.invalid/a.jpg,SECRET\nhat,,L,90,Size,Large,,,SECRET';
describe('private Shopify intake',()=>{
 it('keeps variants and strips unapproved source columns',()=>{const p=shopifyStagePayload(previewShopifyCsv(input),'11111111-1111-4111-8111-111111111111','Hats'); expect(p.products[0].variants).toHaveLength(2);expect(p.products[0].variants[0].inventoryQuantity).toBe(3);expect(p.products[0].variants[1].inventoryQuantity).toBeNull();expect(JSON.stringify(p)).not.toContain('SECRET');});
 it('refuses unsupported private fields',()=>{const p=shopifyStagePayload(previewShopifyCsv(input),'11111111-1111-4111-8111-111111111111','Hats');expect(shopifyStageSchema.safeParse({...p,products:[{...p.products[0],cost:'SECRET'}]}).success).toBe(false)});
});
