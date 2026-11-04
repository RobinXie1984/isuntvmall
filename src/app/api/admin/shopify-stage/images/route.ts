import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
async function staffFor(request:Request){const staff=await requireBatchStaff(request);if(!permissionAllowed(staff,'merchandise.manage'))throw new BatchError('STAFF_FORBIDDEN',403);return staff;}
export async function GET(request:Request){try{const staff=await staffFor(request);const product=z.uuid().parse(new URL(request.url).searchParams.get('product'));const {data,error}=await getSupabaseAdmin().rpc('shopify_variant_images_list',{p_actor:staff.id,p_product:product});if(error)throw error;return batchResponse({ok:true,items:data});}catch(error){return batchFailure(error)}}
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await staffFor(request);if(!permissionAllowed(staff,'catalog.publish'))throw new BatchError('STAFF_FORBIDDEN',403);const value=z.object({variant:z.uuid(),image:z.uuid()}).strict().parse(await readBatchJson(request,2048));const {data,error}=await getSupabaseAdmin().rpc('shopify_link_variant_image',{p_actor:staff.id,p_variant:value.variant,p_image:value.image});if(error)throw error;return batchResponse({ok:true,...data});}catch(error){return batchFailure(error)}}
