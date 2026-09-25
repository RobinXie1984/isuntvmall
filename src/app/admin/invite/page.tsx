import { StaffInviteAccept } from "@/components/admin/staff-invite-accept";
import { getLocale } from "@/lib/locale-server";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Accept invitation", "接受邀請"), robots: { index: false, follow: false }, referrer: "no-referrer" as const }; }
export default function InvitePage() { return <div className="admin-login-wrap"><StaffInviteAccept /></div>; }
