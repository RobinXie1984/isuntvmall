import { z } from "zod";
import { requireStaff,requirePermission } from "@/lib/staff/auth";
import { requireBatchOrigin } from "@/lib/batch/auth";
import { readBatchJson,BatchError } from "@/lib/batch/contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { privateResponse,operationFailure } from "@/lib/admin/response";
import { stockAdjustmentSchema } from "@/lib/inventory/contracts";
const publicCodes=new Set(["STOCK_FORBIDDEN","STOCK_NOT_FOUND","PRODUCT_NOT_FOUND","STALE_STOCK_REVISION","REQUEST_CHANGED","STOCK_BELOW_RESERVATIONS","INVALID_STOCK_FILTER","INVALID_STOCK_ADJUSTMENT"]);
function rpcError(message:string){const code=publicCodes.has(message)?message:"STOCK_OPERATION_FAILED";return new BatchError(code,code==="STOCK_FORBIDDEN"?403:409);}
export async function GET(request:Request){try{const staff=await requireStaff(request);requirePermission(staff,"inventory.write");const u=new URL(request.url);const input=z.object({page:z.coerce.number().int().min(0).max(100000),search:z.string().trim().max(100)}).parse({page:u.searchParams.get("page")||0,search:u.searchParams.get("search")||""});const{data,error}=await getSupabaseAdmin().rpc("stock_list",{p_actor:staff.id,p_page:input.page,p_search:input.search});if(error)throw rpcError(error.message);return privateResponse(data);}catch(error){return operationFailure(error);}}
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await requireStaff(request);requirePermission(staff,"inventory.write");const input=stockAdjustmentSchema.parse(await readBatchJson(request,8192));const{data,error}=await getSupabaseAdmin().rpc("stock_adjust",{p_actor:staff.id,p_product:input.productId,p_revision:input.revision,p_request:input.requestId,p_stock_qty:input.stockQty,p_reason:input.reason});if(error)throw rpcError(error.message);return privateResponse(data);}catch(error){return operationFailure(error);}}
