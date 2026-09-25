import { NextResponse } from "next/server";
import {z} from "zod";
import { isSameOriginRequest } from "@/lib/admin-auth";
import {checkoutInputSchema,checkoutReleaseReady} from "@/lib/cart";
import {readBatchJson} from "@/lib/batch/contracts";
import {CheckoutVerificationError,verifyCheckoutRequest} from "@/lib/checkout/verification";
import { CheckoutError, createCheckoutSession } from "@/lib/stripe/checkout";
export const runtime = "nodejs";
const inputSchema=checkoutInputSchema.extend({turnstileToken:z.string().min(1).max(2048)}).strict();
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store, max-age=0"}});
export async function POST(request: Request) {
 if(!isSameOriginRequest(request))return reply({ok:false,code:"INVALID_ORIGIN"},403);
 if(!checkoutReleaseReady())return reply({ok:false,code:"CHECKOUT_HOLD"},503);
 try{
  const {turnstileToken,...input}=inputSchema.parse(await readBatchJson(request,32768));
  const clientHash=await verifyCheckoutRequest(request,turnstileToken,input.checkoutAttemptId);
  const session=await createCheckoutSession(input,new URL(request.url).origin,clientHash);
  if(!session.url)throw new CheckoutError("CHECKOUT_RETRY","Checkout is being confirmed. Retry this attempt shortly.",503);
  return reply({ok:true,...session});
 }catch(error){
  if(error instanceof CheckoutError)return reply({ok:false,code:error.code},error.httpStatus);
  if(error instanceof CheckoutVerificationError)return reply({ok:false,code:error.code},error.status);
  return reply({ok:false,code:"INVALID_CHECKOUT_REQUEST"},400);
 }
}
