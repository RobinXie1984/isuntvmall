import {describe,it,expect,vi,beforeEach} from "vitest";
vi.mock("server-only",()=>({}));
const m=vi.hoisted(()=>({staff:vi.fn(),rpc:vi.fn()}));
vi.mock("@/lib/staff/auth",async original=>({...await original<typeof import("@/lib/staff/auth")>(),requireStaff:m.staff}));
vi.mock("@/lib/env",()=>({getSiteUrl:()=>"https://shop.example"}));
vi.mock("@/lib/supabase/admin",()=>({getSupabaseAdmin:()=>({rpc:m.rpc})}));
import {GET,POST} from "@/app/api/admin/merchandise/route";
const id="11111111-1111-4111-8111-111111111111";
const body={action:"save",productId:id,revision:0,baseRevision:1,payload:{title:"Cup",titleZh:"杯",description:"",descriptionZh:"",category:"Cups",priceAmount:100,status:"published",isDemo:true,visibleImageIds:[]},supplier:{name:"Supplier",contact:"",notes:""}};
const request=(value:unknown,origin="https://shop.example")=>new Request("https://shop.example/api/admin/merchandise",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(value)});
beforeEach(()=>{vi.clearAllMocks();m.staff.mockResolvedValue({id,role:"merchandise_admin",aal:"aal2",kolId:null,email:"fixture@example.invalid",sessionId:id});m.rpc.mockResolvedValue({data:{ok:true},error:null});});
describe("merchandise API",()=>{
 it("finance cannot read supplier drafts or write products",async()=>{m.staff.mockResolvedValue({id,role:"finance_admin",aal:"aal2"});expect((await GET(new Request("https://shop.example/api/admin/merchandise"))).status).toBe(403);expect((await POST(request(body))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it("merchandise can save its draft but cannot publish it",async()=>{expect((await POST(request(body))).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith("merchandise_save",expect.objectContaining({p_actor:id}));m.rpc.mockClear();expect((await POST(request({action:"publish",productId:id,revision:1}))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it("rejects origin spoofing and hidden privileged fields",async()=>{expect((await POST(request(body,"https://evil.example"))).status).toBe(403);expect((await POST(request({...body,payload:{...body.payload,stockQty:9999}}))).status).toBe(422);expect(m.rpc).not.toHaveBeenCalled();});
 it("returns actionable stale revision without leaking database errors",async()=>{m.rpc.mockResolvedValue({error:{message:"STALE_REVISION"}});const response=await POST(request(body));expect(response.status).toBe(409);expect(await response.json()).toEqual({ok:false,code:"STALE_REVISION"});});
 it("saves bounded language-specific SEO through the existing draft RPC",async()=>{const value={...body,payload:{...body.payload,slug:"stone-cup",seo:{en:{title:"Stone cup",description:"A cup."}},brand:"Pottery"}};expect((await POST(request(value))).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith("merchandise_save",expect.objectContaining({p_payload:expect.objectContaining({slug:"stone-cup",seo:{en:{title:"Stone cup",description:"A cup."}}})}));});
 it("rejects path slugs and unsupported SEO languages",async()=>{expect((await POST(request({...body,payload:{...body.payload,slug:"../admin"}}))).status).toBe(422);expect((await POST(request({...body,payload:{...body.payload,seo:{xx:{title:"Bad"}}}}))).status).toBe(422);expect(m.rpc).not.toHaveBeenCalled();});
 it("returns an actionable conflict for reserved historical URLs",async()=>{m.rpc.mockResolvedValue({error:{message:"SLUG_CONFLICT"}});const r=await POST(request(body));expect(r.status).toBe(409);expect(await r.json()).toEqual({ok:false,code:"SLUG_CONFLICT"});});

});
