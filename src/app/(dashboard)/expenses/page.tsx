import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExpenses } from "@/server/actions/billingActions";
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
  const { expenses, totalAmount } = await getExpenses(currentMonthStr);

  return (
    <ExpenseClientPage
      initialExpenses={expenses}
      initialTotal={totalAmount}
      initialMonth={currentMonthStr}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
      canCreate={hasPermission(session.user.role, "EXPENSES", "CREATE", session.user.permissions)}
      canDelete={hasPermission(session.user.role, "EXPENSES", "DELETE", session.user.permissions)}
    />
  );
}
