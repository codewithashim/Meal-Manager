"use server";

import { auth } from "@/auth";
import { ExpenseService } from "@/features/expenses/services/expense.service";
import { BillingService } from "@/features/billing/services/billing.service";
import { CreateExpenseInput, ExpenseScope, RecordPaymentInput } from "@/lib/validations/billing";
import { revalidatePath } from "next/cache";

/* ==========================================================================
   EXPENSES ACTIONS
   ========================================================================== */

export async function getExpenses(monthStr?: string, categoryFilter?: string, scope: ExpenseScope = "ALL") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await ExpenseService.getExpenses(
    session.user.role,
    session.user.permissions,
    monthStr,
    categoryFilter,
    session.user.id,
    scope
  );
}

export async function getExpensePayers() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return await ExpenseService.getPayerOptions(session.user.role, session.user.permissions);
}

// Bazaar changes move the meal rate and members' credit, so generated bills for the month are refreshed.
async function afterExpenseChange(...dates: (string | undefined)[]) {
  await BillingService.syncMonths(...dates.map((d) => d?.slice(0, 7)));
  revalidatePath("/expenses");
  revalidatePath("/meals");
  revalidatePath("/bills");
  revalidatePath("/profile", "layout");
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
    if (result.success) await afterExpenseChange(data.date);
    return result;
  } catch (err: unknown) {
    console.error("Failed to create expense:", err);
    return { error: err instanceof Error ? err.message : "Failed to create expense." };
  }
}

export async function updateExpense(id: string, data: CreateExpenseInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await ExpenseService.updateExpense(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id,
      data
    );
    if ("previousDate" in result) await afterExpenseChange(data.date, result.previousDate);
    return result;
  } catch (err: unknown) {
    console.error("Failed to update expense:", err);
    return { error: err instanceof Error ? err.message : "Failed to update expense." };
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
    if ("date" in result) await afterExpenseChange(result.date);
    return result;
  } catch (err: unknown) {
    console.error("Failed to delete expense:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete expense." };
  }
}

/* ==========================================================================
   MONTHLY BILLS ACTIONS
   ========================================================================== */

// Bills are derived automatically; reading a month syncs it with the latest meals, expenses and payments.
export async function getMonthlyBills(monthStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await BillingService.getMonthlyBills(session.user.role, session.user.permissions, monthStr);
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
      revalidatePath("/profile", "layout");
    }
    return result;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to record payment." };
  }
}
