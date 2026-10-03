"use client";
import Link from "next/link";
import {useLocale} from "@/components/i18n/locale-provider";
import {getStoreProfile,storeCopy} from "@/lib/store-profile";
export function BrandMark(){const {locale}=useLocale();const profile=getStoreProfile();return <Link className="brand-mark" href="/" aria-label={storeCopy(profile.copy.homeLabel,locale)}><img className="brand-comet" src={profile.brand.logo} width="48" height="48" alt=""/><span className="brand-wordmark"><strong>{profile.name}</strong>{profile.brand.secondaryName&&<small lang={profile.brand.secondaryName.lang}>{profile.brand.secondaryName.text}</small>}</span></Link>;}
