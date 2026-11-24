import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { StaffError } from "@/lib/staff/permissions";
import type { Staff } from "@/lib/staff/permissions";
import photos from "@/lib/data/homepage-exhibition-images.json";

const calls = vi.hoisted(() => ({
  auth: vi.fn(), rpc: vi.fn(), select: vi.fn(), in: vi.fn(),
}));
vi.mock("@/lib/staff/auth", async () => {
  const {requirePermission,StaffError}=await import("@/lib/staff/permissions");
  return {requireStaff:calls.auth, requirePermission, StaffError, requireStaffOrigin:vi.fn()};
});
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ rpc: calls.rpc, from: () => ({ select: calls.select }) }),
}));

import { GET } from "./route";

const ids = ["ready", "replacement", "still-draft", "revision-changed"];
const base = {
  slug: "suntv-2020a1-6", baseRevision: 2,
  payload: {status: "draft"},
  images: [{ id:"photo", url: photos["suntv-2020a1-6"], visible:true }],
};
const request = () => new Request("https://www.isuntvmall.com/api/admin/merchandise");
const staff = (role:Staff["role"]) => ({ id:"actor", role, aal:"aal2" } as Staff);

beforeEach(() => {
  vi.clearAllMocks();
  calls.select.mockReturnValue({in:calls.in});
  calls.rpc.mockResolvedValue({
    data:{items:ids.map((id,index)=>({
      ...base,id,
      images:index===1?[{id:"new-photo",url:"https://example.com/new.webp",visible:true}]:base.images,
    }))}, error:null,
  });
  calls.in.mockResolvedValue({
    data:ids.map((id,index)=>({id,status:index===2?"draft":"published",catalog_revision:index===3?3:2})),
    error:null,
  });
});

describe("admin catalogue photo preview", () => {
  it.each(["business_super_admin","merchandise_admin"] as const)("reads readiness for %s without using the draft publication status", async role => {
    calls.auth.mockResolvedValue(staff(role));
    const response = await GET(request());
    expect(response.status).toBe(200);
    const {items}=await response.json();
    expect(items.map((item:{homepage:string})=>item.homepage)).toEqual(["ready","review","catalogue-first","unavailable"]);
    expect(items[0].images[0].paletteReviewed).toBe(true);
    expect(items[1].images[0].paletteReviewed).toBe(false);
    expect(calls.rpc).toHaveBeenCalledTimes(1);
    expect(calls.in).toHaveBeenCalledWith("id",ids);
  });

  it("requires an authorised staff session before reading any catalogue data", async () => {
    calls.auth.mockRejectedValueOnce(new StaffError("STAFF_UNAUTHENTICATED",401));
    expect((await GET(request())).status).toBe(401);
    calls.auth.mockResolvedValue(staff("finance_admin"));
    expect((await GET(request())).status).toBe(403);
    expect(calls.rpc).not.toHaveBeenCalled();
    expect(calls.select).not.toHaveBeenCalled();
  });
});
