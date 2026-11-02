"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

// Stripe can redirect before its webhook arrives. Refresh only the read-only
// confirmation; never fulfill here and never start another payment attempt.
export function PaymentStatusRefresh({pending}:{pending:boolean}) {
 const router=useRouter();
 useEffect(()=>{
  if(!pending)return;
  let remaining=10;
  const timer=setInterval(()=>{
   if(document.visibilityState==="visible")router.refresh();
   if(--remaining<=0)clearInterval(timer);
  },3000);
  return ()=>clearInterval(timer);
 },[pending,router]);
 return null;
}
