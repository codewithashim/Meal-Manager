import { Role } from "@prisma/client";
import {
  hasPermission,
  enforcePermission,
  AVAILABLE_PERMISSIONS,
  PermissionAction,
  Resource,
} from "@/lib/permissions";

export class PermissionService {
  public static check(
    role: Role,
    resource: Resource,
    action: PermissionAction,
    userPermissions?: string[]
  ): boolean {
    return hasPermission(role, resource, action, userPermissions);
  }

  public static enforce(
    role: Role,
    resource: Resource,
    action: PermissionAction,
    userPermissions?: string[]
  ): void {
    enforcePermission(role, resource, action, userPermissions);
  }

  public static getAvailablePermissions() {
    return AVAILABLE_PERMISSIONS;
  }
}
