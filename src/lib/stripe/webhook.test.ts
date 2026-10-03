import {beforeEach,describe,expect,it,vi} from "vitest";
import type Stripe from "stripe";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({gate:vi.fn(),rpc:vi.fn(),single:vi.fn()}));
vi.mock("@/lib/stripe/runtime",()=>({verifyPaymentIdentity:async()=>{if(!mocks.gate())throw Error();return {accountId:"acct_fixture",livemode:false};},frozenPaymentIdentity:()=>({accountId:"acct_fixture",livemode:false}),assertProviderMode:()=>{}}));
vi.mock("@/lib/finance/stripe",()=>({refundFacts:()=>({})}));
vi.mock("@/lib/supabase/admin",()=>({getSupabaseAdmin:()=>({rpc:mocks.rpc,from:()=>({select:()=>({eq:()=>({single:mocks.single})})})})}));
import {handleStripeEvent} from "./webhook";
const order="11111111-1111-4111-8111-111111111111";
const event=(type="checkout.session.completed",object:object={})=>({id:"evt_1",type,data:{object:{id:"cs_1",mode:"payment",metadata:{order_id:order},client_reference_id:order,payment_status:"paid",payment_intent:"pi_1",...object}}}) as unknown as Stripe.Event;
beforeEach(()=>{vi.resetAllMocks();mocks.gate.mockReturnValue(true);mocks.single.mockResolvedValue({data:{checkout_policy:{payment:{accountId:"acct_fixture",livemode:false}}},error:null});mocks.rpc.mockResolvedValue({data:"paid",error:null});});
describe("signed event normalization (mock DB)",()=>{
 it("unconfigured payment identity prevents mutations",async()=>{mocks.gate.mockReturnValue(false);await expect(handleStripeEvent(event())).rejects.toThrow();expect(mocks.rpc).not.toHaveBeenCalled();});
 it("missing money facts remain null rather than invented zero",async()=>{await handleStripeEvent(event());expect(mocks.rpc).toHaveBeenCalledWith("process_checkout_event",expect.objectContaining({p_facts:expect.objectContaining({amount_shipping:null,amount_tax:null,amount_discount:null})}));});
 it("mismatched order references never call fulfillment",async()=>{await expect(handleStripeEvent(event(undefined,{client_reference_id:"other"}))).rejects.toThrow();expect(mocks.rpc).not.toHaveBeenCalled();});
 it("refund routes to exception ledger",async()=>{await handleStripeEvent(event("charge.refunded",{payment_intent:"pi_1"}));expect(mocks.rpc).toHaveBeenCalledWith("flag_payment_review",{p_event_id:"evt_1",p_type:"charge.refunded",p_payment_intent:"pi_1"});});
 it("database failure requests webhook retry",async()=>{mocks.rpc.mockResolvedValue({error:{message:"unavailable"}});await expect(handleStripeEvent(event())).rejects.toThrow();});
});
