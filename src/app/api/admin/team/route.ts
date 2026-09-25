import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff, requirePermission, requireStaffOrigin, STAFF_ROLES, StaffError } from "@/lib/staff/auth";
import { readStaffJson, staffResponse, staffFailure } from "@/lib/staff/http";
export async function GET(request: Request) {
 try { const staff = await requireStaff(request); requirePermission(staff, "team.manage"); const db = getSupabaseAdmin(); const result = await db.from("staff_members").select("user_id,role,active,kol_id,created_at,updated_at").order("created_at", { ascending: false }).limit(100); if (result.error) throw new StaffError("STAFF_OPERATION_FAILED", 503); return staffResponse({ ok: true, members: result.data }); } catch (error) { return staffFailure(error); }
}
export async function POST(request: Request) {
 try {
  requireStaffOrigin(request); const staff = await requireStaff(request); requirePermission(staff, "team.manage");
  const body = z.object({ userId: z.string().uuid(), role: z.enum(STAFF_ROLES), active: z.boolean(), kolId: z.string().uuid().nullable() }).strict().parse(await readStaffJson(request));
  if ((body.role === "kol") !== Boolean(body.kolId)) throw new StaffError("KOL_BINDING_REQUIRED", 422);
  const result = await getSupabaseAdmin().rpc("staff_set_member", { p_actor: staff.id, p_target: body.userId, p_role: body.role, p_active: body.active, p_kol: body.kolId });
  if (result.error) { const known = ["SELF_MEMBERSHIP_CHANGE_DENIED", "LAST_SUPER_ADMIN", "NAMED_USER_REQUIRED", "KOL_BINDING_REQUIRED", "KOL_NOT_ACTIVE", "STAFF_FORBIDDEN"]; throw new StaffError(known.find(code => result.error.message.includes(code)) || "STAFF_OPERATION_FAILED", 409); }
  if (body.active) { const repaired = await getSupabaseAdmin().from("staff_invitations").update({ status: "ready", updated_at: new Date().toISOString() }).eq("user_id", body.userId).eq("status", "membership_pending"); if (repaired.error) throw new StaffError("STAFF_OPERATION_FAILED", 503); }
  return staffResponse({ ok: true });
 } catch (error) { return staffFailure(error); }
}
