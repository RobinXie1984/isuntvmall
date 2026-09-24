"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";

export function CartCount() {
  const { itemCount } = useCart();
  const { t } = useLocale();
  return <span className="cart-count" aria-label={t(`${itemCount} items in your bag`, `購物袋內有 ${itemCount} 件商品`)}>{itemCount}</span>;
}
