import {requireStaff,requirePermission,requireStaffOrigin,StaffError} from "@/lib/staff/auth";
import {privateResponse,operationFailure} from "@/lib/admin/response";
import {readBatchJson} from "@/lib/batch/contracts";
import {getSupabaseAdmin} from "@/lib/supabase/admin";
import {admissionPolicyInput} from "@/lib/checkout/admission-schema";
import {checkoutVerificationConfigured} from "@/lib/checkout/verification";
import {checkoutReleaseReady} from "@/lib/cart";
export async function GET(request:Request){try{const staff=await requireStaff(request);requirePermission(staff,"team.manage");const{data,error}=await getSupabaseAdmin().rpc("checkout_admission_policy_get",{p_actor:staff.id});if(error)throw new StaffError("ADMISSION_POLICY_UNAVAILABLE",503);return privateResponse({policy:data,verificationConfigured:checkoutVerificationConfigured(),checkoutReleased:checkoutReleaseReady()});}catch(error){return operationFailure(error);}}
export async function POST(request:Request){try{requireStaffOrigin(request);const staff=await requireStaff(request);requirePermission(staff,"team.manage");const input=admissionPolicyInput.parse(await readBatchJson(request,4096));if(input.enabled&&!checkoutVerificationConfigured())throw new StaffError("CHECKOUT_VERIFICATION_NOT_CONFIGURED",409);const{data,error}=await getSupabaseAdmin().rpc("checkout_admission_policy_set",{p_actor:staff.id,p_enabled:input.enabled,p_max_recent:input.maxRecent,p_max_client_active:input.maxClientActive,p_max_store_active:input.maxStoreActive});if(error)throw new StaffError("ADMISSION_POLICY_UNAVAILABLE",503);return privateResponse({policy:data});}catch(error){return operationFailure(error);}}
