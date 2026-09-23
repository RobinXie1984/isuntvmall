"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cartLineKey, parseStoredCart } from "@/lib/cart";
import type { CartLine, CartSource } from "@/types/commerce";

const STORAGE_KEY = "suntv-mall-cart-v2";

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  addItem: (productId: string, quantity?: number, source?: CartSource) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setItems(parseStoredCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")));
      } catch {
        setItems([]);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Storage unavailable: cart remains usable for this visit. */ } }
  }, [items, ready]);

  const addItem = useCallback((productId: string, quantity = 1, source?: CartSource) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    const key = cartLineKey({productId, source});
    setItems((current) => {
      const existing = current.find((item) => cartLineKey(item) === key);
      if (existing) {
        return current.map((item) =>
          cartLineKey(item) === key ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item,
        );
      }
      if(current.length >= 20) return current;
      return [...current, { productId, quantity: Math.min(10, Math.max(1, quantity)), ...(source ? {source} : {}) }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    if(!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => cartLineKey(item) !== key));
      return;
    }
    setItems((current) =>
      current.map((item) => (cartLineKey(item) === key ? { ...item, quantity: Math.min(10, quantity) } : item)),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => cartLineKey(item) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
