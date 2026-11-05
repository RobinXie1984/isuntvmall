import {expect,it} from 'vitest';
import {spreadsheetRowsToCsv,validateWorkbookArchive,productImportRequestId,readProductSpreadsheet,canManageMigrationTools} from './product-spreadsheet';
import {previewShopifyCsv} from './shopify-import';
import {shopifyStagePayload} from './shopify-stage';
const rows=[['Handle','Title','Option1 Name','Option1 Value','Variant SKU','Variant Price','Variant Inventory Qty'],['test-shirt','Test shirt','Size','S','TEST-S',999.99,0],['test-shirt','','Size','M','TEST-M',999.99,null]];
it('preserves multiple variants, zero versus unknown stock, commas and Unicode through the existing validation path',()=>{
 const preview=previewShopifyCsv(spreadsheetRowsToCsv(rows));
 expect(preview.items).toHaveLength(1);expect(preview.items[0].sourceVariants.map(v=>v.inventoryQuantity)).toEqual([0,null]);
 const payload=shopifyStagePayload(preview,'11111111-1111-4111-8111-111111111111','Test');
 expect(payload.products[0].variants.map(v=>v.sku)).toEqual(['TEST-S','TEST-M']);
 expect(spreadsheetRowsToCsv([['Handle','Title'],['cup','杯, "white"']])).toContain('"杯, ""white"""');
});
it('rejects duplicate headings, ambiguous date values, excess rows and wide sheets',()=>{
 for(const bad of [[['Title','Title']],[['Title'],[new Date()]],Array.from({length:10002},()=>['x']),[Array.from({length:251},()=> 'x')]])expect(()=>spreadsheetRowsToCsv(bad)).toThrow();
});
it('keeps retry receipts stable, scoped to operator and exact content',async()=>{
 const id=await productImportRequestId('staff-a',rows);expect(id).toMatch(/^[a-f0-9-]{14}4[a-f0-9]{3}-[89ab]/);
 expect(await productImportRequestId('staff-a',rows)).toBe(id);
 expect(await productImportRequestId('staff-b',rows)).not.toBe(id);
 expect(await productImportRequestId('staff-a',[...rows,['new']])).not.toBe(id);
});
it('rejects invalid and oversized archive metadata before Excel expansion',()=>{
 expect(()=>validateWorkbookArchive(new ArrayBuffer(0))).toThrow();
 const data=new ArrayBuffer(68),v=new DataView(data);v.setUint32(0,0x02014b50,true);v.setUint32(24,33*1024*1024,true);v.setUint32(46,0x06054b50,true);v.setUint16(56,1,true);v.setUint32(62,0,true);
 expect(()=>validateWorkbookArchive(data)).toThrow();
});
it('rejects legacy Excel and oversized files with actionable file validation',async()=>{
 await expect(readProductSpreadsheet(new File(['not excel'],'bad.xls'))).rejects.toThrow();
 await expect(readProductSpreadsheet(new File([new Uint8Array(2*1024*1024+1)],'big.xlsx'))).rejects.toThrow();
});
it('restricts saved migration tools to the two super administrator roles',()=>{
 for(const role of ['admin','operator','merchandise_admin','finance_admin','kol','catalog_editor'])expect(canManageMigrationTools(role)).toBe(false);
 expect(canManageMigrationTools('super_admin')).toBe(true);expect(canManageMigrationTools('business_super_admin')).toBe(true);
});
