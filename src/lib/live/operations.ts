import "server-only";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildLiveEmbed } from "./adapters";
import { getSiteUrl } from "@/lib/env";
import { requirePermission, StaffError, type Staff } from "@/lib/staff/auth";
import { liveDraftSchema, type LiveAction, type LiveDraft, type LiveControl, type LiveSourceCheck } from "./operations-schema";

const knownErrors = ["LIVE_FORBIDDEN", "LIVE_NOT_FOUND", "INVALID_LIVE_DRAFT", "STALE_LIVE_REVISION", "SOURCE_CHANGE_REQUIRES_OPERATOR", "HOST_UNAVAILABLE", "SOURCE_NOT_VERIFIED", "UNSUPPORTED_EMBED", "EMPTY_LIVE_RAIL", "PRODUCT_NOT_APPROVED", "ROOM_NOT_LIVE", "STALE_PIN_REVISION", "PRODUCT_NOT_IN_RAIL"];
function rpcFailure(error: { message?: string; code?: string }) {
  const code = knownErrors.find(value => error.message?.includes(value));
  if (code) throw new StaffError(code, code === "LIVE_FORBIDDEN" ? 403 : code === "LIVE_NOT_FOUND" ? 404 : 409);
  if (error.code === "23505") throw new StaffError("LIVE_SLUG_IN_USE", 409);
  throw new StaffError("LIVE_OPERATION_FAILED", 409);
}
export async function getLiveDrafts(staff: Staff, page = 0) {
  requirePermission(staff, "live.read");
  const index = Math.max(0, Math.min(10000, Math.floor(page)));
  let query = getSupabaseAdmin().from("live_room_drafts").select("id,kol_id,payload,revision,state,published_revision,updated_at", { count: "exact" }).order("updated_at", { ascending: false }).order("id").range(index * 25, index * 25 + 24);
  if (staff.role === "kol") query = query.eq("kol_id", staff.kolId);
  const { data, error, count } = await query;
  if (error) rpcFailure(error);
  return { drafts: data as LiveDraft[], count: count ?? 0 };
}
export async function getLiveDraft(id: string, staff: Staff): Promise<LiveDraft> {
  requirePermission(staff, "live.read");
  const { data, error } = await getSupabaseAdmin().from("live_room_drafts").select("id,kol_id,payload,revision,state,published_revision,updated_at").eq("id", z.uuid().parse(id)).maybeSingle();
  if (error || !data || (staff.role === "kol" && data.kol_id !== staff.kolId)) throw new StaffError("LIVE_NOT_FOUND", 404);
  return data as LiveDraft;
}
export async function getLiveOperationsDetail(id: string, staff: Staff) {
  const draft = await getLiveDraft(id, staff); const db = getSupabaseAdmin();
  const [check, control] = await Promise.all([
    db.from("live_source_checks").select("draft_revision,playback_mode,tested_origin,device_note,checked_at").eq("room_id", id).eq("draft_revision", draft.revision).maybeSingle(),
    db.from("live_room_state").select("room_id,revision,pinned_product_id").eq("room_id", id).maybeSingle(),
  ]);
  if (check.error || control.error) throw new StaffError("LIVE_OPERATION_FAILED", 409);
  // Pin choices always come from the published rail, never an unapproved draft.
  const rail = await db.from("live_products").select("product_id,position").eq("live_session_id", id).order("position");
  if (rail.error) rpcFailure(rail.error);
  return { draft, sourceCheck: check.data as LiveSourceCheck | null, control: control.data as LiveControl | null, publishedProductIds: (rail.data ?? []).map(row => row.product_id as string) };
}
export async function runLiveAction(id: string, staff: Staff, action: LiveAction) {
  const roomId = z.uuid().parse(id); const db = getSupabaseAdmin();
  if (action.action === "save") {
    const payload = liveDraftSchema.parse(action.payload);
    requirePermission(staff, "live.draft", { kolId: payload.kolId });
    const { error } = await db.rpc("live_room_save", { p_actor: staff.id, p_room_id: roomId, p_revision: action.revision, p_payload: payload });
    if (error) rpcFailure(error);
  } else {
    const draft = await getLiveDraft(roomId, staff);
    if (action.action === "request") {
      requirePermission(staff, "live.request", { kolId: draft.kol_id });
      const result = await db.rpc("live_room_request", { p_actor: staff.id, p_room_id: roomId, p_revision: action.revision }); if (result.error) rpcFailure(result.error);
    } else if (action.action === "pin") {
      // SQL additionally uses the currently published host, not a changed draft host.
      requirePermission(staff, "live.pin", { kolId: draft.kol_id });
      const result = await db.rpc("live_room_pin", { p_actor: staff.id, p_room_id: roomId, p_state_revision: action.stateRevision, p_product_id: action.productId }); if (result.error) rpcFailure(result.error);
    } else {
      requirePermission(staff, "live.publish", { kolId: draft.kol_id });
      if (action.action === "verify") {
        if (action.mode === "embedded" && buildLiveEmbed(draft.payload.platform, draft.payload.externalUrl, draft.payload.embedId).kind !== "iframe") throw new StaffError("UNSUPPORTED_EMBED", 409);
        const result = await db.rpc("live_source_verify", { p_actor: staff.id, p_room_id: roomId, p_revision: action.revision, p_mode: action.mode, p_origin: getSiteUrl(), p_device_note: action.deviceNote, p_rights: action.rightsConfirmed, p_playback: action.playbackConfirmed }); if (result.error) rpcFailure(result.error);
      } else {
        const result = await db.rpc("live_room_publish", { p_actor: staff.id, p_room_id: roomId, p_revision: action.revision }); if (result.error) rpcFailure(result.error);
      }
    }
  }
  return getLiveOperationsDetail(roomId, staff);
}
