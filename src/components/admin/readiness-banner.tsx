"use client";
import { useLocale } from "@/components/i18n/locale-provider";
export function ReadinessBanner({ readiness }: { readiness: { supabase: boolean; stripe: boolean; admin: boolean; siteUrl: boolean } }) {
  const { t } = useLocale(); const ready = Object.values(readiness).every(Boolean);
  return <div className={`readiness-banner ${ready ? "ready" : ""}`}><strong>{ready ? t("Configuration present; checkout still gated", "設定已齊備，結帳仍待驗證") : t("Preview configuration", "預覽設定")}</strong><div><span className={readiness.supabase ? "ok" : ""}>Supabase</span><span className={readiness.stripe ? "ok" : ""}>Stripe</span><span className={readiness.siteUrl ? "ok" : ""}>{t("Site URL", "網站網址")}</span><span className={readiness.admin ? "ok" : ""}>{t("Admin access", "後台登入")}</span></div></div>;
}
