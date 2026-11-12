import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPayments } from "@/server/actions/billingActions";
import { getMessMonthStr, resolveMonthParam } from "@/lib/month";
import PaymentClientPage from "@/features/billing/components/PaymentClientPage";
 
export const metadata = {
  title: "Member Payments | Meal Manager",
  description: "Record and track member rent and meal payments.",
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const currentMonthStr = resolveMonthParam(month, getMessMonthStr());
  const { payments, totalCollected } = await getPayments(currentMonthStr);

  return (
    <PaymentClientPage
      initialPayments={payments as any}
      initialCollected={totalCollected}
      initialMonth={currentMonthStr}
      currentUserRole={session.user.role}
    />
  );
}
