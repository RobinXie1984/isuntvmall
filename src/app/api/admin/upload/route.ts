import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdminRequest, isSameOriginRequest } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(null, "Invalid request origin.", 403);
  if (!isAdminRequest(request)) return errorResponse(null, "Admin sign-in required.", 401);
  try {
    const form = await request.formData();
    const file = form.get("file");
    const sku = String(form.get("sku") ?? "product").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
    if (!(file instanceof File)) return errorResponse(null, "Choose an image file.");
    const extension = allowedTypes[file.type];
    if (!extension) return errorResponse(null, "Use a JPEG, PNG, WebP, or GIF image.");
    if (file.size > 8 * 1024 * 1024) return errorResponse(null, "Image must be 8 MB or smaller.");

    const path = `${sku}/${randomUUID()}.${extension}`;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from("product-images").upload(path, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl, path });
  } catch (error) {
    return errorResponse(error, "Image upload failed.");
  }
}
