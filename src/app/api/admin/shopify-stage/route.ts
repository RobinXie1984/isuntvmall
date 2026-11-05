import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {shopifyStageSchema} from '@/lib/batch/shopify-stage';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
import {BatchError} from '@/lib/batch/contracts';
import {canManageMigrationTools} from '@/lib/batch/product-spreadsheet';
import sourceCatalogue from '@/lib/data/suntvmall-catalogue.json';
export async function POST(request:Request) {
 try {
  requireBatchOrigin(request); const staff=await requireBatchStaff(request);
  if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);
  const data=shopifyStageSchema.parse(await readBatchJson(request,4*1024*1024));
  const result=await getSupabaseAdmin().rpc('shopify_stage',{p_actor:staff.id,p_request:data.requestId,p_title:data.title,p_products:data.products});
  if(result.error)throw result.error;
  return batchResponse({ok:true,...result.data},201);
 } catch(error) {return batchFailure(error);}
}
export async function GET(request:Request) {
 try {
  const staff=await requireBatchStaff(request);
  if(!permissionAllowed(staff,'merchandise.manage') || !canManageMigrationTools(staff.role))throw new BatchError('STAFF_FORBIDDEN',403);
  const params=new URL(request.url).searchParams, batch=params.get('batch'), page=params.get('page')||'0';
  if(batch && (!zodUuid(batch)||!/^\d{1,5}$/.test(page)))throw new BatchError('INVALID_INPUT',422);
  const result=batch ? await getSupabaseAdmin().rpc('shopify_staged_products',{p_actor:staff.id,p_batch:batch,p_page:Number(page)}) : await getSupabaseAdmin().rpc('shopify_staged_batches',{p_actor:staff.id});
  if(result.error)throw result.error;
  const items=batch && Array.isArray(result.data)?result.data.map(item=>{const existing=sourceCatalogue.products.find(p=>p.sourceHandle===item.handle);return {...item,...(existing?{existingProductId:existing.id,existingSku:existing.sku}:{})};}):result.data;
  return batchResponse({ok:true,items});
 } catch(error) {return batchFailure(error);}
}
function zodUuid(value:string) {return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
