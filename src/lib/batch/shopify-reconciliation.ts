import type {ShopifyPreview} from './shopify-import';
type ExistingSource={id:string;sku:string;slug:string;sourceHandle:string};
/** Exact source handles preserve current identity. Fuzzy titles never authorize a merge. */
export function reconcileShopifyProducts(preview:ShopifyPreview,existing:ExistingSource[]){
 return preview.items.map(item=>{
  const matches=existing.filter(p=>p.sourceHandle===item.handle);
  const base={handle:item.handle,variantCount:item.variantCount,imageCount:item.imageCount};
  if(matches.length>1)return {...base,status:'conflict' as const,existingProductId:null,reason:'ambiguous-source-handle'};
  if(matches.length===1)return {...base,status:'existing' as const,existingProductId:matches[0].id,existingSku:matches[0].sku,existingSlug:matches[0].slug,reason:'preserve-existing-listing-until-reviewed-cutover'};
  return {...base,status:'new' as const,existingProductId:null,reason:'private-draft-only'};
 });
}
