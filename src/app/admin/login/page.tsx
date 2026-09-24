import { getLocale } from "@/lib/locale-server";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminConfig } from "@/lib/env";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Operator sign-in", "營運登入") }; }

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin/products");
  return <div className="admin-login-wrap"><AdminLogin configured={Boolean(getAdminConfig())} /></div>;
}
