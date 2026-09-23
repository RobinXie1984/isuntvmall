import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/admin-login";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminConfig } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "运营登录" };

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin/products");
  return <div className="admin-login-wrap"><AdminLogin configured={Boolean(getAdminConfig())} /></div>;
}
