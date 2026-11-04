import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
const input=z.object({variant:z.uuid(),revision:z.number().int().positive(),stock:z.number().int().min(0).max(1000000).nullable(),proposedPrice:z.number().int().min(1).max(100000000).nullable(),reason:z.string().trim().min(1).max(1000)}).strict();
async function staffFor(request:Request){const staff=await requireBatchStaff(request);if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);return staff;}
export async function GET(request:Request){try{const staff=await staffFor(request);const product=z.uuid().parse(new URL(request.url).searchParams.get('product'));const {data,error}=await getSupabaseAdmin().rpc('shopify_variant_list',{p_actor:staff.id,p_product:product});if(error)throw error;return batchResponse({ok:true,items:data});}catch(error){return batchFailure(error)}}
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await staffFor(request);const value=input.parse(await readBatchJson(request,4096));const {data,error}=await getSupabaseAdmin().rpc('shopify_variant_adjust',{p_actor:staff.id,p_variant:value.variant,p_revision:value.revision,p_stock:value.stock,p_proposed_price:value.proposedPrice,p_reason:value.reason});if(error)throw error;return batchResponse({ok:true,...data});}catch(error){return batchFailure(error)}}
