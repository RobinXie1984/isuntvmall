import { assignableRoles } from "@/lib/staff/permissions";
import { requireAdminPage } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { StaffTeam, type TeamMember } from "@/components/admin/staff-team";
import { StaffInvite, type StaffInvitation } from "@/components/admin/staff-invite";
import { getLocale } from "@/lib/locale-server";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Team access", "團隊權限") }; }
export default async function TeamPage() {
 const staff = await requireAdminPage("team.manage"); const db = getSupabaseAdmin();
 const [members, hosts, invitations] = await Promise.all([db.rpc("staff_directory", { p_actor: staff.id }), db.from("kols").select("id,display_name").eq("status", "active"), db.from("staff_invitations").select("id,email,role,user_id,status,created_at").order("created_at", { ascending: false }).limit(50)]);
 if (members.error || hosts.error || invitations.error) throw new Error("STAFF_OPERATION_FAILED");
 return <><StaffInvite allowedRoles={assignableRoles(staff.role)} hosts={hosts.data || []} invitations={invitations.data as StaffInvitation[]} /><StaffTeam allowedRoles={assignableRoles(staff.role)} members={members.data as TeamMember[]} hosts={hosts.data || []} currentId={staff.id} /></>;
}
