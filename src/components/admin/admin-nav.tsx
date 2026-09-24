"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
const links = [["/admin/products", "Products", "商品"], ["/admin/kols", "Hosts", "主播"], ["/admin/live", "Livestreams", "直播"], ["/admin/orders", "Orders", "訂單"]];
export function AdminNav() {
  const pathname = usePathname(); const router = useRouter(); const { t } = useLocale();
  return <nav className="admin-nav" aria-label={t("Operator console", "營運後台")}><div>{links.map(([href, en, zh]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{t(en, zh)}</Link>)}</div><button type="button" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); router.replace("/admin/login"); router.refresh(); }}>{t("Sign out", "登出")}</button></nav>;
}
