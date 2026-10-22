import {describe,it,expect} from "vitest";
import {permissionAllowed,assignableRoles,requireAssignableRole,staffLanding,type Staff} from "./permissions";
const staff=(role:Staff["role"]):Staff=>({role,id:"fixture",email:"fixture@example.invalid",aal:"aal2",sessionId:"session",kolId:null});
describe("colleague boundaries",()=>{
 it("finance reads finance only and lands in the report",()=>{const s=staff("finance_admin");expect(staffLanding(s)).toBe("/admin/finance");expect(permissionAllowed(s,"finance.read")).toBe(true);for(const a of ["finance.manage","orders.read","merchandise.manage","catalog.read","team.manage","live.read","system.manage"] as const)expect(permissionAllowed(s,a)).toBe(false);});
 it("merchandise has stock and draft rights without approval or finance",()=>{const s=staff("merchandise_admin");for(const a of ["inventory.write","merchandise.manage","batch.submit"] as const)expect(permissionAllowed(s,a)).toBe(true);for(const a of ["finance.read","orders.read","team.manage","system.manage","catalog.publish"] as const)expect(permissionAllowed(s,a)).toBe(false);});
 it("business can administer business but never delegate technical ownership",()=>{const s=staff("business_super_admin");for(const a of ["team.manage","orders.write","catalog.publish","finance.read","live.publish"] as const)expect(permissionAllowed(s,a)).toBe(true);expect(permissionAllowed(s,"system.manage")).toBe(false);expect(assignableRoles(s.role)).not.toContain("super_admin");expect(()=>requireAssignableRole(s,"super_admin")).toThrow("STAFF_FORBIDDEN");});
});
