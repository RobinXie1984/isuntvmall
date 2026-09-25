import { requireBatchStaff, requireBatchOrigin } from "@/lib/batch/auth";
import { createBatchSchema, readBatchJson } from "@/lib/batch/contracts";
import { batchFailure, batchResponse } from "@/lib/batch/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStylePreset } from "@/lib/styles";

export async function GET(request: Request) {
  try {
    const staff = await requireBatchStaff(request);
    const page = Math.max(0, Math.min(10000, Number(new URL(request.url).searchParams.get("page")) || 0));
    let query = getSupabaseAdmin().from("media_batches").select("id,title,style_id,created_at,created_by", { count: "exact" }).order("created_at", { ascending: false }).order("id").range(Math.floor(page) * 25, Math.floor(page) * 25 + 24);
    if (staff.role !== "super_admin") query = query.eq("created_by", staff.id);
    const { data, error, count } = await query;
    if (error) throw error;
    return batchResponse({ ok: true, batches: data, count, role: staff.role });
  } catch (error) { return batchFailure(error); }
}
export async function POST(request: Request) {
  try {
    requireBatchOrigin(request);
    const staff = await requireBatchStaff(request);
    const input = createBatchSchema.parse(await readBatchJson(request, 8 * 1024 * 1024));
    const { data, error } = await getSupabaseAdmin().rpc("batch_create", { p_actor: staff.id, p_request_id: input.requestId, p_title: input.title, p_style_id: input.styleId, p_style_snapshot: getStylePreset(input.styleId), p_items: input.items });
    if (error) throw error;
    return batchResponse({ ok: true, id: data }, 201);
  } catch (error) { return batchFailure(error); }
}
