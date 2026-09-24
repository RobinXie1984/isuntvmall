"use client";
import Link from "next/link";
import {useLocale} from "@/components/i18n/locale-provider";
export function BrandMark(){const {t}=useLocale();return <Link className="brand-mark" href="/" aria-label={t("iSunTVMall home","iSunTVMall 首頁")}><span className="brand-symbol" aria-hidden="true">☼</span><strong>iSunTVMall</strong></Link>;}
