import {beforeEach,describe,expect,it,vi} from "vitest";
import Stripe from "stripe";
vi.mock("server-only",()=>({}));
const m=vi.hoisted(()=>({configured:vi.fn(),handler:vi.fn()}));
vi.mock("@/lib/stripe/runtime",()=>({paymentOperationsConfigured:m.configured}));
vi.mock("@/lib/stripe/webhook",()=>({handleStripeEvent:m.handler}));
const secret="whsec_synthetic_test_only";
vi.mock("@/lib/env",()=>({getStripeWebhookSecret:()=>"whsec_synthetic_test_only",getStripeSecretKey:()=>"sk_test_synthetic"}));
import {POST} from "./route";
const stripe=new Stripe("sk_test_synthetic");
const payload=JSON.stringify({id:"evt_fixture",type:"checkout.session.completed",livemode:false,data:{object:{id:"cs_test_fixture"}}});
function request(body=payload,timestamp?:number){return new Request("http://localhost/api/stripe/webhook",{method:"POST",body,headers:{"stripe-signature":stripe.webhooks.generateTestHeaderString({payload,secret,timestamp})}});}
beforeEach(()=>{vi.clearAllMocks();m.configured.mockReturnValue(true);m.handler.mockResolvedValue("paid");});
describe("raw signed webhook HTTP boundary (real Stripe verifier, synthetic events)",()=>{
 it("accepts a valid signed payload",async()=>{expect((await POST(request())).status).toBe(200);expect(m.handler).toHaveBeenCalledWith(expect.objectContaining({id:"evt_fixture"}));});
 it("rejects altered raw bytes before any order mutation",async()=>{expect((await POST(request(payload+" "))).status).toBe(400);expect(m.handler).not.toHaveBeenCalled();});
 it("rejects stale signatures",async()=>{expect((await POST(request(payload,Math.floor(Date.now()/1000)-600))).status).toBe(400);expect(m.handler).not.toHaveBeenCalled();});
 it("rejects unsigned requests",async()=>{expect((await POST(new Request("http://localhost",{method:"POST",body:payload}))).status).toBe(400);expect(m.handler).not.toHaveBeenCalled();});
 it("returns retryable failure when settlement fails",async()=>{m.handler.mockRejectedValue(new Error("database unavailable"));expect((await POST(request())).status).toBe(500);});
 it("fails closed when environment is unconfigured",async()=>{m.configured.mockReturnValue(false);expect((await POST(request())).status).toBe(503);expect(m.handler).not.toHaveBeenCalled();});
});
