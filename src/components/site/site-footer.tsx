import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div><BrandMark /><p>Good finds. Great company. 好物与陪伴，同在一处。</p></div>
        <div><strong>选购</strong><Link href="/live">直播现场</Link><Link href="/shop">全部商品</Link></div>
        <div><strong>运营</strong><Link href="/studio">Operations preview · 运营体验</Link><Link href="/admin/login">Operator sign-in · 后台登录</Link><span>Hong Kong · Global</span></div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 iSunTVMall</span><span>Watch · Discover · Shop</span></div>
    </footer>
  );
}
