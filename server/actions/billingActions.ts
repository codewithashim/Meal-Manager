"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { enforcePermission } from "@/lib/permissions";
import {
  createExpenseSchema,
  generateBillsSchema,
  recordPaymentSchema,
  CreateExpenseInput,
  GenerateBillsInput,
  RecordPaymentInput,
} from "@/lib/validations/billing";
import { revalidatePath } from "next/cache";

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/* ==========================================================================
   EXPENSES ACTIONS
   ========================================================================== */

export async function getExpenses(monthStr?: string, categoryFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "EXPENSES", "READ", session.user.permissions);

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

  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return { expenses, totalAmount };
}

export async function createExpense(data: CreateExpenseInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "EXPENSES", "CREATE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

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
      createdBy: session.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_EXPENSE",
      entity: "Expense",
      entityId: newExpense.id,
      details: `Logged expense ${newExpense.title} of ৳${newExpense.amount} (${newExpense.category})`,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/meals");
  return { success: true, expense: newExpense };
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "EXPENSES", "DELETE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing) return { error: "Expense not found." };

  await db.expense.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "DELETE_EXPENSE",
      entity: "Expense",
      entityId: id,
      details: `Deleted expense ${existing.title} (৳${existing.amount})`,
    },
  });

  revalidatePath("/expenses");
  return { success: true };
}

/* ==========================================================================
   MONTHLY BILLING ACTIONS
   ========================================================================== */

export async function getMonthlyBills(monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "BILLS", "READ", session.user.permissions);

  const bills = await db.monthlyBill.findMany({
    where: { month: monthStr },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          monthlyRent: true,
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const totalBilled = bills.reduce((acc, b) => acc + b.totalBill, 0);
  const totalCollected = bills.reduce((acc, b) => acc + b.totalPaid, 0);
  const totalDue = bills.reduce((acc, b) => acc + b.dueAmount, 0);

  return { bills, totalBilled, totalCollected, totalDue };
}

export async function generateMonthlyBills(data: GenerateBillsInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "BILLS", "MANAGE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = generateBillsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { month, utilitySharePerMember, otherChargesPerMember } = parsed.data;

  const [year, mNum] = month.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, mNum - 1, 1));
  const endDate = new Date(Date.UTC(year, mNum, 0, 23, 59, 59));

  // 1. Fetch total FOOD expenses for the month
  const foodExpenses = await db.expense.aggregate({
    where: {
      category: "FOOD",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });
  const totalFoodExpense = foodExpenses._sum.amount || 0;

  // 2. Fetch all meal records for the month
  const mealRecords = await db.mealRecord.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  let messTotalMeals = 0;
  const userMealMap = new Map<string, number>();

  mealRecords.forEach((r) => {
    messTotalMeals += r.totalMeals;
    const current = userMealMap.get(r.userId) || 0;
    userMealMap.set(r.userId, current + r.totalMeals);
  });

  const mealRate = messTotalMeals > 0 ? totalFoodExpense / messTotalMeals : 0;

  // 3. Fetch active users
  const activeUsers = await db.user.findMany({
    where: { status: "ACTIVE" },
  });

  // 4. Upsert bill for each active user
  for (const user of activeUsers) {
    const userTotalMeals = userMealMap.get(user.id) || 0;
    const mealCost = userTotalMeals * mealRate;
    const roomRent = user.monthlyRent || 0;
    const totalBill = mealCost + roomRent + utilitySharePerMember + otherChargesPerMember;

    // Check existing payments for this user for this month
    const existingPayments = await db.payment.aggregate({
      where: { userId: user.id, month },
      _sum: { amount: true },
    });
    const totalPaid = existingPayments._sum.amount || 0;
    const dueAmount = Math.max(0, totalBill - totalPaid);

    let status: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
    if (totalPaid >= totalBill && totalBill > 0) {
      status = "PAID";
    } else if (totalPaid > 0) {
      status = "PARTIALLY_PAID";
    }

    await db.monthlyBill.upsert({
      where: {
        userId_month: {
          userId: user.id,
          month,
        },
      },
      update: {
        totalMeals: userTotalMeals,
        mealRate,
        mealCost,
        roomRent,
        utilityShare: utilitySharePerMember,
        otherCharges: otherChargesPerMember,
        totalBill,
        totalPaid,
        dueAmount,
        status,
      },
      create: {
        userId: user.id,
        month,
        totalMeals: userTotalMeals,
        mealRate,
        mealCost,
        roomRent,
        utilityShare: utilitySharePerMember,
        otherCharges: otherChargesPerMember,
        totalBill,
        totalPaid,
        dueAmount,
        status,
      },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "GENERATE_BILLS",
      entity: "MonthlyBill",
      entityId: month,
      details: `Generated monthly bills for ${month} with meal rate ৳${mealRate.toFixed(2)}`,
    },
  });

  revalidatePath("/bills");
  return { success: true, count: activeUsers.length, mealRate };
}

/* ==========================================================================
   PAYMENTS ACTIONS
   ========================================================================== */

export async function getPayments(monthStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "PAYMENTS", "READ", session.user.permissions);

  const where: any = {};
  if (monthStr && monthStr !== "ALL") {
    where.month = monthStr;
  }

  const payments = await db.payment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return { payments, totalCollected };
}

export async function recordPayment(data: RecordPaymentInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "PAYMENTS", "CREATE", session.user.permissions);
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = recordPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const paymentDate = parseDateString(parsed.data.date);

  const newPayment = await db.payment.create({
    data: {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      date: paymentDate,
      month: parsed.data.month,
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId || null,
      note: parsed.data.note || null,
      recordedBy: session.user.id,
    },
    include: { user: true },
  });

  // Re-calculate MonthlyBill totalPaid & dueAmount
  const bill = await db.monthlyBill.findUnique({
    where: {
      userId_month: {
        userId: parsed.data.userId,
        month: parsed.data.month,
      },
    },
  });

  if (bill) {
    const allPayments = await db.payment.aggregate({
      where: { userId: parsed.data.userId, month: parsed.data.month },
      _sum: { amount: true },
    });

    const totalPaid = allPayments._sum.amount || 0;
    const dueAmount = Math.max(0, bill.totalBill - totalPaid);

    let status: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
    if (totalPaid >= bill.totalBill && bill.totalBill > 0) {
      status = "PAID";
    } else if (totalPaid > 0) {
      status = "PARTIALLY_PAID";
    }

    await db.monthlyBill.update({
      where: { id: bill.id },
      data: { totalPaid, dueAmount, status },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "RECORD_PAYMENT",
      entity: "Payment",
      entityId: newPayment.id,
      details: `Recorded payment of ৳${newPayment.amount} for ${newPayment.user.email} (${newPayment.month})`,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/bills");
  return { success: true, payment: newPayment };
}
