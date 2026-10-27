import {describe,it,expect} from "vitest";
import {sourcePriceEntries,sourcePriceKey,reviewedVariants} from "./price-review";
import {sourcePriceDisclosure} from "@/lib/price-disclosure";
const entry=sourcePriceEntries.find(p=>p.variants.some(v=>"priceIsPlaceholder" in v&&v.priceIsPlaceholder))!;
const variant=entry.variants[0];
const approved={sourceKey:sourcePriceKey(entry,variant.id),priceAmount:32000,priceIsPlaceholder:false};
describe("option price review",()=>{
 it("keeps all existing prices and flags without approval",()=>{for(const e of sourcePriceEntries)expect(reviewedVariants(e,{})).toEqual(e.variants);});
 it("applies only the approved option with an honest reviewed label",()=>{const options=reviewedVariants(entry,{[variant.id]:approved});expect(options[0].priceAmount).toBe(32000);expect(sourcePriceDisclosure(options[0])).toBe("reviewed");expect(options.slice(1)).toEqual(entry.variants.slice(1));});
 it("makes stale approval demo after source changes",()=>{const changed={...entry,sourceUpdatedAt:"2099-01-01"};const v=reviewedVariants(changed,{[variant.id]:approved})[0];expect(v.priceAmount).toBe(99999);expect(sourcePriceDisclosure(v)).toBe("demo");});
 it("fails closed for malformed or generic amounts",()=>{for(const amount of [0,-1,1999,1.5,1000000000,"32000"]){const v=reviewedVariants(entry,{[variant.id]:{...approved,priceAmount:amount}})[0];expect(sourcePriceDisclosure(v)).toBe("demo");}});
 it("preserves deliberate demo decisions",()=>{const v=reviewedVariants(entry,{[variant.id]:{...approved,priceAmount:99999,priceIsPlaceholder:true}})[0];expect(sourcePriceDisclosure(v)).toBe("demo");});
 it("binds changes in amount and option to fresh review",()=>{const modified={...entry,variants:entry.variants.map((v,i)=>i? v:{...v,priceAmount:10000})};expect(reviewedVariants(modified,{[variant.id]:approved})[0].priceIsPlaceholder).toBe(true);});
});
