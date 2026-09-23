"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartLineKey, parseStoredCart } from "@/lib/cart";
import { checkoutAttempt, CHECKOUT_ATTEMPT_STORAGE, type CheckoutAttempt } from "@/lib/checkout-attempt";
import type { CartLine, CartSource } from "@/types/commerce";

const STORAGE_KEY = "suntv-mall-cart-v2";

interface CartContextValue {
  items: CartLine[];
  getCheckoutAttempt: () => CheckoutAttempt;
  clearCheckoutAttempt: () => void;
  itemCount: number;
  addItem: (productId: string, quantity?: number, source?: CartSource) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const attemptRef = useRef<CheckoutAttempt | null>(null);
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

  const clearCart = useCallback(() => {
    setItems([]);
    attemptRef.current = null;
    try { sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE); } catch { /* Root state is cleared even without storage. */ }
  }, []);

  // Root-lifetime retry identity survives changing room/cart views even when
  // browser storage is denied. Full reload cannot preserve denied storage.
  const getCheckoutAttempt = useCallback(() => {
    let saved: unknown = attemptRef.current;
    if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(CHECKOUT_ATTEMPT_STORAGE) || "null"); } catch { /* Keep in-memory fallback. */ } }
    const attempt = checkoutAttempt(items, saved, Date.now(), () => crypto.randomUUID());
    attemptRef.current = attempt;
    try { sessionStorage.setItem(CHECKOUT_ATTEMPT_STORAGE, JSON.stringify(attempt)); } catch { /* Root provider retains the attempt. */ }
    return attempt;
  }, [items]);

  const clearCheckoutAttempt = useCallback(() => {
    attemptRef.current = null;
    try { sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE); } catch { /* No persisted attempt to clear. */ }
  }, []);

  const value = useMemo(
    () => ({
      items,
      getCheckoutAttempt,
      clearCheckoutAttempt,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart, getCheckoutAttempt, clearCheckoutAttempt],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
