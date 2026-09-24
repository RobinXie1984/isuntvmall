import Link from "next/link";
import {T} from "@/components/i18n/locale-provider";
export default function NotFound(){return <div className="shell page-space"><div className="empty-state"><span className="empty-icon">404</span><h1><T en="Page not found" zh="找不到此頁面"/></h1><p><T en="This page may have moved or the link may be incorrect." zh="此頁面可能已移動，或連結有誤。"/></p><Link className="button" href="/"><T en="Back to home" zh="返回首頁"/></Link></div></div>;}
