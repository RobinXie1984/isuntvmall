"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { ProductCard } from "@/components/product/product-card";
import { acceptLiveState, type PublicLiveState } from "@/lib/live/public-state";
import type { LiveSession } from "@/types/commerce";
import "./live-room-selection.css";

export function LiveRoomSelection({ session }: { session: LiveSession }) {
  const { t } = useLocale(); const [state, setState] = useState<PublicLiveState | null>(null);
  const [unavailable, setUnavailable] = useState(false); const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (session.status === "preview") return;
    const controller = new AbortController(); let busy = false;
    async function poll() {
      if (busy || document.hidden) return; busy = true;
      try {
        const response = await fetch(`/api/live/${session.id}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 404) { setUnavailable(true); return; }
        if (!response.ok) throw new Error("DELAYED");
        const result = await response.json() as { room: PublicLiveState };
        if (controller.signal.aborted) return;
        setState(current => acceptLiveState(current, result.room, session.id)); setUnavailable(false); setDelayed(false);
      } catch { if (!controller.signal.aborted) setDelayed(true); } finally { busy = false; }
    }
    void poll(); const timer = window.setInterval(() => void poll(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [session.id, session.status]);
  const products = unavailable ? [] : state?.products ?? session.products;
  const pin = state?.pinnedProductId ? products.find(product => product.id === state.pinnedProductId) : undefined;
  const rest = pin ? products.filter(product => product.id !== pin.id) : products;
  const source = session.kol ? { liveSessionId: session.id, kolId: state?.kolId ?? session.kol.id } : undefined;
  const changedSource = state && (state.externalUrl !== session.externalUrl || state.embedId !== session.embedId || state.kolId !== session.kol?.id || state.playbackMode !== (session as LiveSession & { playbackMode?: string }).playbackMode);
  return <>
    <div className="section-heading"><div><span className="eyebrow">{t("IN THIS ROOM", "本場精選")}</span><h2>{t("The selection", "精選好物")}</h2></div></div>
    {changedSource && <p className="secure-note">{t("This room has an updated broadcast.", "此直播間已更新播放來源。")} <button className="text-link" onClick={() => window.location.reload()}>{t("Reload the stream", "重新載入直播")}</button></p>}
    {delayed && <p role="status" className="secure-note">{t("Live product updates are reconnecting. Your bag is kept.", "正在重新連接直播商品更新，購物袋會保留。")}</p>}
    {state?.status === "ended" && <p className="secure-note">{t("This broadcast has ended. You can still explore its selection.", "本場直播已結束，仍可瀏覽精選商品。")}</p>}
    {pin && <div className="live-pinned-product"><span className="eyebrow">{t("FEATURED NOW", "正在介紹")}</span><ProductCard product={pin} source={source} /></div>}
    {rest.length ? <div className="room-product-grid">{rest.map(product => <ProductCard key={product.id} product={product} source={source} />)}</div> : !pin && <p className="empty-inline">{unavailable ? t("This room's selection is unavailable. Your bag is kept.", "此直播間的商品暫時無法提供，購物袋會保留。") : t("Products are being prepared.", "商品正在準備中。")}</p>}
    <p className="secure-note">{t("Your bag remembers where each find came from.", "購物袋保留每件商品的主播來源。")}</p>
  </>;
}
