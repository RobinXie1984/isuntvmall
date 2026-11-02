import {beforeAll,describe,expect,it,vi} from "vitest";
import {createClient} from "@supabase/supabase-js";
import Stripe from "stripe";
import {randomUUID,createHash} from "node:crypto";
import profile from "../../config/isuntvmall.json";
vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({create:vi.fn(),retrieve:vi.fn(),account:vi.fn()}));
vi.mock("@/lib/stripe/client",async()=>{const {default:SDK}=await import("stripe");return {getStripe:()=>({accounts:{retrieve:state.account},checkout:{sessions:{create:state.create,retrieve:state.retrieve}},webhooks:new SDK("sk_test_fixture").webhooks})};});
import {createCheckoutSession} from "../../src/lib/stripe/checkout";
import {getCheckoutResult} from "../../src/lib/stripe/result";
import {POST} from "../../src/app/api/stripe/webhook/route";
const db=createClient("http://127.0.0.1:54331","synthetic-fixture-key",{auth:{persistSession:false,autoRefreshToken:false}});
const product="55b54363-ab4e-4d89-922f-8d35efb58001";
const signingSecret="whsec_synthetic_fixture_only";
let orderId:string,session:Stripe.Checkout.Session,initialStock:number;
const stripe=new Stripe("sk_test_fixture");
async function order(){const r=await db.from("orders").select("status,subtotal_amount,stripe_payment_intent_id").eq("id",orderId).single();expect(r.error).toBeNull();return r.data!;}
async function stock(){const r=await db.from("products").select("stock_qty").eq("id",product).single();expect(r.error).toBeNull();return r.data!.stock_qty;}
async function notify(id:string,type="checkout.session.completed",tamper=false){const body=JSON.stringify({id,type,livemode:false,data:{object:session}});const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:signingSecret});return POST(new Request("http://localhost/api/stripe/webhook",{method:"POST",body:body+(tamper?" ":""),headers:{"stripe-signature":signature}}));}
beforeAll(()=>{
 for(const [key,value] of Object.entries({STRIPE_MODE:"test",STRIPE_ACCOUNT_ID:"acct_fixture",STRIPE_SECRET_KEY:"rk_test_fixture",STRIPE_WEBHOOK_SECRET:signingSecret,SUPABASE_URL:"http://127.0.0.1:54331",SUPABASE_SERVICE_ROLE_KEY:"synthetic-fixture-key",CHECKOUT_RELEASE_APPROVED:"true",NEXT_PUBLIC_SITE_URL:"http://127.0.0.1:3031",TURNSTILE_SITE_KEY:"fixture",TURNSTILE_SECRET_KEY:"fixture",CHECKOUT_CLIENT_HASH_SECRET:"fixture-identity-hash-secret-test-only"}))vi.stubEnv(key,value);
 vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify({...profile,origin:"http://127.0.0.1:3031",catalogueMode:"merchant",collections:{holidays:false,supplierDemo:false,suntvmall:false},policies:{merchantName:"Sandbox",contactEmail:"sandbox@example.com",shipping:{en:"Test"},returns:{en:"Test"},privacy:{en:"Test"},terms:{en:"Test"}}}));
 state.account.mockResolvedValue({id:"acct_fixture"});
 state.create.mockImplementation(async params=>{
  orderId=params.client_reference_id;
  session={id:`cs_test_fixture${randomUUID().replaceAll('-','')}`,mode:"payment",livemode:false,status:"open",payment_status:"unpaid",client_reference_id:orderId,metadata:params.metadata,currency:"hkd",amount_subtotal:12000,amount_total:12000,total_details:{amount_shipping:0,amount_tax:0,amount_discount:0},payment_intent:"pi_fixture"+randomUUID().replaceAll('-',''),url:"https://checkout.stripe.com/synthetic-fixture"} as Stripe.Checkout.Session;
  state.retrieve.mockImplementation(async()=>session);return session;
 });
});
describe("real PostgreSQL + PostgREST + application routes; synthetic Stripe messages",()=>{
 it("reserves from server prices and attaches one frozen session",async()=>{initialStock=await stock();const attempt=randomUUID();await createCheckoutSession({checkoutAttemptId:attempt,items:[{productId:product,quantity:1}]},"http://127.0.0.1:3031",createHash('sha256').update(attempt).digest('hex'));expect(await order()).toMatchObject({status:"pending",subtotal_amount:12000});expect(await stock()).toBe(initialStock);});
 it("visiting success before webhook never fulfills",async()=>{session.payment_status="paid";const r=await getCheckoutResult(session.id);expect(r?.orderStatus).toBe("pending");expect(await stock()).toBe(initialStock);});
 it("altered signature never changes real order or stock",async()=>{expect((await notify("evt_bad",undefined,true)).status).toBe(400);expect((await order()).status).toBe("pending");expect(await stock()).toBe(initialStock);});
 it("signed paid webhook settles actual database order and stock once",async()=>{session.status="complete";expect((await notify("evt_fixture"+orderId)).status).toBe(200);expect((await order()).status).toBe("paid");expect(await stock()).toBe(initialStock-1);});
 it("same and distinct duplicate events do not consume twice",async()=>{for(const id of ["evt_fixture"+orderId,"evt_duplicate"+orderId])expect((await notify(id)).status).toBe(200);expect(await stock()).toBe(initialStock-1);});
 it("confirmation reads verified paid order",async()=>{expect(await getCheckoutResult(session.id)).toMatchObject({paymentStatus:"paid",orderStatus:"paid",orderId,totalAmount:12000,currency:"hkd"});});
 it("out-of-order failure does not reverse paid state",async()=>{session.payment_status="unpaid";expect((await notify("evt_latefailure"+orderId,"checkout.session.async_payment_failed")).status).toBe(200);expect((await order()).status).toBe("paid");expect(await stock()).toBe(initialStock-1);});
});
