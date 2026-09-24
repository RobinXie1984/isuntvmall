"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LOCALE_COOKIE, localize, type Locale } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: (en: string, zh: string) => string;
  localize: (value: string) => string;
  setLocale: (locale: Locale) => void;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const value = useMemo<LocaleContextValue>(() => ({
    locale: initialLocale,
    t: (en, zh) => initialLocale === "en" ? en : zh,
    localize: (text) => localize(text, initialLocale),
    setLocale: (locale) => {
      if (locale === initialLocale) return;
      document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      window.location.reload();
    },
  }), [initialLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

export function T({ en, zh }: { en: string; zh: string }) {
  const { t } = useLocale();
  return <>{t(en, zh)}</>;
}
