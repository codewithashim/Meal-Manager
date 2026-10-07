"use server";

import { auth } from "@/auth";
import { UserService } from "@/features/users/services/user.service";
import { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export async function getUsers(query?: string, roleFilter?: string, statusFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await UserService.getUsers(
    session.user.role,
    session.user.permissions,
    query,
    roleFilter,
    statusFilter
  );
}

export async function createUser(data: CreateUserInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await UserService.createUser(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/users");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateUser(data: UpdateUserInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await UserService.updateUser(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/users");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const result = await UserService.updateUserPermissions(
    session.user.id,
    session.user.role,
    userId,
    permissions
  );

  if (result.success) {
    revalidatePath("/users");
    revalidatePath("/audit-logs");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await UserService.deleteUser(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id
    );
    if (result.success) revalidatePath("/users");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleMealStatus(id: string, currentMealStatus: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const result = await UserService.toggleMealStatus(id, currentMealStatus);
  revalidatePath("/users");
  return result;
}
