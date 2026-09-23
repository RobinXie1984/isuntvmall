import {describe,it,expect} from "vitest";
import {cartLineKey,parseStoredCart,validateAttribution,checkoutInputSchema,checkoutReleaseReady,assertCheckoutReleased} from "./cart";
import {getDemoLiveSessions} from "./data/demo";
const sessions=getDemoLiveSessions();
const s=sessions[0];
const line={productId:s.products[0].id,quantity:1,source:{liveSessionId:s.id,kolId:s.kol!.id}};
describe("multi-room cart and release boundaries",()=>{
 it("keeps the same SKU from different rooms separate",()=>{
  const other={...line,source:{liveSessionId:sessions[1].id,kolId:sessions[1].kol!.id}};
  expect(cartLineKey(other)).not.toBe(cartLineKey(line));expect(parseStoredCart([line,other])).toHaveLength(2);
 });
 it("rejects malformed stored source and invalid quantities",()=>{
  expect(parseStoredCart([null,{...line,quantity:-1},{...line,source:{kolId:s.kol!.id}},line])).toEqual([line]);
 });
 it("preserves attribution through JSON persistence",()=>expect(parseStoredCart(JSON.parse(JSON.stringify([line])))).toEqual([line]));
 it("bounds duplicate stored quantities",()=>expect(parseStoredCart([line,{...line,quantity:10}])[0].quantity).toBe(10));
 it("accepts selectors only with a valid attempt UUID",()=>{expect(checkoutInputSchema.safeParse({checkoutAttemptId:"11111111-1111-4111-8111-111111111111",items:[line]}).success).toBe(true);expect(checkoutInputSchema.safeParse({items:[line]}).success).toBe(false);});
 it("refuses browser-supplied price or partial attribution",()=>{
  expect(checkoutInputSchema.safeParse({checkoutAttemptId:"11111111-1111-4111-8111-111111111111",items:[{...line,price:1}]}).success).toBe(false);
  expect(checkoutInputSchema.safeParse({checkoutAttemptId:"11111111-1111-4111-8111-111111111111",items:[{...line,source:{liveSessionId:s.id}}]}).success).toBe(false);
 });
 it("reconstructs source from an active authoritative room",()=>expect(validateAttribution([line],[{...s,status:"live"}])).toEqual([line]));
 it("rejects forged KOL, unrelated SKU, inactive KOL and preview source",()=>{
  expect(()=>validateAttribution([{...line,source:{...line.source,kolId:sessions[1].kol!.id}}],[{...s,status:"live"}])).toThrow();
  expect(()=>validateAttribution([{...line,productId:sessions[2].products[0].id}],[{...s,status:"live"}])).toThrow();
  expect(()=>validateAttribution([line],[{...s,status:"live",kol:{...s.kol!,status:"inactive"}}])).toThrow();
  expect(()=>validateAttribution([line],sessions)).toThrow();
 });
 it("allows direct catalog selections without invented host credit",()=>expect(validateAttribution([{productId:line.productId,quantity:1}],[])).toEqual([{productId:line.productId,quantity:1}]));
 it("cannot unlock checkout by providing credentials",()=>{expect(checkoutReleaseReady()).toBe(false);expect(()=>assertCheckoutReleased()).toThrow(/Orders and payments/);});
 it("never manufactures live demo broadcasts",()=>{expect(sessions.every(s=>s.status==="preview")).toBe(true);expect(new Set(sessions.map(s=>s.kol?.id)).size).toBe(3);expect(sessions.map(s=>s.products.map(p=>p.id))).not.toEqual([[],[],[]]);});
});
