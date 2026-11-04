import {z} from 'zod';
import {requireBatchOrigin,requireBatchStaff} from '@/lib/batch/auth';
import {BatchError,readBatchJson} from '@/lib/batch/contracts';
import {batchFailure,batchResponse} from '@/lib/batch/server';
import {getSupabaseAdmin} from '@/lib/supabase/admin';
import {permissionAllowed} from '@/lib/staff/permissions';
export async function POST(request:Request){try{requireBatchOrigin(request);const staff=await requireBatchStaff(request);if(!permissionAllowed(staff,'catalog.publish'))throw new BatchError('STAFF_FORBIDDEN',403);const input=z.object({variant:z.uuid(),revision:z.number().int().positive(),evidence:z.string().trim().min(20).max(1000).regex(/https:\/\/\S+/)}).strict().parse(await readBatchJson(request,4096));const {data,error}=await getSupabaseAdmin().rpc('shopify_variant_approve_price',{p_actor:staff.id,p_variant:input.variant,p_revision:input.revision,p_evidence:input.evidence});if(error)throw error;return batchResponse({ok:true,...data});}catch(error){return batchFailure(error)}}
