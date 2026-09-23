import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { CheckoutError, cancelCheckoutAttempt } from "@/lib/stripe/checkout";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({ok:false},{status:403});
 try{
  const {checkoutAttemptId}=z.object({checkoutAttemptId:z.uuid()}).strict().parse(await request.json());
  return NextResponse.json({ok:true,...await cancelCheckoutAttempt(checkoutAttemptId)});
 }catch(error){
  if(error instanceof CheckoutError)return NextResponse.json({ok:false,code:error.code,error:error.message},{status:error.httpStatus});
  return NextResponse.json({ok:false,error:"Invalid cancellation request."},{status:400});
 }
}
