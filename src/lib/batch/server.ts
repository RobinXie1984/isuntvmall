import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { BatchError, type BatchItem, type MediaBatch } from "./contracts";
import type { BatchStaff } from "./auth";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
export function batchResponse(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: PRIVATE_HEADERS }); }
export function batchFailure(error: unknown) {
  if (error instanceof BatchError) return batchResponse({ ok: false, code: error.code }, error.status);
  if (error instanceof z.ZodError) return batchResponse({ ok: false, code: "INVALID_INPUT" }, 422);
  return batchResponse({ ok: false, code: "BATCH_OPERATION_FAILED" }, 409);
}
export function uuid(value: string) { return z.string().uuid().parse(value); }
export async function batchForStaff(id: string, staff: BatchStaff): Promise<MediaBatch> {
  const { data, error } = await getSupabaseAdmin().from("media_batches").select("id,title,style_id,created_at,created_by").eq("id", uuid(id)).maybeSingle();
  if (error || !data || (staff.role !== "super_admin" && data.created_by !== staff.id)) throw new BatchError("BATCH_NOT_FOUND", 404);
  return data as MediaBatch;
}
export async function itemForStaff(id: string, staff: BatchStaff): Promise<BatchItem> {
  const { data, error } = await getSupabaseAdmin().from("media_batch_items").select("*").eq("id", uuid(id)).maybeSingle();
  if (error || !data) throw new BatchError("ITEM_NOT_FOUND", 404);
  await batchForStaff(data.batch_id, staff);
  return data as BatchItem;
}
export async function signedPreview(item: BatchItem) {
  const db = getSupabaseAdmin();
  const original = item.status !== "awaiting_upload" ? await db.storage.from("batch-originals").createSignedUrl(item.original_path, 300) : null;
  const processed = item.processed_path ? await db.storage.from("batch-processed").createSignedUrl(item.processed_path, 300) : null;
  // Never serialize lease tokens or unrelated database fields to the browser.
  return { id: item.id, batch_id: item.batch_id, filename: item.filename, mime: item.mime, byte_size: item.byte_size, product_data: item.product_data, status: item.status, revision: item.revision, source_sha256: item.source_sha256, output_sha256: item.output_sha256, approved_by: item.approved_by, product_id: item.product_id, error: item.error && item.status !== "rejected" ? "ITEM_REQUIRES_ATTENTION" : null, reviewNote: item.status === "rejected" ? item.error?.slice(0, 1000) : undefined, originalUrl: original?.data?.signedUrl, processedUrl: processed?.data?.signedUrl };
}
