import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMonthlyBills } from "@/server/actions/billingActions";
import { getMessMonthStr, getPreviousMonthStr, resolveMonthParam } from "@/lib/month";
import BillClientPage from "@/features/billing/components/BillClientPage";

export const metadata = {
  title: "Monthly Invoices & Bills | Meal Manager",
  description: "View itemized monthly bills, meal costs, room rent, and payment status.",
};

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const billMonthStr = resolveMonthParam(month, getPreviousMonthStr(getMessMonthStr()));
  const { bills, totalBilled, totalCollected, totalDue, messSummary } = await getMonthlyBills(billMonthStr);

  return (
    <BillClientPage
      initialBills={bills as any}
      initialBilled={totalBilled}
      initialCollected={totalCollected}
      initialDue={totalDue}
      initialMessSummary={messSummary}
      initialMonth={billMonthStr}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
