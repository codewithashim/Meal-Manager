import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { getMessDateStr } from "@/lib/month";
import { Role, type MealRecord } from "@prisma/client";
import {
  SaveMealRecordInput,
  BulkDailyMealInput,
  saveMealRecordSchema,
  bulkDailyMealSchema,
  mealDateSchema,
  mealMonthSchema,
} from "@/lib/validations/meal";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export type ServiceResult<T = undefined> =
  | { success: true; error?: undefined; record?: T }
  | { success?: false; error: string };

export class MealService {
  public static async getDailyMeals(
    actorId: string,
    actorRole: Role,
    actorPermissions?: string[],
    dateStr?: string
  ) {
    PermissionService.enforce(actorRole, "MEALS", "READ", actorPermissions);

    const todayStr = mealDateSchema.parse(dateStr ?? getMessDateStr());
    const targetDate = parseDateString(todayStr);

    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        role: { not: Role.ADMIN },
        ...(actorRole === Role.USER ? { id: actorId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mealStatus: true,
      },
      orderBy: { name: "asc" },
    });

    const mealRecords = await db.mealRecord.findMany({
      where: {
        date: targetDate,
        user: { role: { not: Role.ADMIN } },
        ...(actorRole === Role.USER ? { userId: actorId } : {}),
      },
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
        breakfast: existing ? existing.breakfast : user.mealStatus ? 1 : 0,
        lunch: existing ? existing.lunch : user.mealStatus ? 1 : 0,
        dinner: existing ? existing.dinner : user.mealStatus ? 1 : 0,
        totalMeals: existing ? existing.totalMeals : user.mealStatus ? 3 : 0,
        note: existing?.note || "",
      };
    });

    return { date: todayStr, records: result };
  }

  public static async getMonthlyMealSummary(
    actorRole: Role,
    actorPermissions: string[] | undefined,
    monthStr: string
  ) {
    PermissionService.enforce(actorRole, "MEALS", "READ", actorPermissions);
    if (actorRole === Role.USER) {
      throw new Error("Forbidden: The mess-wide meal summary is available to managers only.");
    }

    const [year, month] = mealMonthSchema.parse(monthStr).split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const users = await db.user.findMany({
      where: { status: "ACTIVE", role: { not: Role.ADMIN } },
      select: {
        id: true,
        name: true,
        email: true,
        mealStatus: true,
      },
      orderBy: { name: "asc" },
    });

    const mealRecords = await db.mealRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        user: { role: { not: Role.ADMIN } },
      },
    });

    const foodExpenses = await db.expense.aggregate({
      where: {
        category: "FOOD",
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: { amount: true },
    });

    const totalFoodExpense = foodExpenses._sum.amount || 0;

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

  public static async getUserMealHistory(
    actorId: string,
    actorRole: Role,
    userId: string,
    monthStr: string
  ) {
    if (actorRole === Role.USER && actorId !== userId) {
      throw new Error("Forbidden: You can only view your own meal history.");
    }

    const [year, month] = mealMonthSchema.parse(monthStr).split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const records = await db.mealRecord.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
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

  public static async getMessMonthDailyRecords(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    monthStr: string
  ) {
    PermissionService.enforce(actorRole, "MEALS", "READ", actorPermissions);

    const [year, month] = mealMonthSchema.parse(monthStr).split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const records = await db.mealRecord.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        user: { role: { not: Role.ADMIN } },
        ...(actorRole === Role.USER ? { userId: actorId } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userEmail: r.user.email,
      date: r.date.toISOString().split("T")[0],
      breakfast: r.breakfast,
      lunch: r.lunch,
      dinner: r.dinner,
      totalMeals: r.totalMeals,
      note: r.note,
    }));
  }

  public static async saveSingleMealRecord(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: SaveMealRecordInput
  ): Promise<ServiceResult<MealRecord>> {
    PermissionService.enforce(actorRole, "MEALS", "MANAGE", actorPermissions);

    const parsed = saveMealRecordSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    if (actorRole === Role.USER && parsed.data.userId !== actorId) {
      throw new Error("Forbidden: You can only edit your own meals.");
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

    return { success: true, record };
  }

  public static async bulkSaveDailyMeals(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: BulkDailyMealInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "MEALS", "MANAGE", actorPermissions);

    const parsed = bulkDailyMealSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    if (actorRole === Role.USER && parsed.data.records.some((record) => record.userId !== actorId)) {
      throw new Error("Forbidden: You can only edit your own meals.");
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

    await AuditService.logActivity({
      actorId,
      action: "BULK_SAVE_MEALS",
      entity: "MealRecord",
      entityId: parsed.data.date,
      details: `Saved bulk daily meals for ${parsed.data.records.length} members on ${parsed.data.date}`,
    });

    return { success: true };
  }
}
