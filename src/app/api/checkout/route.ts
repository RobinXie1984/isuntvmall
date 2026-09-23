import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/http";
import { CheckoutError, createCheckoutSession } from "@/lib/stripe/checkout";
export const runtime = "nodejs";
export async function POST(request: Request) {
 if(!isSameOriginRequest(request))return errorResponse(null,"Invalid request origin.",403);
 try{
  const session=await createCheckoutSession(await request.json(),new URL(request.url).origin);
  if(!session.url)throw new CheckoutError("CHECKOUT_RETRY","Checkout is being confirmed. Retry this attempt shortly.",503);
  return NextResponse.json({ok:true,...session});
 }catch(error){
  if(error instanceof CheckoutError)return NextResponse.json({ok:false,code:error.code,error:error.message},{status:error.httpStatus});
  return errorResponse(null,"Checkout request could not be processed.",400);
 }
}
