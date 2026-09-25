import { requireStaff } from "@/lib/staff/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { privateResponse,operationFailure } from "@/lib/admin/response";
export async function GET(request:Request){try{const staff=await requireStaff(request);const{data,error}=await getSupabaseAdmin().rpc("backend_summary",{p_actor:staff.id});if(error)throw error;return privateResponse(data);}catch(error){return operationFailure(error);}}
