import Papa from 'papaparse';
import type {ShopifyPreview} from './shopify-import';
type Row=Record<string,string>;
export type InventoryObservation={location:string;bin:string;available:number;onHand:number|null};
const qty=(v:string|undefined):number|null=>{const s=(v||'').trim();if(!/^-?\d+$/.test(s))return null;const n=Number(s);return Number.isSafeInteger(n)?n:null};
const key=(handle:string,values:string[])=>JSON.stringify([handle.trim(),...values.map(x=>x.trim())]);
/** Shopify all-states export: identify exact option combination; never infer stock from a product total. */
export function matchShopifyInventory(preview:ShopifyPreview,text:string) {
 const csv=Papa.parse<Row>(text,{header:true,skipEmptyLines:'greedy',transformHeader:s=>s.replace(/^\ufeff/,'').trim()});
 if(csv.errors.length||Object.keys(csv.meta.renamedHeaders||{}).length||!['Handle','Location','Option1 Value','Available (not editable)'].every(x=>csv.meta.fields?.includes(x))||csv.data.length>100000)throw new Error('INVALID_INVENTORY_CSV');
 const variantKey=(item:ShopifyPreview['items'][number],j:number)=>{const rows=item.sourceRows.filter(r=>r['Variant Price'] || r['Price'] || r['Variant SKU'] || r['SKU']);const row=rows[j]||{};return key(item.handle,[1,2,3].map(n=>row[`Option${n} Value`]||row[`Option${n} value`]||''));};
 const byKey=new Map<string,{item:number;variant:number}[]>();
 preview.items.forEach((item,i)=>item.sourceVariants.forEach((_v,j)=>{const k=variantKey(item,j);const list=byKey.get(k)||[];list.push({item:i,variant:j});byKey.set(k,list)}));
 const found=new Map<string,InventoryObservation[]>(),seen=new Set<string>();let unmatched=0,ambiguous=0,invalid=0;
 for(const row of csv.data){
  const k=key(row.Handle||'', [row['Option1 Value']||'',row['Option2 Value']||'',row['Option3 Value']||'']);const match=byKey.get(k)||[];
  if(match.length!==1){if(match.length)ambiguous++;else unmatched++;continue;}
  const location=(row.Location||'').trim(),bin=(row['Bin name']||'').trim(),available=qty(row['Available (not editable)']),onHand=qty(row['On hand (current)']);
  if(!location||available===null){invalid++;continue;}
  const unique=JSON.stringify([k,location,bin]);if(seen.has(unique)){ambiguous++;found.delete(k);continue;}seen.add(unique);
  if(!found.has(k))found.set(k,[]);found.get(k)!.push({location,bin,available,onHand});
 }
 // Duplicate location/bin makes the entire combination unsafe, including later rows.
 const conflicted=new Set<string>();
 // Duplicate combinations are detected a second time without exposing partial matches.
 const counts=new Map<string,number>();for(const row of csv.data){const k=key(row.Handle||'',[row['Option1 Value']||'',row['Option2 Value']||'',row['Option3 Value']||'']);const u=JSON.stringify([k,(row.Location||'').trim(),(row['Bin name']||'').trim()]);counts.set(u,(counts.get(u)||0)+1);if(counts.get(u)!>1)conflicted.add(k);}
 for(const k of conflicted)found.delete(k);
 return {rows:csv.data.length,unmatched,ambiguous,invalid,observations:preview.items.map(item=>item.sourceVariants.map((_v,j)=>found.get(variantKey(item,j))||[]))};
}
