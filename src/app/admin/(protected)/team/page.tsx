import { requireAdminPage } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { StaffTeam, type TeamMember } from "@/components/admin/staff-team";
import { StaffInvite, type StaffInvitation } from "@/components/admin/staff-invite";
import { getLocale } from "@/lib/locale-server";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Team access", "團隊權限") }; }
export default async function TeamPage() {
 const staff = await requireAdminPage("team.manage"); const db = getSupabaseAdmin();
 const [members, hosts, invitations] = await Promise.all([db.from("staff_members").select("user_id,role,active,kol_id,updated_at").order("created_at", { ascending: false }).limit(100), db.from("kols").select("id,display_name").eq("status", "active"), db.from("staff_invitations").select("id,email,role,user_id,status,created_at").order("created_at", { ascending: false }).limit(50)]);
 if (members.error || hosts.error || invitations.error) throw new Error("STAFF_OPERATION_FAILED");
 return <><StaffInvite hosts={hosts.data || []} invitations={invitations.data as StaffInvitation[]} /><StaffTeam members={members.data as TeamMember[]} hosts={hosts.data || []} currentId={staff.id} /></>;
}
