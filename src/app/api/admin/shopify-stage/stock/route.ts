import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await requireBatchStaff(request);if(!permissionAllowed(staff,'inventory.write'))throw new BatchError('STAFF_FORBIDDEN',403);const input=z.object({variant:z.uuid(),revision:z.number().int().positive(),stock:z.number().int().min(0).max(1000000),reason:z.string().trim().min(1).max(1000)}).strict().parse(await readBatchJson(request,4096));const {data,error}=await getSupabaseAdmin().rpc('shopify_variant_stock_adjust',{p_actor:staff.id,p_variant:input.variant,p_revision:input.revision,p_stock:input.stock,p_reason:input.reason});if(error)throw error;return batchResponse({ok:true,...data});}catch(error){return batchFailure(error)}}
