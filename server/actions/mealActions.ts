"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { enforcePermission } from "@/lib/permissions";
import { saveMealRecordSchema, bulkDailyMealSchema, SaveMealRecordInput, BulkDailyMealInput } from "@/lib/validations/meal";
import { revalidatePath } from "next/cache";

/**
 * Utility to parse date string YYYY-MM-DD into UTC Date object
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function getDailyMeals(dateStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "MEALS", "READ", session.user.permissions);

  const todayStr = dateStr || new Date().toISOString().split("T")[0];
  const targetDate = parseDateString(todayStr);

  // Fetch all active users
  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      mealStatus: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch meal records for this date
  const mealRecords = await db.mealRecord.findMany({
    where: { date: targetDate },
  });

  const recordMap = new Map(mealRecords.map((r) => [r.userId, r]));

  const result = users.map((user) => {
    const existing = recordMap.get(user.id);
    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userMealStatus: user.mealStatus,
      recordId: existing?.id || null,
      date: todayStr,
      breakfast: existing ? existing.breakfast : (user.mealStatus ? 1 : 0),
      lunch: existing ? existing.lunch : (user.mealStatus ? 1 : 0),
      dinner: existing ? existing.dinner : (user.mealStatus ? 1 : 0),
      totalMeals: existing ? existing.totalMeals : (user.mealStatus ? 3 : 0),
      note: existing?.note || "",
    };
  });

  return { date: todayStr, records: result };
}

export async function getMonthlyMealSummary(monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "MEALS", "READ", session.user.permissions);

  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  // Fetch users
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      mealStatus: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch meal records for the month
  const mealRecords = await db.mealRecord.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Fetch food expenses for the month to calculate estimated meal rate
  const foodExpenses = await db.expense.aggregate({
    where: {
      category: "FOOD",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amount: true },
  });

  const totalFoodExpense = foodExpenses._sum.amount || 0;

  // Aggregate per user
  const userSummaryMap = new Map<
    string,
    { breakfast: number; lunch: number; dinner: number; totalMeals: number; activeDays: number }
  >();

  let messTotalMeals = 0;

  mealRecords.forEach((r) => {
    messTotalMeals += r.totalMeals;
    const current = userSummaryMap.get(r.userId) || {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      totalMeals: 0,
      activeDays: 0,
    };

    current.breakfast += r.breakfast;
    current.lunch += r.lunch;
    current.dinner += r.dinner;
    current.totalMeals += r.totalMeals;
    if (r.totalMeals > 0) current.activeDays += 1;

    userSummaryMap.set(r.userId, current);
  });

  const estimatedMealRate = messTotalMeals > 0 ? totalFoodExpense / messTotalMeals : 0;

  const userSummaries = users.map((user) => {
    const summary = userSummaryMap.get(user.id) || {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      totalMeals: 0,
      activeDays: 0,
    };

    const estimatedMealCost = summary.totalMeals * estimatedMealRate;

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userMealStatus: user.mealStatus,
      ...summary,
      estimatedMealCost,
    };
  });

  return {
    month: monthStr,
    messTotalMeals,
    totalFoodExpense,
    estimatedMealRate,
    userSummaries,
  };
}

export async function getUserMealHistory(userId: string, monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // User can view their own history or Manager/Admin can view any user's history
  if (session.user.role === "USER" && session.user.id !== userId) {
    throw new Error("Forbidden: You can only view your own meal history.");
  }

  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const records = await db.mealRecord.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  return records.map((r) => ({
    id: r.id,
    date: r.date.toISOString().split("T")[0],
    breakfast: r.breakfast,
    lunch: r.lunch,
    dinner: r.dinner,
    totalMeals: r.totalMeals,
    note: r.note,
  }));
}

export async function saveSingleMealRecord(data: SaveMealRecordInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "MEALS", "MANAGE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = saveMealRecordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const targetDate = parseDateString(parsed.data.date);
  const totalMeals = parsed.data.breakfast + parsed.data.lunch + parsed.data.dinner;

  const record = await db.mealRecord.upsert({
    where: {
      userId_date: {
        userId: parsed.data.userId,
        date: targetDate,
      },
    },
    update: {
      breakfast: parsed.data.breakfast,
      lunch: parsed.data.lunch,
      dinner: parsed.data.dinner,
      totalMeals,
      note: parsed.data.note || null,
    },
    create: {
      userId: parsed.data.userId,
      date: targetDate,
      breakfast: parsed.data.breakfast,
      lunch: parsed.data.lunch,
      dinner: parsed.data.dinner,
      totalMeals,
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/meals");
  return { success: true, record };
}

export async function bulkSaveDailyMeals(data: BulkDailyMealInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "MEALS", "MANAGE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = bulkDailyMealSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const targetDate = parseDateString(parsed.data.date);

  const operations = parsed.data.records.map((r) => {
    const totalMeals = r.breakfast + r.lunch + r.dinner;
    return db.mealRecord.upsert({
      where: {
        userId_date: {
          userId: r.userId,
          date: targetDate,
        },
      },
      update: {
        breakfast: r.breakfast,
        lunch: r.lunch,
        dinner: r.dinner,
        totalMeals,
        note: r.note || null,
      },
      create: {
        userId: r.userId,
        date: targetDate,
        breakfast: r.breakfast,
        lunch: r.lunch,
        dinner: r.dinner,
        totalMeals,
        note: r.note || null,
      },
    });
  });

  await db.$transaction(operations);

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "BULK_SAVE_MEALS",
      entity: "MealRecord",
      entityId: parsed.data.date,
      details: `Saved bulk daily meals for ${parsed.data.records.length} members on ${parsed.data.date}`,
    },
  });

  revalidatePath("/meals");
  return { success: true };
}
