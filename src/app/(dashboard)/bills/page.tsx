import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMonthlyBills } from "@/server/actions/billingActions";
import { getMessMonthStr, resolveMonthParam } from "@/lib/month";
import BillClientPage from "@/features/billing/components/BillClientPage";

export const metadata = {
  title: "Monthly Invoices & Bills | Meal Manager",
  description: "Monthly bills calculated automatically from meals, bazaar, utility bills, rent and payments.",
};

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  // Bills are live, so the page opens on the current month like every other monthly page.
  const billMonthStr = resolveMonthParam(month, getMessMonthStr());
  const initialData = await getMonthlyBills(billMonthStr);

  return (
    <BillClientPage
      initialData={initialData}
      initialMonth={billMonthStr}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
