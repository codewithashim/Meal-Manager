"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { enforcePermission } from "@/lib/permissions";
import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers(query?: string, roleFilter?: string, statusFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "USERS", "READ", session.user.permissions);

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

  const users = await db.user.findMany({
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

  return users;
}

export async function createUser(data: CreateUserInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "USERS", "CREATE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

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

  // Log Audit
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: newUser.id,
      details: `Created user ${newUser.email} with role ${newUser.role}`,
    },
  });

  revalidatePath("/users");
  return { success: true, user: newUser };
}

export async function updateUser(data: UpdateUserInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "USERS", "UPDATE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

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

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      details: `Updated user details for ${updatedUser.email}`,
    },
  });

  revalidatePath("/users");
  return { success: true, user: updatedUser };
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden: Only Admins can modify access control permissions." };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: "User not found." };

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { permissions },
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE_PERMISSIONS",
      entity: "User",
      entityId: userId,
      details: `Updated access permissions for ${updatedUser.name} (${updatedUser.email}): [${permissions.join(", ")}]`,
    },
  });

  revalidatePath("/users");
  revalidatePath("/audit-logs");
  revalidatePath("/dashboard");

  return { success: true, permissions: updatedUser.permissions };
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "USERS", "DELETE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  if (session.user.id === id) {
    return { error: "You cannot delete your own account." };
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };

  await db.user.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "DELETE_USER",
      entity: "User",
      entityId: id,
      details: `Deleted user ${user.email}`,
    },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function toggleMealStatus(id: string, currentMealStatus: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const updated = await db.user.update({
    where: { id },
    data: { mealStatus: !currentMealStatus },
  });

  revalidatePath("/users");
  return { success: true, mealStatus: updated.mealStatus };
}
