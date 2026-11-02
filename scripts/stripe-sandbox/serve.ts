/** Isolated acceptance harness: imports the actual application payment code.
 * Not a deployable route. Every environment boundary is asserted before listening.
 * Checkout admission here uses a fixture identity; production Turnstile stays unchanged.
 */
import {createServer} from "node:http";
import {createHash,randomUUID} from "node:crypto";
import assert from "node:assert/strict";
import {getStoreProfile} from "../../src/lib/store-profile";
import {createCheckoutSession,cancelCheckoutAttempt} from "../../src/lib/stripe/checkout";
import {getCheckoutResult} from "../../src/lib/stripe/result";
import {POST as webhook} from "../../src/app/api/stripe/webhook/route";
assert.equal(process.env.STRIPE_MODE,"test");
assert.equal(process.env.STRIPE_ACCOUNT_ID,"acct_1UVopWQ0fHQKbZbH");
assert.match(process.env.STRIPE_SECRET_KEY??"",/^(sk|rk)_test_/);
assert.equal(process.env.SUPABASE_URL,"http://127.0.0.1:54331");
assert.equal(process.env.NEXT_PUBLIC_SITE_URL,"http://127.0.0.1:3031");
assert.equal(getStoreProfile().id,"isuntvmall-stripe-sandbox");
const fixtureProduct="55b54363-ab4e-4d89-922f-8d35efb58001";
const json=(res:import('node:http').ServerResponse,data:unknown,status=200)=>{res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"}).end(JSON.stringify(data));};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??"/","http://127.0.0.1:3031");
  if(req.method==="GET"&&url.pathname==="/"){
   res.writeHead(200,{"content-type":"text/html","cache-control":"no-store"}).end('<!doctype html><meta name="viewport" content="width=device-width"><title>iSunTVMall Sandbox acceptance</title><main style="max-width:600px;margin:4rem auto;padding:2rem;font:18px system-ui;color:#454a3b;background:#faf9f6"><h1>Stripe Sandbox</h1><p>Isolated test fixture. No real payment or shipment.</p><p>Test mug · HK$120.00</p><form action="/checkout" method="post"><button style="padding:1rem">Test secure Checkout</button></form></main>');return;
  }
  if(req.method==="POST"&&url.pathname==="/checkout"){
   const attempt=randomUUID();
   const result=await createCheckoutSession({checkoutAttemptId:attempt,items:[{productId:fixtureProduct,quantity:1}]},url.origin,createHash("sha256").update(`sandbox:${attempt}`).digest("hex"));
   if(!result.url)throw Error("Missing Checkout URL");
   res.writeHead(303,{Location:result.url}).end();return;
  }
  if(req.method==="GET"&&url.pathname==="/success"){json(res,await getCheckoutResult(url.searchParams.get("session_id")??undefined));return;}
  if(req.method==="GET"&&url.pathname==="/cart"){json(res,{cancelledByCustomer:true,attempt:url.searchParams.get("attempt"),note:"A return URL is not payment evidence; no inventory mutation."});return;}
  if(req.method==="POST"&&url.pathname==="/cancel"){
   const attempt=url.searchParams.get("attempt");assert.match(attempt??"",/^[a-f0-9-]{36}$/);json(res,await cancelCheckoutAttempt(attempt!));return;
  }
  if(req.method==="POST"&&url.pathname==="/api/stripe/webhook"){
   const chunks:Buffer[]=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>1048576){json(res,{error:"Payload too large"},413);return;}chunks.push(chunk);}
   const result=await webhook(new Request(url,{method:"POST",body:Buffer.concat(chunks),headers:{"stripe-signature":String(req.headers["stripe-signature"]??"")}}));
   res.writeHead(result.status,Object.fromEntries(result.headers)).end(await result.text());return;
  }
  json(res,{error:"Not found"},404);
 }catch(error){json(res,{error:error instanceof Error?error.message:"Test failed"},500);}
}).listen(3031,"127.0.0.1",()=>console.log("Sandbox acceptance harness: http://127.0.0.1:3031"));
