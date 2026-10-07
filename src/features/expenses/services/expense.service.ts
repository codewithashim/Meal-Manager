import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role } from "@prisma/client";
import { CreateExpenseInput, createExpenseSchema } from "@/lib/validations/billing";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export type ServiceResult<T = any> = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export class ExpenseService {
  public static async getExpenses(
    actorRole: Role,
    actorPermissions?: string[],
    monthStr?: string,
    categoryFilter?: string
  ) {
    PermissionService.enforce(actorRole, "EXPENSES", "READ", actorPermissions);

    const where: any = {};

    if (monthStr) {
      const [year, month] = monthStr.split("-").map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      where.date = { gte: startDate, lte: endDate };
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      where.category = categoryFilter;
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const userIds = Array.from(new Set(expenses.map((e) => e.createdBy).filter(Boolean)));
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formattedExpenses = expenses.map((e) => ({
      ...e,
      creatorName: userMap.get(e.createdBy) || "Mess Member",
    }));

    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    return { expenses: formattedExpenses, totalAmount };
  }

  public static async createExpense(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: CreateExpenseInput
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "EXPENSES", "CREATE", actorPermissions);

    const parsed = createExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const expenseDate = parseDateString(parsed.data.date);

    const newExpense = await db.expense.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        amount: parsed.data.amount,
        date: expenseDate,
        description: parsed.data.description || null,
        createdBy: actorId,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "CREATE_EXPENSE",
      entity: "Expense",
      entityId: newExpense.id,
      details: `Logged expense ${newExpense.title} of ৳${newExpense.amount} (${newExpense.category})`,
    });

    return { success: true, expense: newExpense };
  }

  public static async deleteExpense(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "EXPENSES", "DELETE", actorPermissions);

    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) return { error: "Expense not found." };

    if (actorRole === Role.USER && expense.createdBy !== actorId) {
      return { error: "Forbidden: You can only delete your own logged bazaar/expenses." };
    }

    await db.expense.delete({ where: { id } });

    await AuditService.logActivity({
      actorId,
      action: "DELETE_EXPENSE",
      entity: "Expense",
      entityId: id,
      details: `Deleted expense ${expense.title} of ৳${expense.amount}`,
    });

    return { success: true };
  }
}
