"use server";

import { auth } from "@/auth";
import { MealService } from "@/features/meals/services/meal.service";
import { SaveMealRecordInput, BulkDailyMealInput } from "@/lib/validations/meal";
import { revalidatePath } from "next/cache";

export async function getDailyMeals(dateStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await MealService.getDailyMeals(
    session.user.role,
    session.user.permissions,
    dateStr
  );
}

export async function getMonthlyMealSummary(monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await MealService.getMonthlyMealSummary(
    session.user.role,
    session.user.permissions,
    monthStr
  );
}

export async function getUserMealHistory(userId: string, monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await MealService.getUserMealHistory(
    session.user.id,
    session.user.role,
    userId,
    monthStr
  );
}

export async function getMessMonthDailyRecords(monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await MealService.getMessMonthDailyRecords(
    session.user.role,
    session.user.permissions,
    monthStr
  );
}

export async function saveSingleMealRecord(data: SaveMealRecordInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await MealService.saveSingleMealRecord(
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/meals");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function bulkSaveDailyMeals(data: BulkDailyMealInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await MealService.bulkSaveDailyMeals(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/meals");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}
