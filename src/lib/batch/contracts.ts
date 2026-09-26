import { z } from "zod";

export const MAX_BATCH_FILES = 1000;
export const MAX_IMAGE_BYTES = 24 * 1024 * 1024;
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const styleIdSchema = z.enum(["muji", "apple", "amazon", "openai", "daks-burberry", "hermes-valentino"]);
export const draftProductSchema = z.object({
  sku: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(1).max(180),
  description: z.string().max(5000).default(""),
  titleZh: z.string().max(180).default(""),
  descriptionZh: z.string().max(5000).default(""),
  category: z.string().trim().min(1).max(80).default("General"),
  priceAmount: z.number().int().min(1).max(100000000).nullable().default(null),
  currency: z.literal("hkd").default("hkd"),
  isDemo: z.boolean().default(false),
  stockQty: z.number().int().min(0).max(1000000).default(0),
}).strict();
export const createBatchSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  styleId: styleIdSchema.default("muji"),
  items: z.array(z.object({
    filename: z.string().min(1).max(240).refine(name => !/[\\/\u0000-\u001f]/.test(name), "Use a filename without a path."),
    mime: z.enum(IMAGE_MIMES),
    byte_size: z.number().int().min(1).max(MAX_IMAGE_BYTES),
    product_data: draftProductSchema.optional(),
  }).strict()).min(1).max(MAX_BATCH_FILES).refine(items => new Set(items.map(item => item.filename)).size === items.length, "Filenames must be unique within a batch."),
}).strict();
export const batchActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("upload"), revision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("finalize"), revision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("retry"), revision: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("edit"), revision: z.number().int().positive(), productData: draftProductSchema }).strict(),
  z.object({ action: z.enum(["approve", "reject"]), revision: z.number().int().positive(), reason: z.string().max(1000).default("") }).strict(),
]);
export type DraftProduct = z.infer<typeof draftProductSchema>;
export type BatchRole = "super_admin" | "operator" | "catalog_editor" | "kol";
export type BatchStatus = "awaiting_upload" | "queued" | "processing" | "review" | "rejected" | "approved" | "publishing" | "published" | "failed";
export type BatchItem = { id: string; batch_id: string; filename: string; mime: string; byte_size: number; original_path: string; processed_path: string | null; product_data: DraftProduct; status: BatchStatus; revision: number; error: string | null; source_sha256: string | null; output_sha256: string | null; approved_by: string | null; product_id: string | null; reviewNote?: string; originalUrl?: string; processedUrl?: string };
export type MediaBatch = { id: string; title: string; style_id: string; created_at: string; created_by: string };

export class BatchError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
export async function readBatchJson(request: Request, maxBytes = 1024 * 1024): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new BatchError("JSON_REQUIRED", 415);
  if (Number(request.headers.get("content-length")) > maxBytes) throw new BatchError("REQUEST_TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new BatchError("INVALID_INPUT", 422);
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > maxBytes) { await reader.cancel(); throw new BatchError("REQUEST_TOO_LARGE", 413); }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes); let offset = 0;
    for (const part of chunks) { body.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch (error) { if (error instanceof BatchError) throw error; throw new BatchError("INVALID_INPUT", 422); }
  finally { reader.releaseLock(); }
}
