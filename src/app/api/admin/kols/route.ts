import { requireStaff,requirePermission,requireStaffOrigin } from "@/lib/staff/auth";
import { privateResponse,operationFailure } from "@/lib/admin/response";
import { readBatchJson } from "@/lib/batch/contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { kolInputSchema } from "@/lib/ingest/kols";
export async function POST(request:Request){
 try {
  requireStaffOrigin(request); const staff=await requireStaff(request);requirePermission(staff,"team.manage");
  const input=kolInputSchema.parse(await readBatchJson(request,16384));
  const {data,error}=await getSupabaseAdmin().rpc("backend_save_kol",{p_actor:staff.id,p_slug:input.slug,p_name:input.displayName,p_bio:input.bio,p_status:input.status});
  if(error)throw new Error("Host could not be saved.");
  return privateResponse({ok:true,kol:data});
 }catch(error){return operationFailure(error);}
}
