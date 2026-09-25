import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
const headers = { "Cache-Control": "no-store, max-age=0" };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ ok: false, code: "LIVE_NOT_FOUND" }, { status: 404, headers });
  if (!hasSupabaseConfig()) return NextResponse.json({ ok: false, code: "LIVE_NOT_CONFIGURED" }, { status: 503, headers });
  try {
    const { data, error } = await getSupabaseAdmin().rpc("live_room_public", { p_room_id: parsed.data });
    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, code: "LIVE_NOT_FOUND" }, { status: 404, headers });
    return NextResponse.json({ ok: true, room: data }, { headers });
  } catch { return NextResponse.json({ ok: false, code: "LIVE_UNAVAILABLE" }, { status: 503, headers }); }
}
