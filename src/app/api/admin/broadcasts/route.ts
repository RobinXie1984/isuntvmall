import { requireStaff, requireStaffOrigin, requirePermission, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffFailure, staffResponse } from "@/lib/staff/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getBroadcasts } from "@/lib/broadcasts/store";
import { broadcastSaveSchema } from "@/lib/broadcasts/contracts";
import { getProducts } from "@/lib/data/store";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const staff = await requireStaff(request); requirePermission(staff,"live.publish"); return staffResponse({ broadcasts: await getBroadcasts(true) }); } catch(error) { return staffFailure(error); }
}
export async function POST(request: Request) {
  try {
    requireStaffOrigin(request);
    const staff = await requireStaff(request); requirePermission(staff,"live.publish");
    const input = broadcastSaveSchema.parse(await readStaffJson(request,16384));
    const approved = new Set((await getProducts()).map(p => p.id));
    if(input.payload.productIds.some(id => !approved.has(id))) throw new StaffError("PRODUCT_NOT_APPROVED",422);
    const { error } = await getSupabaseAdmin().rpc("storefront_broadcast_save",{ p_actor:staff.id,p_id:input.id,p_revision:input.revision,p_payload:input.payload });
    if(error) throw new StaffError(error.message.includes("STALE_BROADCAST") ? "STALE_BROADCAST" : error.code === "23505" ? "INTRODUCTION_EXISTS" : "BROADCAST_SAVE_FAILED",409);
    return staffResponse({ broadcasts: await getBroadcasts(true) });
  } catch(error) { return staffFailure(error); }
}
