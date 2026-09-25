import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";
import { requireStaff, requirePermission, requireStaffOrigin, STAFF_ROLES, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
export async function POST(request: Request) {
 try {
  requireStaffOrigin(request); const staff = await requireStaff(request); requirePermission(staff, "team.manage");
  const body = z.object({ requestId: z.string().uuid(), email: z.string().email().max(254), role: z.enum(STAFF_ROLES), kolId: z.string().uuid().nullable() }).strict().parse(await readStaffJson(request));
  if ((body.role === "kol") !== Boolean(body.kolId)) throw new StaffError("KOL_BINDING_REQUIRED", 422);
  const db = getSupabaseAdmin();
  if (body.kolId) { const host = await db.from("kols").select("id").eq("id", body.kolId).eq("status", "active").maybeSingle(); if (host.error || !host.data) throw new StaffError("KOL_NOT_ACTIVE", 422); }
  const reserved = await db.from("staff_invitations").insert({ id: body.requestId, actor_id: staff.id, email: body.email.toLowerCase(), role: body.role, kol_id: body.kolId });
  if (reserved.error) throw new StaffError(reserved.error.code === "23505" ? "INVITE_ALREADY_REQUESTED" : "STAFF_OPERATION_FAILED", 409);
  const invited = await db.auth.admin.inviteUserByEmail(body.email, { redirectTo: `${getSiteUrl()}/admin/invite` });
  if (invited.error || !invited.data.user) { await db.from("staff_invitations").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", body.requestId); throw new StaffError("INVITE_FAILED", 409); }
  const id = invited.data.user.id;
  const recorded = await db.from("staff_invitations").update({ user_id: id, status: "membership_pending", updated_at: new Date().toISOString() }).eq("id", body.requestId);
  if (recorded.error) throw new StaffError("INVITE_MEMBERSHIP_PENDING", 503);
  // Membership is separately transactional and rechecks the actor. Invitation
  // delivery alone never grants access; failed membership stays visibly pending.
  const membership = await db.rpc("staff_set_member", { p_actor: staff.id, p_target: id, p_role: body.role, p_active: true, p_kol: body.kolId });
  if (membership.error) throw new StaffError("INVITE_MEMBERSHIP_PENDING", 409);
  const completed = await db.from("staff_invitations").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", body.requestId);
  if (completed.error) return staffResponse({ ok: true, status: "record_pending", userId: id });
  return staffResponse({ ok: true, status: "ready", userId: id });
 } catch (error) { return staffFailure(error); }
}
