"use client";
import Link from "next/link";
import {useLocale} from "@/components/i18n/locale-provider";
export function BrandMark(){const {t}=useLocale();return <Link className="brand-mark" href="/" aria-label={t("iSunTVMall home","iSunTVMall 首頁")}><img className="brand-comet" src="/brand/comet.png" width="48" height="48" alt=""/><span className="brand-wordmark"><strong lang="en">iSunTVMall</strong><small lang="zh-Hant">陽光精選</small></span></Link>;}
