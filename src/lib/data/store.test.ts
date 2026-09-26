import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({configured:vi.fn(),query:vi.fn(),rows:[] as Array<Record<string,unknown>>,filters:[] as unknown[]}));
vi.mock("@/lib/env",()=>({hasSupabaseConfig:mocks.configured}));
vi.mock("@/lib/supabase/admin",()=>({getSupabaseAdmin:()=>({from:mocks.query})}));
import {getLiveSessions,getLiveSessionBySlug} from "./store";
import {getDemoLiveSessions} from "./demo";
function previewRows(){return getDemoLiveSessions().map(room=>({
 id:room.id,slug:room.slug,title:room.title,description:room.description,host_name:room.hostName,platform:room.platform,external_url:room.externalUrl,embed_id:room.embedId,status:room.status,is_public:true,starts_at:room.startsAt,ends_at:null,poster_url:room.posterUrl,playback_mode:room.platform==="youtube"?"embedded":"external_link",
 kols:{id:room.kol!.id,slug:room.kol!.slug,display_name:room.kol!.displayName,bio:room.kol!.bio,status:"active"},
 live_products:room.products.map((p,position)=>({position,products:{id:p.id,sku:p.sku,slug:p.slug,title:p.title,description:p.description,price_amount:p.priceAmount,currency:p.currency,stock_qty:p.stockQty,category:p.category,status:p.status,is_demo:true,featured:p.featured,created_at:p.createdAt,product_images:p.images.map(im=>({id:im.id,source_url:im.sourceUrl,alt_text:im.altText,position:im.position}))}})),
}));}
beforeEach(()=>{mocks.configured.mockReturnValue(true);mocks.rows=previewRows();mocks.filters=[];mocks.query.mockReset();mocks.query.mockImplementation(()=>{const query={select:()=>query,order:()=>query,eq:(...args:unknown[])=>{mocks.filters.push(["eq",...args]);return query;},in:(...args:unknown[])=>{mocks.filters.push(["in",...args]);return query;},then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:mocks.rows,error:null}).then(resolve)};return query;});});
describe("public connected showroom",()=>{
 it("keeps three explicit previews and all eighteen featured sample products",async()=>{const rooms=await getLiveSessions();expect(rooms).toHaveLength(3);expect(rooms.map(r=>r.products.length)).toEqual([6,6,6]);expect(rooms.every(r=>r.status==="preview"&&r.products.every(p=>p.isDemo))).toBe(true);expect(mocks.filters).toContainEqual(["eq","is_public",true]);expect(mocks.filters).toContainEqual(["in","status",["live","scheduled","ended","preview"]]);expect((await getLiveSessionBySlug("home-studio"))?.playbackMode).toBe("external_link");});
 it.each(["preview","scheduled","live","ended"])("requires explicit public flag and active host for %s",async status=>{const base={...previewRows()[0],status};mocks.rows=[base,{...base,id:"private",is_public:false},{...base,id:"missing-flag",is_public:undefined},{...base,id:"inactive",kols:{...base.kols,status:"inactive"}},{...base,id:"no-host",kols:null},{...base,id:"draft",status:"draft"}];expect((await getLiveSessions()).map(r=>r.id)).toEqual([base.id]);});
 it("does not expose draft merchandise through a public preview rail",async()=>{mocks.rows=[{...previewRows()[0],live_products:[{position:0,products:{id:"secret",status:"draft"}}]}];expect((await getLiveSessions())[0].products).toEqual([]);});
 it("preserves authorized includeAll inspection and object/array related-host forms",async()=>{const base=previewRows()[0];mocks.rows=[{...base,kols:[base.kols]}, {...base,id:"private",is_public:false}];expect(await getLiveSessions()).toHaveLength(1);expect(await getLiveSessions({includeAll:true})).toHaveLength(2);});
 it("keeps offline demo behavior when no database is configured",async()=>{mocks.configured.mockReturnValue(false);expect(await getLiveSessions()).toEqual(getDemoLiveSessions());expect(mocks.query).not.toHaveBeenCalled();});
});
