"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { CartSource } from "@/types/commerce";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function AddToCartButton({ productId, disabled = false, compact = false, source }: { productId: string; source?: CartSource; disabled?: boolean; compact?: boolean }) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);

  return (
    <button
      className={compact ? "button button-small" : "button button-block"}
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(productId, 1, source);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
    >
      {disabled ? t("Sold out", "售罄") : added ? t("Added ✓", "已加入 ✓") : t("Add", "加入")}
    </button>
  );
}
