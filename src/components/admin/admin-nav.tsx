"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { permissionAllowed, type Staff, type StaffAction } from "@/lib/staff/permissions";
import { staffMessage } from "@/lib/staff/messages";
const links: [string, string, string, StaffAction][] = [["/admin/products", "Products", "商品", "catalog.read"], ["/admin/batches", "Batch import", "批量匯入", "batch.submit"], ["/admin/live", "Livestreams", "直播", "live.read"], ["/admin/orders", "Orders", "訂單", "orders.read"], ["/admin/overview", "Overview", "總覽", "analytics.read"], ["/admin/team", "Team", "團隊", "team.manage"], ["/admin/settings", "Settings", "設定", "team.manage"]];
export function AdminNav({ staff }: { staff: Staff }) {
 const pathname = usePathname(); const router = useRouter(); const { locale, t } = useLocale(); const [error, setError] = useState("");
 async function signOut() { try { const r = await fetch("/api/admin/session", { method: "DELETE" }); if (!r.ok) { setError("SIGN_OUT_FAILED"); return; } router.replace("/admin/login"); router.refresh(); } catch { setError("SIGN_OUT_FAILED"); } }
 return <nav className="admin-nav" aria-label={t("Staff console", "員工後台")}><div>{links.filter(([, , , action]) => permissionAllowed(staff, action, { kolId: staff.kolId })).map(([href, en, zh]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{t(en, zh)}</Link>)}</div><button type="button" onClick={signOut}>{t("Sign out", "登出")}</button>{error && <p role="alert">{staffMessage(error, locale)}</p>}</nav>;
}
