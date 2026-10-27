import { z } from "zod";
import { requireStaff, requirePermission, requireStaffOrigin } from "@/lib/staff/auth";
import { readStaffJson } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { privateResponse, operationFailure } from "@/lib/admin/response";
import { BatchError } from "@/lib/batch/contracts";
import { sourcePriceEntry, sourcePriceKey, reviewedVariants } from "@/lib/data/price-review";
import { sourcePriceDisclosure } from "@/lib/price-disclosure";
import { sourcePurchaseUrl } from "@/lib/data/source-catalogue";
import type { PriceDraft, PriceReviewItem } from "@/lib/admin/price-review-contracts";
const base={productId:z.uuid(),variantId:z.string().regex(/^\d{1,30}$/),revision:z.number().int().min(0)};
const schema=z.discriminatedUnion("action",[
 z.object({...base,action:z.literal("save"),amount:z.number().int().positive().max(999999999).refine(v=>v!==1999),evidence:z.url().max(2000).refine(v=>new URL(v).protocol==="https:"),note:z.string().trim().min(20).max(2000)}).strict(),
 z.object({...base,action:z.literal("approve"),confirmed:z.literal(true)}).strict(),
 z.object({...base,action:z.literal("demo"),note:z.string().trim().min(20).max(2000),confirmed:z.literal(true)}).strict(),
]);
function failure(message:string):never { throw new BatchError(["STALE_REVISION","STALE_REVIEW","PRICE_EVIDENCE_REQUIRED","PRICE_REVIEW_UNSUPPORTED","STAFF_FORBIDDEN"].find(c=>message.includes(c))||"OPERATION_FAILED",409); }
export async function GET(request:Request){try{
 const staff=await requireStaff(request);requirePermission(staff,"merchandise.manage");const db=getSupabaseAdmin();
 const drafts=await db.rpc("price_review_list",{p_actor:staff.id});if(drafts.error)failure(drafts.error.message);
 const byOption=new Map((drafts.data as PriceDraft[]).map(d=>[`${d.product_id}:${d.variant_id}`,d]));
 const items:PriceReviewItem[]=[];
 for(let offset=0;;offset+=500){
  const result=await db.from("products").select("id,sku,slug,title,category,is_demo,status,price_amount,currency,source_price_overrides").order("id").range(offset,offset+499);if(result.error)failure(result.error.message);
  for(const p of result.data){
   const source=sourcePriceEntry(p.id);const supported=source&&source.sku===p.sku&&!p.is_demo&&p.currency==="hkd";
   const variants=supported?reviewedVariants(source,p.source_price_overrides):[];
   items.push({id:p.id,sku:p.sku,slug:p.slug,title:p.title,category:p.category,isDemo:p.is_demo,status:p.status,cardUnverified:!!(supported&&p.price_amount!==source.priceAmount&&!Object.keys(p.source_price_overrides||{}).some(id=>source.variants.some(v=>v.id===id))),
    options:supported?variants.map(v=>{const draft=byOption.get(`${p.id}:${v.id}`)||null;const sourceKey=sourcePriceKey(source,v.id);const override=p.source_price_overrides?.[v.id];return{id:v.id,label:v.options.map(o=>o.en).join(" / "),labels:Object.fromEntries((["en","zh-Hant","zh-Hans","ja"] as const).map(l=>[l,v.options.map(o=>o[l]).join(" / ")])),amount:v.priceAmount,disclosure:sourcePriceDisclosure(v),sourceUrl:sourcePurchaseUrl(source.sourceHandle,v.id),sourceKey,stale:!!((override&&override.sourceKey!==sourceKey)||(draft&&draft.source_key!==sourceKey)),draft};}):[{id:"",label:"",amount:p.price_amount,disclosure:p.is_demo?"demo":"unverified",sourceUrl:"",sourceKey:"",stale:false,draft:null}]});
  }
  if(result.data.length<500)break;
 }
 return privateResponse({items});
}catch(e){return operationFailure(e);}}
export async function POST(request:Request){try{
 requireStaffOrigin(request);const staff=await requireStaff(request);requirePermission(staff,"merchandise.manage");const input=schema.parse(await readStaffJson(request,8192));if(input.action!=="save")requirePermission(staff,"catalog.publish");
 const entry=sourcePriceEntry(input.productId);if(!entry||!entry.variants.some(v=>v.id===input.variantId))throw new BatchError("PRICE_REVIEW_UNSUPPORTED",422);
 const {data,error}=await getSupabaseAdmin().rpc("price_review_change",{p_actor:staff.id,p_action:input.action,p_product:input.productId,p_variant:input.variantId,p_revision:input.revision,p_source_key:sourcePriceKey(entry,input.variantId),p_amount:input.action==="save"?input.amount:null,p_evidence:input.action==="save"?input.evidence:"",p_note:input.action==="approve"?"":input.note});
 if(error)failure(error.message);return privateResponse(data);
}catch(e){return operationFailure(e);}}
