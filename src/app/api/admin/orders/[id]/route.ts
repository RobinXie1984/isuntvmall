import { z } from "zod";
import { requireStaff,requirePermission } from "@/lib/staff/auth";
import { requireBatchOrigin } from "@/lib/batch/auth";
import { readBatchJson,BatchError } from "@/lib/batch/contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { orderActionSchema } from "@/lib/orders/contracts";
import { privateResponse,operationFailure } from "@/lib/admin/response";
const publicCodes=new Set(["ORDER_FORBIDDEN","ORDER_NOT_FOUND","STALE_REVISION","REQUEST_CHANGED","PAID_ORDER_REQUIRED","INVALID_FULFILLMENT_TRANSITION","TRACKING_REQUIRED","REFUND_REVIEW_HOLD","ASSIGNEE_INVALID","REFUND_REQUEST_INVALID","REFUND_REVIEW_INVALID","REFUND_REQUEST_NOT_FOUND"]);
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  requireBatchOrigin(request);const staff=await requireStaff(request);requirePermission(staff,"orders.write");
  const id=z.string().uuid().parse((await params).id);const input=orderActionSchema.parse(await readBatchJson(request,8192));
  const {data,error}=await getSupabaseAdmin().rpc("order_operate",{p_actor:staff.id,p_order:id,p_revision:input.revision,p_request:input.requestId,p_action:input.action,p_data:input.data});
  if(error){const code=publicCodes.has(error.message)?error.message:"ORDER_OPERATION_FAILED";throw new BatchError(code,code==="ORDER_FORBIDDEN"?403:409);}
  return privateResponse(data);
 }catch(error){return operationFailure(error);}
}
