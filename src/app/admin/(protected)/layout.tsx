import { getLocale } from "@/lib/locale-server";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReadinessBanner } from "@/components/admin/readiness-banner";
import { requireAdminPage } from "@/lib/admin-auth";
import { getDeploymentReadiness } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdminPage();
  const { t } = await getLocale();
  return <div className="admin-shell shell"><div className="admin-heading"><div><span className="eyebrow">SUNTV MALL</span><h1>{t("Operator console", "營運工作台")}</h1></div><ReadinessBanner readiness={getDeploymentReadiness()} /></div><AdminNav staff={staff} />{children}</div>;
}
