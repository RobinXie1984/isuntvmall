"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { CartSource } from "@/types/commerce";
import { useEffect, useRef, useState } from "react";
import { useCart, type AddItemResult } from "@/components/cart/cart-provider";

export function AddToCartButton({ productId, disabled = false, compact = false, source }: { productId: string; source?: CartSource; disabled?: boolean; compact?: boolean }) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const [result, setResult] = useState<AddItemResult | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  const label = result === "added" ? t("Added ✓", "已加入 ✓")
    : result === "bag-limit" ? t("Bag limit reached", "購物袋已滿")
    : result === "quantity-limit" ? t("Limit: 10 per item", "每款上限 10 件")
    : result === "invalid" ? t("Could not add", "未能加入")
    : t("Add", "加入");
  const visibleLabel = compact && result === "bag-limit" ? t("Bag full", "購物袋已滿")
    : compact && result === "quantity-limit" ? t("Max 10", "上限 10 件")
    : label;

  return (
    <button
      className={compact ? "button button-small" : "button button-block"}
      type="button"
      disabled={disabled}
      aria-live="polite"
      aria-label={disabled ? t("Sold out", "售罄") : label}
      title={disabled ? t("Sold out", "售罄") : label}
      onClick={() => {
        const nextResult = addItem(productId, 1, source);
        setResult(nextResult);
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setResult(null), nextResult === "added" ? 1200 : 3000);
      }}
    >
      {disabled ? t("Sold out", "售罄") : visibleLabel}
    </button>
  );
}
