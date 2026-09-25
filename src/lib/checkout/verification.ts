import "server-only";
import {createHash,createHmac} from "node:crypto";
import {isIP} from "node:net";
import {z} from "zod";
import {getSiteUrl} from "@/lib/env";
export class CheckoutVerificationError extends Error {
 constructor(public code:string,public status:number){super(code);}
}
const proofSchema=z.object({success:z.literal(true),hostname:z.string(),action:z.literal("checkout"),cdata:z.string(),challenge_ts:z.string()});
export function checkoutVerificationConfigured(){return Boolean(process.env.TURNSTILE_SITE_KEY?.trim()&&process.env.TURNSTILE_SECRET_KEY?.trim()&&(process.env.CHECKOUT_CLIENT_HASH_SECRET?.trim().length??0)>=32);}
export async function verifyCheckoutRequest(request:Request,token:string,attemptId:string):Promise<string>{
 if(!checkoutVerificationConfigured())throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_NOT_CONFIGURED",503);
 if(!token||token.length>2048||!z.uuid().safeParse(attemptId).success)throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_REQUIRED",422);
 // Only the Cloudflare edge-supplied address is accepted. Deployment elsewhere
 // must provide an equivalent trusted adapter; forwarded/browser IDs are ignored.
 const ip=request.headers.get("cf-connecting-ip")?.trim();
 if(!ip||ip.includes("%")||!isIP(ip))throw new CheckoutVerificationError("CHECKOUT_CLIENT_UNAVAILABLE",503);
 const normalizedIp=isIP(ip)===6?new URL(`http://[${ip}]`).hostname:ip;
 const expectedHostname=new URL(getSiteUrl()).hostname;
 const hex=createHash("sha256").update(`${attemptId}:${token}`).digest("hex");
 const idempotencyKey=`${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
 try {
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY!.trim(),response:token,remoteip:ip,idempotency_key:idempotencyKey}),signal:controller.signal,redirect:"error",cache:"no-store"});
  if(!response.ok||!response.body)throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_UNAVAILABLE",503);
  const reader=response.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];
  try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>16384){await reader.cancel();throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_UNAVAILABLE",503);}chunks.push(part.value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
  const proof=proofSchema.safeParse(JSON.parse(new TextDecoder().decode(data)));
  const timestamp=proof.success?Date.parse(proof.data.challenge_ts):NaN;
  if(!proof.success||proof.data.hostname!==expectedHostname||proof.data.cdata!==attemptId||!Number.isFinite(timestamp)||Date.now()-timestamp>300000||timestamp>Date.now()+30000)throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_REQUIRED",422);
  return createHmac("sha256",process.env.CHECKOUT_CLIENT_HASH_SECRET!.trim()).update(`checkout-client-v1:${normalizedIp}`).digest("hex");
 }catch(error){if(error instanceof CheckoutVerificationError)throw error;throw new CheckoutVerificationError("CHECKOUT_VERIFICATION_UNAVAILABLE",503);}finally{clearTimeout(timeout);}
}
