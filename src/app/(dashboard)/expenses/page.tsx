import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExpenses } from "@/server/actions/billingActions";
import ExpenseClientPage from "@/features/expenses/components/ExpenseClientPage";

export const metadata = {
  title: "Mess Expenses | Mess Mate",
  description: "Track daily bazaar spending, utility bills, and mess operational expenses.",
};

export default async function ExpensesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const { expenses, totalAmount } = await getExpenses(currentMonthStr);

  return (
    <ExpenseClientPage
      initialExpenses={expenses as any}
      initialTotal={totalAmount}
      initialMonth={currentMonthStr}
      currentUserRole={session.user.role}
    />
  );
}
