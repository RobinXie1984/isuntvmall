"use client";

import { useCart } from "@/components/cart/cart-provider";

export function CartCount() {
  const { itemCount } = useCart();
  return <span className="cart-count" aria-label={`购物车有 ${itemCount} 件商品`}>{itemCount}</span>;
}
