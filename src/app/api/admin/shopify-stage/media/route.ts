import {z} from 'zod';
import {requireBatchOrigin, requireBatchStaff} from '@/lib/batch/auth';
import {BatchError, readBatchJson} from '@/lib/batch/contracts';
import {batchFailure, batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
import {getStylePreset} from '@/lib/styles';
const inputSchema=z.object({batch:z.uuid(),handle:z.string().min(1).max(255)}).strict();
const safeCodes=['BATCH_ADMISSION_PAUSED','BATCH_ADMISSION_BACKPRESSURE','BATCH_ADMISSION_STORAGE_LIMIT','BATCH_ADMISSION_BATCH_LIMIT','STAGED_PRODUCT_UNAVAILABLE','STAFF_FORBIDDEN'];
/** Source references are resolved inside the service-only RPC, never supplied by the caller. */
export async function POST(request:Request){
 try{
  requireBatchOrigin(request);
  const staff=await requireBatchStaff(request);
  if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);
  const input=inputSchema.parse(await readBatchJson(request,2048));
  const {data,error}=await getSupabaseAdmin().rpc('shopify_queue_source_images',{p_actor:staff.id,p_batch:input.batch,p_handle:input.handle,p_style_snapshot:getStylePreset('muji')});
  if(error){const code=safeCodes.find(code=>error.message===code);if(code)throw new BatchError(code,code==='STAFF_FORBIDDEN'?403:409);throw error;}
  return batchResponse({ok:true,...data},201);
 }catch(error){return batchFailure(error);}
}
