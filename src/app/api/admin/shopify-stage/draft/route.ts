import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchResponse} from '@/lib/batch/server';
import {shopifyImportFailure} from '@/lib/batch/shopify-import-failure';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
import sourceCatalogue from '@/lib/data/suntvmall-catalogue.json';
const inputSchema=z.object({batch:z.uuid(),handle:z.string().min(1).max(255)}).strict();
export async function POST(request:Request){
 try{
  requireBatchOrigin(request); const staff=await requireBatchStaff(request);
  if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);
  const input=inputSchema.parse(await readBatchJson(request,2048));
  // The public source catalogue also contains products outside the database.
  // Hold matching handles for an explicit migration rather than duplicating them.
  const existing=sourceCatalogue.products.find(product=>product.sourceHandle===input.handle);
  const {data,error}=await getSupabaseAdmin().rpc(existing?'shopify_reconcile_existing':'shopify_create_draft',{p_actor:staff.id,p_batch:input.batch,p_handle:input.handle,...(existing?{p_product:existing.id,p_sku:existing.sku,p_slug:existing.slug}:{})});
  if(error)throw error;return batchResponse({ok:true,...data},201);
 }catch(error){return shopifyImportFailure(error)}
}
