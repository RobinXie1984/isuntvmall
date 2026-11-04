import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await requireBatchStaff(request);if(!permissionAllowed(staff,'catalog.publish'))throw new BatchError('STAFF_FORBIDDEN',403);const input=z.object({product:z.uuid(),catalogRevision:z.number().int().positive(),variants:z.array(z.object({id:z.uuid(),revision:z.number().int().positive()}).strict()).min(1).max(1000),evidence:z.string().trim().min(20).max(1000)}).strict().parse(await readBatchJson(request,100000));const {data,error}=await getSupabaseAdmin().rpc('shopify_publish_native',{p_actor:staff.id,p_product:input.product,p_catalog_revision:input.catalogRevision,p_variant_revisions:input.variants,p_evidence:input.evidence});if(error)throw error;return batchResponse({ok:true,...data});}catch(error){return batchFailure(error)}}
