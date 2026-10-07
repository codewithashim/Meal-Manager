import { Role } from "@prisma/client";

export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE" | "MANAGE";

export type Resource =
  | "USERS"
  | "ROOMS"
  | "MEALS"
  | "EXPENSES"
  | "PAYMENTS"
  | "BILLS"
  | "COMPLAINTS"
  | "NOTICES"
  | "REPORTS"
  | "SETTINGS"
  | "AUDIT_LOGS";

/**
 * Available Module Permissions for Granular Access Control
 */
export const AVAILABLE_PERMISSIONS: { id: Resource; label: string; description: string }[] = [
  { id: "MEALS", label: "Meal Ledger & Daily Meals", description: "Log, edit and manage daily meal counts for members" },
  { id: "EXPENSES", label: "Mess & Bazaar Expenses", description: "Record food bazaar, utility bills and staff costs" },
  { id: "PAYMENTS", label: "Payment Collections", description: "Record rent & meal payments received from members" },
  { id: "BILLS", label: "Monthly Bill Invoicing", description: "Generate monthly bills, meal rate calculations & due tracking" },
  { id: "ROOMS", label: "Rooms & Seat Allocations", description: "Manage rooms, floors, and assign seat allocations" },
  { id: "USERS", label: "Member Directory & Users", description: "View, create, edit mess members and user accounts" },
  { id: "COMPLAINTS", label: "Service Tickets Desk", description: "Review and resolve member maintenance tickets" },
  { id: "NOTICES", label: "Notice Board & Announcements", description: "Post announcements and notices for boarders" },
  { id: "AUDIT_LOGS", label: "Security & Audit Logs", description: "View system audit trail and user modification logs" },
];

/**
 * Server-side RBAC & Custom Access Control Matrix check
 */
export function hasPermission(
  role: Role,
  resource: Resource,
  action: PermissionAction,
  userPermissions?: string[]
): boolean {
  // Admins always have full unrestricted access
  if (role === Role.ADMIN) return true;

  // Check if explicit custom permission was granted to user by Admin
  if (userPermissions && Array.isArray(userPermissions)) {
    if (
      userPermissions.includes("ALL") ||
      userPermissions.includes(resource) ||
      userPermissions.includes(`${resource}:${action}`)
    ) {
      return true;
    }
  }

  // Role-based defaults
  if (role === Role.MANAGER) {
    if (resource === "SETTINGS" || resource === "AUDIT_LOGS") return false;
    if (resource === "USERS" && action === "DELETE") return false;
    return true;
  }

  if (role === Role.USER) {
    if (resource === "COMPLAINTS" && (action === "CREATE" || action === "READ")) return true;
    if (resource === "NOTICES" && action === "READ") return true;
    if (resource === "MEALS" && (action === "READ" || action === "CREATE" || action === "UPDATE" || action === "MANAGE")) return true;
    if (resource === "EXPENSES" && (action === "READ" || action === "CREATE")) return true;
    if (resource === "BILLS" && action === "READ") return true;
    if (resource === "PAYMENTS" && action === "READ") return true;
    return false;
  }

  return false;
}

export function enforcePermission(
  role: Role,
  resource: Resource,
  action: PermissionAction,
  userPermissions?: string[]
): void {
  if (!hasPermission(role, resource, action, userPermissions)) {
    throw new Error(`Forbidden: You do not have permission to ${action} ${resource}.`);
  }
}
