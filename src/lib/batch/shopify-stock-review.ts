import type {InventoryObservation} from './shopify-inventory';
export type StockReviewVariant={id:string;revision:number;stockQty:number|null;active:boolean;proposedPriceAmount:number|null;preparation?:{reference:{inventorySnapshot?:InventoryObservation[];inventorySourceSha256?:string}}|null};
/** A single named location only. Never sum bins, infer zero, or overwrite counted/live variants. */
export function sourceStockCandidates<T extends StockReviewVariant>(items:T[],location:string){
 if(!location)return [];
 return items.flatMap(item=>{const ref=item.preparation?.reference,rows=ref?.inventorySnapshot?.filter(o=>o.location===location)||[];if(item.stockQty!==null||item.active||rows.length!==1||!Number.isSafeInteger(rows[0].available)||rows[0].available<0||rows[0].available>1000000||!/^[a-f0-9]{64}$/.test(ref?.inventorySourceSha256||''))return [];return [{item,available:rows[0].available,sourceSha256:ref!.inventorySourceSha256!}];});
}
