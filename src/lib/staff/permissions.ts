export const STAFF_ROLES = ["super_admin", "operator", "catalog_editor", "kol", "order_operator", "analyst"] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export type Staff = { id: string; email: string; role: StaffRole; kolId: string | null; aal: "aal1" | "aal2"; sessionId: string };
export const STAFF_ACTIONS = ["catalog.read", "catalog.write", "catalog.draft", "catalog.publish", "live.read", "live.draft", "live.request", "live.publish", "live.pin", "orders.read", "orders.write", "analytics.read", "team.manage", "batch.submit", "batch.approve"] as const;
export type StaffAction = typeof STAFF_ACTIONS[number];
export class StaffError extends Error { constructor(public code: string, public status = 403) { super(code); } }
export function privilegedRole(role: StaffRole) { return role === "super_admin" || role === "operator" || role === "order_operator"; }
export function permissionAllowed(staff: Staff, action: StaffAction, scope: { kolId?: string | null } = {}) {
  if (!STAFF_ROLES.includes(staff.role) || (privilegedRole(staff.role) && staff.aal !== "aal2")) return false;
  const operations = staff.role === "super_admin" || staff.role === "operator";
  const ownKol = staff.role === "kol" && Boolean(staff.kolId) && scope.kolId === staff.kolId;
  switch (action) {
    case "team.manage": case "batch.approve": case "catalog.publish": return staff.role === "super_admin";
    case "batch.submit": return operations || staff.role === "catalog_editor" || (staff.role === "kol" && Boolean(staff.kolId));
    case "catalog.read": case "live.read": return true;
    case "catalog.write": return operations || staff.role === "catalog_editor";
    case "catalog.draft": return operations || staff.role === "catalog_editor" || ownKol;
    case "live.draft": case "live.request": case "live.pin": return operations || ownKol;
    case "live.publish": return operations;
    case "orders.read": return operations || staff.role === "order_operator";
    case "orders.write": return staff.role === "super_admin" || staff.role === "order_operator";
    case "analytics.read": return operations || staff.role === "analyst" || ownKol;
    default: return false;
  }
}
export function requirePermission(staff: Staff, action: StaffAction, scope: { kolId?: string | null } = {}) {
  if (privilegedRole(staff.role) && staff.aal !== "aal2") throw new StaffError("MFA_REQUIRED", 403);
  if (!permissionAllowed(staff, action, scope)) throw new StaffError("STAFF_FORBIDDEN", 403);
}
export function staffLanding(staff: Pick<Staff, "role">) {
  if (staff.role === "order_operator") return "/admin/orders";
  if (staff.role === "analyst") return "/admin/overview";
  if (staff.role === "kol") return "/admin/live";
  return "/admin/products";
}
