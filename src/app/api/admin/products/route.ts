import { NextResponse } from "next/server";
import { isAdminRequest, isSameOriginRequest } from "@/lib/admin-auth";
import { upsertProduct } from "@/lib/admin/catalog";
import { productInputSchema } from "@/lib/ingest/products";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(null, "Invalid request origin.", 403);
  if (!isAdminRequest(request)) return errorResponse(null, "Admin sign-in required.", 401);
  try {
    const product = productInputSchema.parse(await request.json());
    const saved = await upsertProduct(product);
    return NextResponse.json({ ok: true, product: saved });
  } catch (error) {
    return errorResponse(error, "Product could not be saved.");
  }
}
