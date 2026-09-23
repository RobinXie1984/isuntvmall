"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  ["/admin/products", "Products 商品"],
  ["/admin/kols", "Hosts 主播"],
  ["/admin/live", "直播"],
  ["/admin/orders", "订单"],
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="admin-nav" aria-label="运营后台">
      <div>{links.map(([href, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</div>
      <button type="button" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); router.replace("/admin/login"); router.refresh(); }}>退出</button>
    </nav>
  );
}
