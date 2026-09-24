"use client";
import {T} from "@/components/i18n/locale-provider";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="shell page-space"><div className="empty-state"><span className="empty-icon">!</span><h1><T en="We couldn’t load this page" zh="暫時未能載入此頁面"/></h1><p><T en="Please try again in a moment." zh="請稍後再試。"/></p><button className="button" onClick={reset}><T en="Try again" zh="重新載入"/></button></div></div>;}
