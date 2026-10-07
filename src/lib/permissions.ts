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

export interface PermissionDefinition {
  id: Resource;
  label: string;
  description: string;
}

/**
 * Available Module Permissions for Granular Access Control
 */
export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  {
    id: "MEALS",
    label: "Meal Ledger & Daily Log",
    description: "Log, edit and manage daily meal counts for members",
  },
  {
    id: "EXPENSES",
    label: "Bazaar & Mess Expenses",
    description: "Record food bazaar, utility bills and staff operational costs",
  },
  {
    id: "PAYMENTS",
    label: "Payment Collections",
    description: "Record rent & meal payments received from members",
  },
  {
    id: "BILLS",
    label: "Monthly Bill Invoicing",
    description: "Generate monthly bills, meal rate calculations & due tracking",
  },
  {
    id: "ROOMS",
    label: "Rooms & Seat Allocations",
    description: "Manage rooms, floors, and assign seat allocations",
  },
  {
    id: "USERS",
    label: "Member Directory & Users",
    description: "View, create, edit mess members and user accounts",
  },
  {
    id: "COMPLAINTS",
    label: "Service Tickets Desk",
    description: "Review and resolve member maintenance tickets",
  },
  {
    id: "NOTICES",
    label: "Notice Board & Announcements",
    description: "Post announcements and notices for boarders",
  },
  {
    id: "AUDIT_LOGS",
    label: "Security & Audit Logs",
    description: "View system audit trail and user modification logs",
  },
];

/**
 * Declarative Role-Based Access Control (RBAC) Default Matrix
 */
const DEFAULT_ROLE_PERMISSIONS: Record<
  Role,
  Partial<Record<Resource, PermissionAction[] | "*" | "MANAGE">>
> = {
  ADMIN: {
    USERS: "*",
    ROOMS: "*",
    MEALS: "*",
    EXPENSES: "*",
    PAYMENTS: "*",
    BILLS: "*",
    COMPLAINTS: "*",
    NOTICES: "*",
    REPORTS: "*",
    SETTINGS: "*",
    AUDIT_LOGS: "*",
  },
  MANAGER: {
    USERS: ["CREATE", "READ", "UPDATE"],
    ROOMS: "*",
    MEALS: "*",
    EXPENSES: "*",
    PAYMENTS: "*",
    BILLS: "*",
    COMPLAINTS: "*",
    NOTICES: "*",
    REPORTS: "*",
  },
  USER: {
    MEALS: ["READ", "CREATE", "UPDATE", "MANAGE"],
    EXPENSES: ["READ", "CREATE", "UPDATE", "DELETE", "MANAGE"],
    BILLS: ["READ"],
    PAYMENTS: ["READ"],
    COMPLAINTS: ["READ", "CREATE", "UPDATE"],
    NOTICES: ["READ"],
  },
};

/**
 * Server-side RBAC & Custom Access Control Matrix Check
 */
export function hasPermission(
  role: Role,
  resource: Resource,
  action: PermissionAction = "READ",
  userPermissions?: string[]
): boolean {
  // 1. Admins have full unrestricted access
  if (role === Role.ADMIN) return true;

  // 2. Check explicit custom permissions granted to user
  if (userPermissions && Array.isArray(userPermissions) && userPermissions.length > 0) {
    if (
      userPermissions.includes("ALL") ||
      userPermissions.includes(resource) ||
      userPermissions.includes(`${resource}:${action}`) ||
      userPermissions.includes(`${resource}:MANAGE`) ||
      userPermissions.includes(`${resource}:*`)
    ) {
      return true;
    }
  }

  // 3. Fallback to Declarative Role-Based Defaults
  const roleRules = DEFAULT_ROLE_PERMISSIONS[role];
  if (!roleRules) return false;

  const allowedActions = roleRules[resource];
  if (!allowedActions) return false;

  if (allowedActions === "*" || allowedActions === "MANAGE") return true;

  if (Array.isArray(allowedActions)) {
    return (
      allowedActions.includes(action) ||
      allowedActions.includes("MANAGE") ||
      (action !== "READ" && allowedActions.includes("UPDATE"))
    );
  }

  return false;
}

/**
 * Server-side permission enforcement helper that throws an explicit Error if unauthorized.
 */
export function enforcePermission(
  role: Role,
  resource: Resource,
  action: PermissionAction = "READ",
  userPermissions?: string[]
): void {
  if (!hasPermission(role, resource, action, userPermissions)) {
    throw new Error(`Forbidden: You do not have permission to ${action} ${resource}.`);
  }
}
