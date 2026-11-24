import { validSlug } from "@/lib/seo";
import { sourcePriceEntry } from "@/lib/data/price-review";
import { homepagePhotoReviewed, homepagePhotoStatus } from "@/lib/data/homepage-exhibition";
import { getStoreProfile } from "@/lib/store-profile";
import { z } from "zod";
import { requireStaff, requirePermission, requireStaffOrigin } from "@/lib/staff/auth";
import { readStaffJson } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { privateResponse, operationFailure } from "@/lib/admin/response";
import { BatchError } from "@/lib/batch/contracts";
const seo=z.partialRecord(z.enum(["en","zh-Hant","zh-Hans","ja"]),z.object({title:z.string().max(180).optional(),description:z.string().max(500).optional()}).strict()).optional();
const payload = z.object({slug:z.string().refine(v=>v===""||validSlug(v)).optional(),seo,brand:z.string().trim().max(180).optional(),title:z.string().trim().min(1).max(180),titleZh:z.string().max(180),description:z.string().max(5000),descriptionZh:z.string().max(5000),category:z.string().trim().min(1).max(80),priceAmount:z.number().int().min(1).max(999999999),status:z.enum(["draft","published","archived"]),isDemo:z.boolean(),visibleImageIds:z.array(z.uuid()).max(50)}).strict();
const supplier=z.object({name:z.string().max(180).default(""),contact:z.string().max(500).default(""),notes:z.string().max(3000).default("")}).strict();
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("save"),productId:z.uuid(),revision:z.number().int().min(0),baseRevision:z.number().int().positive(),payload,supplier}).strict(),
 z.object({action:z.literal("publish"),productId:z.uuid(),revision:z.number().int().positive()}).strict(),
]);
function fail(message:string){throw new BatchError(["SLUG_CONFLICT","INVALID_SEO","DEMO_LABEL_PROTECTED","PRICE_REVIEW_REQUIRED","STALE_REVISION","INVALID_IMAGE","PUBLIC_IMAGE_REQUIRED","PRODUCT_NOT_FOUND","STAFF_FORBIDDEN"].find(x=>message.includes(x))||"OPERATION_FAILED",409);}
type MerchandisePhoto = {id:string;url:string;visible:boolean};
type MerchandiseRow = {id:string;slug:string;baseRevision:number;images:MerchandisePhoto[];payload:Record<string,unknown>};

export async function GET(request:Request) {
 try {
  const staff=await requireStaff(request);
  requirePermission(staff,"merchandise.manage");
  const url=new URL(request.url);
  const page=z.coerce.number().int().min(0).max(100000).parse(url.searchParams.get("page")||0);
  const search=z.string().max(120).parse(url.searchParams.get("search")||"");
  const db=getSupabaseAdmin();
  const {data,error}=await db.rpc("merchandise_list",{p_actor:staff.id,p_page:page,p_search:search});
  if(error)fail(error.message);
  const rows = data.items as MerchandiseRow[];
  const profile = getStoreProfile();
  const showHomepage = profile.id === "isuntvmall";
  const catalogue = showHomepage && rows.length ? await db.from("products")
    .select("id,status,catalog_revision").in("id", rows.map(item => item.id)) : null;
  const publishedRows = new Map((catalogue?.data ?? []).map(row => [row.id, row]));
  const items = rows.map(item => {
    const current = publishedRows.get(item.id);
    const primary = item.images.find(photo => photo.visible);
    const published = current && current.catalog_revision === item.baseRevision
      ? current.status === "published" && !profile.excludedProductIds.includes(item.id)
      : undefined;
    return {
      ...item,
      payload:{...item.payload,titleZh:item.payload.titleZh??"",descriptionZh:item.payload.descriptionZh??""},
      ...(showHomepage ? { homepage: homepagePhotoStatus(item.slug,primary?.url,published) } : {}),
      images: item.images.map(photo => ({ ...photo, ...(showHomepage ? { paletteReviewed:homepagePhotoReviewed(item.slug,photo.url) } : {}) })),
    };
  });
  return privateResponse({...data,items});
 } catch(e) { return operationFailure(e); }
}
export async function POST(request:Request){try{requireStaffOrigin(request);const staff=await requireStaff(request);requirePermission(staff,"merchandise.manage");const input=schema.parse(await readStaffJson(request,32768));if(input.action==="publish")requirePermission(staff,"catalog.publish");if(input.action==="save"&&sourcePriceEntry(input.productId)){const current=await getSupabaseAdmin().from("products").select("price_amount").eq("id",input.productId).single();if(current.error||!current.data)throw new BatchError("PRODUCT_NOT_FOUND",409);if(input.payload.priceAmount!==current.data.price_amount)throw new BatchError("PRICE_REVIEW_REQUIRED",409);}const args={p_actor:staff.id,p_product:input.productId,p_revision:input.revision};const{data,error}=input.action==="save"?await getSupabaseAdmin().rpc("merchandise_save",{...args,p_base_revision:input.baseRevision,p_payload:input.payload,p_supplier:input.supplier}):await getSupabaseAdmin().rpc("merchandise_publish",args);if(error)fail(error.message);return privateResponse(data);}catch(e){return operationFailure(e);}}
