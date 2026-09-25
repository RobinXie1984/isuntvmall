import { requireBatchOrigin, requireBatchStaff } from "@/lib/batch/auth";
import { BatchError, batchActionSchema, readBatchJson } from "@/lib/batch/contracts";
import { batchFailure, batchResponse, itemForStaff } from "@/lib/batch/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireBatchOrigin(request);
    const staff = await requireBatchStaff(request);
    const input = batchActionSchema.parse(await readBatchJson(request, 16384));
    const item = await itemForStaff((await params).id, staff);
    if (item.revision !== input.revision) throw new BatchError("STALE_REVISION", 409);
    const db = getSupabaseAdmin();
    if (input.action === "upload") {
      if (item.status !== "awaiting_upload") throw new BatchError("INVALID_STATE", 409);
      const { data, error } = await db.storage.from("batch-originals").createSignedUploadUrl(item.original_path, { upsert: false });
      if (error) throw error;
      return batchResponse({ ok: true, signedUrl: data.signedUrl });
    }
    if (input.action === "finalize") {
      const { data, error } = await db.storage.from("batch-originals").info(item.original_path);
      const info = data as unknown as { size?: number; contentType?: string; metadata?: { size?: number; mimetype?: string } } | null;
      const size = info?.size ?? info?.metadata?.size;
      const contentType = info?.contentType ?? info?.metadata?.mimetype;
      if (error || size !== item.byte_size || contentType !== item.mime) throw new BatchError("UPLOAD_MISMATCH", 422);
      // Decoder-level validation and SHA-256 happen in the bounded worker before review.
      const result = await db.rpc("batch_finalize", { p_actor: staff.id, p_item_id: item.id, p_revision: input.revision });
      if (result.error) throw result.error;
      return batchResponse({ ok: true });
    }
    if ((input.action === "approve" || input.action === "reject") && staff.role !== "super_admin") throw new BatchError("SUPER_ADMIN_REQUIRED", 403);
    const common = { p_actor: staff.id, p_item_id: item.id, p_revision: input.revision };
    const result = input.action === "edit" ? await db.rpc("batch_edit", { ...common, p_product_data: input.productData })
      : input.action === "retry" ? await db.rpc("batch_retry", common)
      : await db.rpc("batch_review", { ...common, p_decision: input.action, p_reason: input.reason });
    if (result.error) throw result.error;
    return batchResponse({ ok: true });
  } catch (error) { return batchFailure(error); }
}
