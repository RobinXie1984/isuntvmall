import { z } from 'zod';
import type { ShopifyPreview } from './shopify-import';
import type {InventoryObservation} from './shopify-inventory';
const short=z.string().max(2048);
const source=z.record(z.string().max(80),z.string().max(100000));
const option=z.object({name:short,value:short}).strict();
const observation=z.object({location:short,bin:short,available:z.number().int().safe(),onHand:z.number().int().safe().nullable()}).strict();
const variant=z.object({sku:short,price:short,options:z.array(option).max(3),inventoryQuantity:z.number().int().safe().nullable(),inventoryProvided:z.boolean(),inventoryTracker:short,barcode:short,imageUrl:short,source,inventorySnapshot:z.array(observation).max(250)}).strict();
const image=z.object({url:short,position:short,alt:short}).strict();
const product=z.object({handle:z.string().min(1).max(255),title:z.string().min(1).max(180),variants:z.array(variant).max(1000),images:z.array(image).max(250),source}).strict();
export const shopifyStageSchema=z.object({requestId:z.uuid(),title:z.string().trim().min(1).max(120),products:z.array(product).min(1).max(500)}).strict();
const productFields=['Body (HTML)','Vendor','Product Category','Type','Tags','Published','Gift Card','SEO Title','SEO Description','Status'];
const variantFields=['Variant Grams','Variant Inventory Policy','Variant Fulfillment Service','Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Unit Price Total Measure','Unit Price Total Measure Unit','Unit Price Base Measure','Unit Price Base Measure Unit','Variant Weight Unit','Variant Tax Code','Variant Packed Length','Variant Packed Width','Variant Packed Height','Variant Packed Dimension Unit','Option1 Linked To','Option2 Linked To','Option3 Linked To'];
const pick=(row:Record<string,string>,fields:string[])=>Object.fromEntries(fields.filter(k=>row[k]!==undefined && row[k]!=='').map(k=>[k,row[k]]));
/** Select only fields that merchandise staff may work with; source costs and other private columns remain on the operator's device. */
export function shopifyStagePayload(preview:ShopifyPreview, requestId:string, title:string, inventory:InventoryObservation[][][] = []) {
 return shopifyStageSchema.parse({requestId,title,products:preview.items.map(({handle,title,sourceVariants,sourceImages,sourceRows},index)=>{const rows=sourceRows.filter(r=>r['Variant Price'] || r['Price'] || r['Variant SKU'] || r['SKU']); return {handle,title,variants:sourceVariants.map((v,i)=>({...v,source:pick(rows[i]||{},variantFields),inventorySnapshot:inventory[index]?.[i]||[]})),images:sourceImages,source:pick(sourceRows.find(r=>r.Title)||sourceRows[0]||{},productFields)};})});
}
