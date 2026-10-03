import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as manifest } from "@/app/site.webmanifest/route";
import { GET as icon } from "@/app/icon.svg/route";
import sample from "../../config/stillroom.json";
afterEach(()=>vi.unstubAllEnvs());
describe("store-specific browser identity",()=>{
 it("neutral manifest contains only the selected brand icons",async()=>{vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify(sample));const response=manifest();const data=await response.json();expect(data.name).toBe("Stillroom");expect(data.icons.every((i:{src:string})=>i.src==="/brand/stillroom/mark.svg")).toBe(true);expect(JSON.stringify(data)).not.toMatch(/isun|comet/i);});
 it("legacy icon URL follows the selected favicon without a fixed comet",()=>{vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify(sample));const response=icon(new Request("http://localhost:3000/icon.svg"));expect(response.status).toBe(307);expect(response.headers.get("location")).toBe("http://localhost:3000/brand/stillroom/mark.svg");});
 it("default favicon remains the existing iSun asset",()=>{expect(icon(new Request("https://www.isuntvmall.com/icon.svg")).headers.get("location")).toBe("https://www.isuntvmall.com/brand/favicon-32.png");});
});
