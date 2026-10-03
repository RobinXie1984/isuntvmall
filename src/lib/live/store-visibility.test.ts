import { afterEach, describe, expect, it, vi } from "vitest";
import sample from "../../../config/stillroom.json";
import isun from "../../../config/isuntvmall.json";
import { visiblePublicLiveRoom } from "./store-visibility";
const product = { id: "real-product", status: "published", isDemo: false };
const room = { id: "room", status: "live", revision: 4, products: [product], pinnedProductId: product.id };
afterEach(()=>vi.unstubAllEnvs());
describe("public live polling respects deployment visibility",()=>{
 it("keeps an approved non-demo product and its pin",()=>{expect(visiblePublicLiveRoom(room)).toMatchObject(room);});
 it.each(["demo","merchant"])("%s mode cannot expose the excluded workflow QA item or retain its pin",catalogueMode=>{vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify({...isun,catalogueMode}));const hidden={...product,id:isun.excludedProductIds[0]};expect(visiblePublicLiveRoom({...room,products:[hidden,product],pinnedProductId:hidden.id})).toMatchObject({products:[product],pinnedProductId:null});});
 it("merchant polling rejects demonstration, draft or unclassified products even if the RPC returns them",()=>{vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify({...sample,catalogueMode:"merchant"}));const demo={...product,id:"demo",isDemo:true};expect(visiblePublicLiveRoom({...room,products:[demo,{...product,id:"draft",status:"draft"},{...product,id:"unknown",isDemo:undefined},product],pinnedProductId:demo.id})).toMatchObject({products:[product],pinnedProductId:null});});
 it("preview rooms and malformed provider responses are unavailable",()=>{for(const value of [null,{}, {...room,status:"preview"},{...room,status:"private"},{...room,products:null}])expect(visiblePublicLiveRoom(value)).toBeNull();});
});
