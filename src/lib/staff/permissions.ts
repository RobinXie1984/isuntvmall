export const STAFF_ROLES = ["super_admin", "business_super_admin", "finance_admin", "merchandise_admin", "admin", "operator", "catalog_editor", "kol", "order_operator", "analyst"] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export type Staff = { id: string; email: string; role: StaffRole; kolId: string | null; aal: "aal1" | "aal2"; sessionId: string };
export const STAFF_ACTIONS = ["catalog.read", "catalog.write", "catalog.draft", "catalog.publish", "live.read", "live.draft", "live.request", "live.publish", "live.pin", "orders.read", "orders.write", "analytics.read", "team.manage", "batch.submit", "batch.approve", "inventory.write", "finance.manage", "finance.read", "system.manage", "merchandise.manage"] as const;
export type StaffAction = typeof STAFF_ACTIONS[number];
export class StaffError extends Error { constructor(public code: string, public status = 403) { super(code); } }
export function privilegedRole(role: StaffRole) { return ["business_super_admin", "finance_admin", "merchandise_admin"].includes(role) || role === "super_admin" || role === "admin" || role === "operator" || role === "order_operator"; }
export function permissionAllowed(staff: Staff, action: StaffAction, scope: { kolId?: string | null } = {}) {
  if (!STAFF_ROLES.includes(staff.role) || (privilegedRole(staff.role) && staff.aal !== "aal2")) return false;
  const business = staff.role === "business_super_admin";
  const merchandise = staff.role === "merchandise_admin";
  const operations = business || staff.role === "super_admin" || staff.role === "admin" || staff.role === "operator";
  const ownKol = staff.role === "kol" && Boolean(staff.kolId) && scope.kolId === staff.kolId;
  switch (action) {
    case "system.manage": return staff.role === "super_admin";
    case "merchandise.manage": return operations || merchandise || staff.role === "catalog_editor";
    case "inventory.write": return operations || merchandise;
    case "finance.read": return business || staff.role === "super_admin" || staff.role === "finance_admin";
    case "finance.manage":
    case "team.manage": return business || staff.role === "super_admin";
    case "batch.approve": case "catalog.publish": return business || staff.role === "super_admin" || staff.role === "admin";
    case "batch.submit": return operations || merchandise || staff.role === "catalog_editor" || (staff.role === "kol" && Boolean(staff.kolId));
    case "catalog.read": return staff.role !== "finance_admin";
    case "live.read": return staff.role !== "finance_admin" && !merchandise;
    case "catalog.write": return operations || merchandise || staff.role === "catalog_editor";
    case "catalog.draft": return operations || merchandise || staff.role === "catalog_editor" || ownKol;
    case "live.draft": case "live.request": case "live.pin": return operations || ownKol;
    case "live.publish": return operations;
    case "orders.read": return operations || staff.role === "order_operator";
    case "orders.write": return business || staff.role === "super_admin" || staff.role === "order_operator";
    case "analytics.read": return operations || staff.role === "analyst" || ownKol;
    default: return false;
  }
}
export function requirePermission(staff: Staff, action: StaffAction, scope: { kolId?: string | null } = {}) {
  if (privilegedRole(staff.role) && staff.aal !== "aal2") throw new StaffError("MFA_REQUIRED", 403);
  if (!permissionAllowed(staff, action, scope)) throw new StaffError("STAFF_FORBIDDEN", 403);
}
export function staffLanding(staff: Pick<Staff, "role">) {
  if (staff.role === "finance_admin") return "/admin/finance";
  if (staff.role === "order_operator") return "/admin/orders";
  if (staff.role === "analyst") return "/admin/overview";
  if (staff.role === "kol") return "/admin/live";
  return "/admin/products";
}

export function assignableRoles(actor: StaffRole): readonly StaffRole[] { return actor === "super_admin" ? STAFF_ROLES : actor === "business_super_admin" ? STAFF_ROLES.filter(role => role !== "super_admin") : []; }
export function requireAssignableRole(actor: Staff, role: StaffRole) { requirePermission(actor, "team.manage"); if (!assignableRoles(actor.role).includes(role)) throw new StaffError("STAFF_FORBIDDEN", 403); }
