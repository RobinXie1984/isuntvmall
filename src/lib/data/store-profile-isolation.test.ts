import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({configured:vi.fn(),query:vi.fn(),rows:[] as Array<Record<string,unknown>>}));
vi.mock("@/lib/env",()=>({hasSupabaseConfig:mocks.configured}));
vi.mock("@/lib/supabase/admin",()=>({getSupabaseAdmin:()=>({from:mocks.query})}));
import sample from "../../../config/stillroom.json";
import isun from "../../../config/isuntvmall.json";
import {getProducts,getProductsByIds,getProductBySlug,getLiveSessions,getKols} from "./store";
import {supplierDemoProducts} from "./supplier-demo";
function profile(mode:"demo"|"merchant"){vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify({...sample,catalogueMode:mode}));}
beforeEach(()=>{mocks.configured.mockReturnValue(false);mocks.query.mockReset();mocks.rows=[];mocks.query.mockImplementation(()=>{const query={select:()=>query,order:()=>query,eq:()=>query,in:()=>query,range:()=>Promise.resolve({data:mocks.rows,error:null}),maybeSingle:()=>Promise.resolve({data:mocks.rows[0]??null,error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:mocks.rows,error:null}).then(resolve)};return query;});});
afterEach(()=>vi.unstubAllEnvs());
describe("store catalogue isolation",()=>{
 it("merchant mode without a database fails closed across every public catalogue resolver",async()=>{profile("merchant");expect(await getProducts()).toEqual([]);expect(await getProductsByIds(supplierDemoProducts.map(p=>p.id))).toEqual([]);expect(await getProductBySlug(supplierDemoProducts[0].slug)).toBeNull();expect(await getProductBySlug("stoneware-mug")).toBeNull();expect(await getLiveSessions()).toEqual([]);expect(await getKols()).toEqual([]);expect(mocks.query).not.toHaveBeenCalled();});
 it("neutral showroom uses only its selected samples and cannot resolve supplier or holiday slugs",async()=>{profile("demo");const products=await getProducts();expect(products.length).toBeGreaterThan(0);expect(products.every(p=>p.isDemo&&p.sku.startsWith("SAMPLE-"))).toBe(true);expect(await getProductBySlug(supplierDemoProducts[0].slug)).toBeNull();expect(await getProductBySlug("lotus-mooncake-box")).toBeNull();expect((await getLiveSessions()).every(r=>r.products.every(p=>products.some(x=>x.id===p.id)))).toBe(true);});
 it("merchant mode filters database demos and never overlays the bundled catalogue",async()=>{profile("merchant");mocks.configured.mockReturnValue(true);mocks.rows=[{id:"real",slug:"real",status:"published",is_demo:false,product_images:[]},{id:"demo",slug:"demo",status:"published",is_demo:true,product_images:[]}];expect((await getProducts()).map(p=>p.id)).toEqual(["real"]);expect((await getProductsByIds(["real","demo"])).map(p=>p.id)).toEqual(["real"]);mocks.rows=[mocks.rows[1]];expect(await getProductBySlug("demo")).toBeNull();expect(await getProducts({includeDrafts:true})).toHaveLength(1);});
 it("explicit QA exclusions affect public reads but retain admin records",async()=>{vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify(isun));mocks.configured.mockReturnValue(true);mocks.rows=[{id:isun.excludedProductIds[0],slug:"qa",status:"published",is_demo:true,product_images:[]}];expect((await getProducts()).some(p=>p.id===isun.excludedProductIds[0])).toBe(false);expect(await getProductsByIds([isun.excludedProductIds[0]])).toEqual([]);expect(await getProductBySlug("qa")).toBeNull();expect(await getProducts({includeDrafts:true})).toHaveLength(1);});
});
