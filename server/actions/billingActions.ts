"use server";

import { auth } from "@/auth";
import { ExpenseService } from "@/features/expenses/services/expense.service";
import { BillingService } from "@/features/billing/services/billing.service";
import { CreateExpenseInput, GenerateBillsInput, RecordPaymentInput } from "@/lib/validations/billing";
import { revalidatePath } from "next/cache";

/* ==========================================================================
   EXPENSES ACTIONS
   ========================================================================== */

export async function getExpenses(monthStr?: string, categoryFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await ExpenseService.getExpenses(
    session.user.role,
    session.user.permissions,
    monthStr,
    categoryFilter
  );
}

export async function createExpense(data: CreateExpenseInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await ExpenseService.createExpense(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) {
      revalidatePath("/expenses");
      revalidatePath("/meals");
    }
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await ExpenseService.deleteExpense(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id
    );
    if (result.success) revalidatePath("/expenses");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

/* ==========================================================================
   MONTHLY BILLS ACTIONS
   ========================================================================== */

export async function getMonthlyBills(monthStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await BillingService.getMonthlyBills(
    session.user.role,
    session.user.permissions,
    monthStr
  );
}

export async function getExpenseSummaryForMonth(monthStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await BillingService.getExpenseSummaryForMonth(
    session.user.role,
    session.user.permissions,
    monthStr
  );
}

export async function generateMonthlyBills(data: GenerateBillsInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await BillingService.generateMonthlyBills(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/bills");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

/* ==========================================================================
   PAYMENT ACTIONS
   ========================================================================== */

export async function getPayments(monthStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await BillingService.getPayments(
    session.user.role,
    session.user.permissions,
    monthStr
  );
}

export async function recordPayment(data: RecordPaymentInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await BillingService.recordPayment(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) {
      revalidatePath("/payments");
      revalidatePath("/bills");
    }
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}
