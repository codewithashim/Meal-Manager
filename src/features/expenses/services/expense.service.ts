import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role } from "@prisma/client";
import {
  CreateExpenseInput,
  ExpenseScope,
  createExpenseSchema,
  expenseCategoryFilterSchema,
  expenseIdSchema,
  expenseMonthSchema,
  expenseScopeSchema,
} from "@/lib/validations/billing";
import { expensePayerId, sumBazaarByMember } from "@/features/expenses/payer";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const isManagerRole = (role: Role) => role === Role.ADMIN || role === Role.MANAGER;

type PayerFields = { memberId: string | null; paidFromMessFund: boolean };

export class ExpenseService {
  public static async getExpenses(
    actorRole: Role,
    actorPermissions?: string[],
    monthStr?: string,
    categoryFilter?: string,
    actorId?: string,
    scope: ExpenseScope = "ALL"
  ) {
    PermissionService.enforce(actorRole, "EXPENSES", "READ", actorPermissions);

    const month = expenseMonthSchema.parse(monthStr);
    const category = categoryFilter === undefined ? "ALL" : expenseCategoryFilterSchema.parse(categoryFilter);
    const view = expenseScopeSchema.parse(scope);

    const [year, m] = month.split("-").map(Number);
    // The whole month is loaded once so the summary always covers the full month, whatever the filters.
    const monthExpenses = await db.expense.findMany({
      where: { date: { gte: new Date(Date.UTC(year, m - 1, 1)), lt: new Date(Date.UTC(year, m, 1)) } },
      orderBy: { date: "desc" },
    });

    const nameIds = new Set<string>();
    for (const e of monthExpenses) {
      nameIds.add(e.createdBy);
      const payer = expensePayerId(e);
      if (payer) nameIds.add(payer);
    }
    const users = nameIds.size
      ? await db.user.findMany({ where: { id: { in: [...nameIds] } }, select: { id: true, name: true } })
      : [];
    const nameOf = new Map(users.map((u) => [u.id, u.name]));

    const formatted = monthExpenses.map((e) => {
      const payerId = expensePayerId(e);
      return {
        ...e,
        creatorName: nameOf.get(e.createdBy) || "Mess Member",
        payerId,
        payerName: payerId ? nameOf.get(payerId) || "Mess Member" : "Mess fund",
      };
    });

    const expenses = formatted.filter(
      (e) => (category === "ALL" || e.category === category) && (view === "ALL" || (actorId && e.payerId === actorId))
    );

    const bazaarByMember = sumBazaarByMember(monthExpenses);
    const bazaarTotal = monthExpenses.filter((e) => e.category === "FOOD").reduce((a, e) => a + e.amount, 0);
    const messTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);

    return {
      expenses,
      totalAmount: expenses.reduce((acc, e) => acc + e.amount, 0),
      summary: {
        messTotal,
        bazaarTotal,
        otherTotal: messTotal - bazaarTotal,
        bazaarFromFund: bazaarTotal - [...bazaarByMember.values()].reduce((a, v) => a + v, 0),
        myBazaar: actorId ? bazaarByMember.get(actorId) || 0 : 0,
        bazaarByMember: [...bazaarByMember.entries()]
          .map(([memberId, amount]) => ({ memberId, name: nameOf.get(memberId) || "Mess Member", amount }))
          .sort((a, b) => b.amount - a.amount),
      },
    };
  }

  // Members who can be credited for bazaar a manager logs on their behalf.
  public static async getPayerOptions(actorRole: Role, actorPermissions?: string[]) {
    PermissionService.enforce(actorRole, "EXPENSES", "CREATE", actorPermissions);
    if (!isManagerRole(actorRole)) return [];
    return db.user.findMany({
      where: { status: "ACTIVE", role: { not: Role.ADMIN } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Members only log their own bazaar. Managers log anything and choose who paid for food.
  private static async resolvePayer(
    actorId: string,
    actorRole: Role,
    data: { category: string; memberId?: string | null; paidFromMessFund?: boolean }
  ): Promise<{ error: string } | PayerFields> {
    if (!isManagerRole(actorRole)) {
      if (data.category !== "FOOD") {
        return { error: "Members can only log bazaar (food). Ask a manager to record utility bills and other mess costs." };
      }
      return { memberId: actorId, paidFromMessFund: false };
    }

    if (data.category !== "FOOD" || data.paidFromMessFund) return { memberId: null, paidFromMessFund: true };

    const memberId = data.memberId || actorId;
    if (memberId !== actorId) {
      const member = await db.user.findUnique({ where: { id: memberId }, select: { id: true } });
      if (!member) return { error: "The selected member no longer exists." };
    }
    return { memberId, paidFromMessFund: false };
  }

  public static async createExpense(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: CreateExpenseInput
  ) {
    PermissionService.enforce(actorRole, "EXPENSES", "CREATE", actorPermissions);

    const parsed = createExpenseSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const payer = await ExpenseService.resolvePayer(actorId, actorRole, parsed.data);
    if ("error" in payer) return payer;

    const newExpense = await db.expense.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        amount: parsed.data.amount,
        date: parseDateString(parsed.data.date),
        description: parsed.data.description || null,
        createdBy: actorId,
        ...payer,
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

  public static async updateExpense(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string,
    data: CreateExpenseInput
  ) {
    PermissionService.enforce(actorRole, "EXPENSES", "UPDATE", actorPermissions);
    if (!expenseIdSchema.safeParse(id).success) return { error: "Invalid expense ID." };

    const parsed = createExpenseSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) return { error: "Expense not found." };

    const ownOnly = !isManagerRole(actorRole);
    if (ownOnly && existing.createdBy !== actorId) {
      return { error: "Forbidden: You can only edit your own bazaar entries." };
    }

    const payer = await ExpenseService.resolvePayer(actorId, actorRole, parsed.data);
    if ("error" in payer) return payer;
    // A manager correcting someone else's entry keeps it credited to the original payer unless they chose another.
    if (!ownOnly && !parsed.data.memberId && !parsed.data.paidFromMessFund && parsed.data.category === "FOOD") {
      payer.memberId = expensePayerId(existing) ?? actorId;
    }

    const updated = await db.expense.updateMany({
      where: { id, ...(ownOnly ? { createdBy: actorId } : {}) },
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        amount: parsed.data.amount,
        date: parseDateString(parsed.data.date),
        description: parsed.data.description || null,
        ...payer,
      },
    });
    if (updated.count !== 1) return { error: "Expense no longer exists or cannot be edited." };

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_EXPENSE",
      entity: "Expense",
      entityId: id,
      details: `Edited expense ${existing.title} (৳${existing.amount} → ৳${parsed.data.amount})`,
    });

    return { success: true, previousDate: existing.date.toISOString().slice(0, 10) };
  }

  public static async deleteExpense(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string
  ) {
    PermissionService.enforce(actorRole, "EXPENSES", "DELETE", actorPermissions);
    if (!expenseIdSchema.safeParse(id).success) return { error: "Invalid expense ID." };

    const expense = await db.expense.findUnique({ where: { id } });
    if (!expense) return { error: "Expense not found." };

    if (actorRole === Role.USER && expense.createdBy !== actorId) {
      return { error: "Forbidden: You can only delete your own logged bazaar/expenses." };
    }

    const deleted = await db.expense.deleteMany({
      where: { id, ...(actorRole === Role.USER ? { createdBy: actorId } : {}) },
    });
    if (deleted.count !== 1) return { error: "Expense no longer exists or cannot be deleted." };

    await AuditService.logActivity({
      actorId,
      action: "DELETE_EXPENSE",
      entity: "Expense",
      entityId: id,
      details: `Deleted expense ${expense.title} of ৳${expense.amount}`,
    });

    return { success: true, date: expense.date.toISOString().slice(0, 10) };
  }
}
