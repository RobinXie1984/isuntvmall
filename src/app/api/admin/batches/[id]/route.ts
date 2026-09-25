import { requireBatchStaff } from "@/lib/batch/auth";
import { batchFailure, batchResponse, batchForStaff, signedPreview } from "@/lib/batch/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { BatchItem } from "@/lib/batch/contracts";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireBatchStaff(request);
    const { id } = await params;
    const batch = await batchForStaff(id, staff);
    const url = new URL(request.url);
    const manifest = url.searchParams.get("manifest") === "1";
    const page = Math.floor(Math.max(0, Math.min(100, Number(url.searchParams.get("page")) || 0)));
    const fields = manifest ? "id,filename,mime,byte_size,status,revision" : "id,batch_id,filename,mime,byte_size,original_path,processed_path,product_data,status,revision,error,source_sha256,output_sha256,approved_by,product_id";
    const query = getSupabaseAdmin().from("media_batch_items").select(fields, { count: "exact" }).eq("batch_id", id).order("created_at").order("id");
    const { data, error, count } = await query.range(manifest ? 0 : page * 25, manifest ? 999 : page * 25 + 24);
    if (error) throw error;
    const items = manifest ? data : await Promise.all((data as unknown as BatchItem[]).map(signedPreview));
    return batchResponse({ ok: true, batch, items, count, role: staff.role });
  } catch (error) { return batchFailure(error); }
}
