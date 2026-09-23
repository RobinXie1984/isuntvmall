import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import "./globals.css";
import { hasSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "iSunTVMall · Watch, discover, shop", template: "%s · SunTV Mall" },
  description: "看见产品，也看见产品背后的人。SunTV 精选直播与跨境好物。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <CartProvider>
          <SiteHeader />
          <div className="preview-banner" role="status">{!hasSupabaseConfig() ? "Showroom preview · Fictional hosts & sample products. No orders or payments. 演示预览：虚构主播与样品，不接收订单或付款。" : "Commerce preview · Ordering is not yet open. 商城预览：尚未开放下单。"}</div>
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
