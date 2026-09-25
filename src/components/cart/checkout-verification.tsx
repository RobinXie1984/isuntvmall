"use client";
import Script from "next/script";
import {useEffect,useRef,useState} from "react";
import {useLocale} from "@/components/i18n/locale-provider";
type Turnstile={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
declare global {interface Window {turnstile?:Turnstile}}
export function CheckoutVerification({attemptId,siteKey,onToken}:{attemptId:string;siteKey:string;onToken:(token:string|null)=>void}){
 const{locale,t}=useLocale();const container=useRef<HTMLDivElement>(null);const callback=useRef(onToken);const[ready,setReady]=useState(false);const[failed,setFailed]=useState(false);const[generation,setGeneration]=useState(0);
 useEffect(()=>{callback.current=onToken;},[onToken]);
 useEffect(()=>{const api=window.turnstile;if(!ready||!api||!container.current)return;let active=true;
 const clear=()=>{if(active)callback.current(null);};
 let id:string|undefined;try{id=api.render(container.current,{sitekey:siteKey,action:"checkout",cData:attemptId,language:locale==="en"?"en":"zh-TW",theme:"light",size:"flexible",callback:(token:string)=>{if(active){setFailed(false);callback.current(token);}},"expired-callback":clear,"error-callback":()=>{if(active){setFailed(true);clear();}},"timeout-callback":()=>{if(active){setFailed(true);clear();}},"unsupported-callback":()=>{if(active){setFailed(true);clear();}}});}catch{queueMicrotask(()=>{if(active){setFailed(true);clear();}});}
 return()=>{active=false;if(id){try{api.remove(id);}catch{/* Widget already removed by the provider. */}}};},[ready,siteKey,attemptId,locale,generation]);
 return <div className="checkout-verification"><p>{t("Complete the verification, then continue to checkout.","請完成驗證，再繼續結帳。")}</p><Script id="checkout-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>{setFailed(true);callback.current(null);}}/><div ref={container}/>{failed&&<p role="alert">{t("Verification could not load. Check your connection, then retry.","未能載入驗證。請檢查連線後再試。")}</p>}<button type="button" className="text-button" onClick={()=>{if(!ready){window.location.reload();return;}callback.current(null);setFailed(false);setGeneration(g=>g+1);}}>{t("Refresh verification","重新驗證")}</button></div>;
}
