import { z } from "zod";
import { requireStaff, requirePermission } from "@/lib/staff/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { privateResponse,operationFailure } from "@/lib/admin/response";
export async function GET(request:Request){
 try{
  const staff=await requireStaff(request);requirePermission(staff,"orders.read");
  const u=new URL(request.url);const input=z.object({page:z.coerce.number().int().min(0).max(100000),status:z.enum(["","pending","paid","failed","cancelled","refunded","review"]),search:z.string().regex(/^[a-fA-F0-9-]*$/).max(36)}).parse({page:u.searchParams.get("page")||0,status:u.searchParams.get("status")||"",search:u.searchParams.get("search")||""});
  const {data,error}=await getSupabaseAdmin().rpc("order_list_scoped",{p_actor:staff.id,p_page:input.page,p_status:input.status,p_search:input.search});
  if(error)throw error;return privateResponse({...data,role:staff.role});
 }catch(error){return operationFailure(error);}
}
