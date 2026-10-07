import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { CreateUserInput, UpdateUserInput, createUserSchema, updateUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export type ServiceResult<T = any> = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export class UserService {
  public static async getUsers(
    actorRole?: Role,
    actorPermissions?: string[],
    query?: string,
    roleFilter?: string,
    statusFilter?: string
  ) {
    if (actorRole) {
      PermissionService.enforce(actorRole, "USERS", "READ", actorPermissions);
    }

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter;
    }

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    return await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        monthlyRent: true,
        mealStatus: true,
        permissions: true,
        nidNumber: true,
        emergencyContact: true,
        address: true,
        occupation: true,
        joiningDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public static async createUser(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: CreateUserInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "USERS", "CREATE", actorPermissions);

    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return { error: "User with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const newUser = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        status: parsed.data.status,
        monthlyRent: parsed.data.monthlyRent,
        mealStatus: parsed.data.mealStatus,
        permissions: [],
        nidNumber: parsed.data.nidNumber || null,
        emergencyContact: parsed.data.emergencyContact || null,
        address: parsed.data.address || null,
        occupation: parsed.data.occupation || null,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "CREATE_USER",
      entity: "User",
      entityId: newUser.id,
      details: `Created user ${newUser.email} with role ${newUser.role}`,
    });

    return { success: true, user: newUser };
  }

  public static async updateUser(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: UpdateUserInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "USERS", "UPDATE", actorPermissions);

    const parsed = updateUserSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { id, password, ...fields } = parsed.data;
    const updateData: any = { ...fields };
    if (password && password.trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      details: `Updated user details for ${updatedUser.email}`,
    });

    return { success: true, user: updatedUser };
  }

  public static async updateUserPermissions(
    actorId: string,
    actorRole: Role,
    userId: string,
    permissions: string[]
  ): Promise<ServiceResult> {
    if (actorRole !== Role.ADMIN) {
      return { error: "Forbidden: Only Admins can modify access control permissions." };
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { error: "User not found." };

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { permissions },
    });

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_PERMISSIONS",
      entity: "User",
      entityId: userId,
      details: `Updated access permissions for ${updatedUser.name} (${updatedUser.email}): [${permissions.join(", ")}]`,
    });

    return { success: true, permissions: updatedUser.permissions };
  }

  public static async deleteUser(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    targetUserId: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "USERS", "DELETE", actorPermissions);

    if (actorId === targetUserId) {
      return { error: "You cannot delete your own account." };
    }

    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) return { error: "User not found." };

    await db.user.delete({ where: { id: targetUserId } });

    await AuditService.logActivity({
      actorId,
      action: "DELETE_USER",
      entity: "User",
      entityId: targetUserId,
      details: `Deleted user ${user.email}`,
    });

    return { success: true };
  }

  public static async toggleMealStatus(targetUserId: string, currentStatus: boolean): Promise<ServiceResult> {
    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { mealStatus: !currentStatus },
    });

    return { success: true, mealStatus: updated.mealStatus };
  }
}
