"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartLineKey, parseStoredCart } from "@/lib/cart";
import { checkoutAttempt, CHECKOUT_ATTEMPT_STORAGE, type CheckoutAttempt } from "@/lib/checkout-attempt";
import type { CartLine, CartSource } from "@/types/commerce";

const STORAGE_KEY = "suntv-mall-cart-v2";

export type AddItemResult = "added" | "bag-limit" | "quantity-limit" | "invalid";

export function addCartLine(current: CartLine[], productId: string, quantity = 1, source?: CartSource): { items: CartLine[]; result: AddItemResult } {
  if (!Number.isInteger(quantity) || quantity < 1) return { items: current, result: "invalid" };
  const key = cartLineKey({ productId, source });
  const existing = current.find(item => cartLineKey(item) === key);
  if ((existing?.quantity ?? 0) + quantity > 10) return { items: current, result: "quantity-limit" };
  if (existing) return { items: current.map(item => cartLineKey(item) === key ? { ...item, quantity: item.quantity + quantity } : item), result: "added" };
  if (current.length >= 20) return { items: current, result: "bag-limit" };
  return { items: [...current, { productId, quantity, ...(source ? { source } : {}) }], result: "added" };
}

interface CartContextValue {
  turnstileSiteKey: string;
  items: CartLine[];
  getCheckoutAttempt: () => CheckoutAttempt;
  clearCheckoutAttempt: () => void;
  itemCount: number;
  addItem: (productId: string, quantity?: number, source?: CartSource) => AddItemResult;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, turnstileSiteKey="" }: { children: React.ReactNode; turnstileSiteKey?:string }) {
  const attemptRef = useRef<CheckoutAttempt | null>(null);
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  // All cart writes update this snapshot before rendering, so rapid clicks receive
  // a result from the latest state without side effects in a React updater.
  const itemsRef = useRef<CartLine[]>([]);
  const commitItems = useCallback((next: CartLine[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        commitItems(parseStoredCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")));
      } catch {
        commitItems([]);
      }
      setReady(true);
    });
  }, [commitItems]);

  useEffect(() => {
    if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Storage unavailable: cart remains usable for this visit. */ } }
  }, [items, ready]);

  const addItem = useCallback((productId: string, quantity = 1, source?: CartSource): AddItemResult => {
    const next = addCartLine(itemsRef.current, productId, quantity, source);
    if (next.result === "added") commitItems(next.items);
    return next.result;
  }, [commitItems]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    commitItems(quantity <= 0
      ? itemsRef.current.filter(item => cartLineKey(item) !== key)
      : itemsRef.current.map(item => cartLineKey(item) === key ? { ...item, quantity: Math.min(10, quantity) } : item));
  }, [commitItems]);

  const removeItem = useCallback((key: string) => {
    commitItems(itemsRef.current.filter(item => cartLineKey(item) !== key));
  }, [commitItems]);

  const clearCart = useCallback(() => {
    commitItems([]);
    attemptRef.current = null;
    try { sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE); } catch { /* Root state is cleared even without storage. */ }
  }, [commitItems]);

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
      turnstileSiteKey,
      items,
      getCheckoutAttempt,
      clearCheckoutAttempt,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, turnstileSiteKey, addItem, setQuantity, removeItem, clearCart, getCheckoutAttempt, clearCheckoutAttempt],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
