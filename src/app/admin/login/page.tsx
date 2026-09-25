import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { getStaff, staffConfigured, staffLanding } from "@/lib/staff/auth";
import { getLocale } from "@/lib/locale-server";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Staff sign-in", "員工登入") }; }
export default async function AdminLoginPage() { const staff = await getStaff(); if (staff) redirect(staffLanding(staff)); return <div className="admin-login-wrap"><AdminLogin configured={staffConfigured()} /></div>; }
