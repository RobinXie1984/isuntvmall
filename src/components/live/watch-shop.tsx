"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { useState, type ReactNode } from "react";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { useCart } from "@/components/cart/cart-provider";
import type { LiveSession, Product } from "@/types/commerce";

export function WatchShop({ player, details, selection, products, sessions, checkoutReady }: {
  player: ReactNode; details: ReactNode; selection: ReactNode;
  products: Product[]; sessions: LiveSession[]; checkoutReady: boolean;
}) {
  const [showBag, setShowBag] = useState(false);
  const { t } = useLocale();
  const { itemCount } = useCart();
  return (
    <div className={`shell watch-shop${showBag ? " reviewing-bag" : ""}`}>
      <section className="watch-column">
        {player}
        <div className="watch-room-details">{details}</div>
      </section>
      <aside className="room-products">
        <div className="room-shopping-controls" role="group" aria-label={t("Room shopping", "直播間選購")}>
          <button type="button" className={showBag ? "" : "selected"} aria-pressed={!showBag} onClick={() => setShowBag(false)}>{t("Selection", "本場精選")}</button>
          <button type="button" className={showBag ? "selected" : ""} aria-pressed={showBag} onClick={() => setShowBag(true)}>{t("Review bag", "購物袋")} ({itemCount})</button>
        </div>
        {showBag ? <CartPageClient products={products} sessions={sessions} checkoutReady={checkoutReady} compact /> : selection}
      </aside>
    </div>
  );
}
