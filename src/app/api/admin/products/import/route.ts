import { NextResponse } from "next/server";
import { isAdminRequest, isSameOriginRequest } from "@/lib/admin-auth";
import { importProducts } from "@/lib/admin/catalog";
import { errorResponse } from "@/lib/http";
import { parseProductCsv } from "@/lib/ingest/products";

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 500;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return errorResponse(null, "Invalid request origin.", 403);
  if (!isAdminRequest(request)) return errorResponse(null, "Admin sign-in required.", 401);
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorResponse(null, "Choose a CSV file.");
    if (file.size > MAX_CSV_BYTES) return errorResponse(null, "CSV must be 2 MB or smaller.");

    const { products, issues } = parseProductCsv(await file.text());
    if (issues.length) return NextResponse.json({ ok: false, error: "CSV contains invalid rows.", issues }, { status: 422 });
    if (!products.length) return errorResponse(null, "CSV contains no products.");
    if (products.length > MAX_ROWS) return errorResponse(null, `Import at most ${MAX_ROWS} rows at a time.`);

    const saved = await importProducts(products);
    return NextResponse.json({ ok: true, imported: saved.length });
  } catch (error) {
    return errorResponse(error, "CSV import failed.");
  }
}
