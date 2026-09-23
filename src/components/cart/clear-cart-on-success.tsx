"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function ClearCartOnSuccess({ paid }: { paid: boolean }) {
  const { clearCart } = useCart();
  useEffect(() => {
    if (paid) clearCart();
  }, [paid, clearCart]);
  return null;
}
