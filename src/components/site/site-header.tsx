import Link from "next/link";
import { CartCount } from "@/components/cart/cart-count";
import { BrandMark } from "@/components/site/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <BrandMark />
        <nav aria-label="主导航">
          <Link href="/live">Rooms · 直播</Link>
          <Link href="/shop">Shop · 商品</Link>
          <Link className="cart-link" href="/cart" aria-label="购物车">Bag · 购物袋<CartCount /></Link>
        </nav>
      </div>
    </header>
  );
}
