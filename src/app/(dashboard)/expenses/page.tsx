import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExpensePayers, getExpenses } from "@/server/actions/billingActions";
import { getMessMonthStr, resolveMonthParam } from "@/lib/month";
import ExpenseClientPage from "@/features/expenses/components/ExpenseClientPage";
import { hasPermission } from "@/lib/permissions";

export const metadata = {
  title: "Expenses | Meal Manager",
  description: "Track daily bazaar spending, utility bills, and operational expenses.",
};

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const currentMonthStr = resolveMonthParam(month, getMessMonthStr());
  const canCreate = hasPermission(session.user.role, "EXPENSES", "CREATE", session.user.permissions);
  const [{ expenses, totalAmount, summary }, payers] = await Promise.all([
    getExpenses(currentMonthStr),
    canCreate ? getExpensePayers() : Promise.resolve([]),
  ]);

  return (
    <ExpenseClientPage
      initialExpenses={expenses}
      initialTotal={totalAmount}
      initialSummary={summary}
      payers={payers}
      initialMonth={currentMonthStr}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
      canCreate={canCreate}
      canEdit={hasPermission(session.user.role, "EXPENSES", "UPDATE", session.user.permissions)}
      canDelete={hasPermission(session.user.role, "EXPENSES", "DELETE", session.user.permissions)}
    />
  );
}
