import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StaffMfa } from "@/components/admin/staff-mfa";
import { STAFF_PENDING_COOKIE, resolveStaffFromToken } from "@/lib/staff/auth";
import { getLocale } from "@/lib/locale-server";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Authenticator verification", "驗證器驗證") }; }
export default async function MfaPage() { const jar = await cookies(); const staff = await resolveStaffFromToken(jar.get(STAFF_PENDING_COOKIE)?.value); if (!staff) redirect("/admin/login"); return <div className="admin-login-wrap"><StaffMfa /></div>; }
