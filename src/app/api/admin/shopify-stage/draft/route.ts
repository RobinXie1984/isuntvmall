import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
const inputSchema=z.object({batch:z.uuid(),handle:z.string().min(1).max(255)}).strict();
export async function POST(request:Request){
 try{
  requireBatchOrigin(request); const staff=await requireBatchStaff(request);
  if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);
  const input=inputSchema.parse(await readBatchJson(request,2048));
  const {data,error}=await getSupabaseAdmin().rpc('shopify_create_draft',{p_actor:staff.id,p_batch:input.batch,p_handle:input.handle});
  if(error)throw error;return batchResponse({ok:true,...data},201);
 }catch(error){return batchFailure(error)}
}
