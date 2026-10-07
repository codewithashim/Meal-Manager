import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPayments } from "@/server/actions/billingActions";
import PaymentClientPage from "@/features/billing/components/PaymentClientPage";
 
export const metadata = {
  title: "Member Payments | Mess Mate",
  description: "Record and track member rent and meal payments.",
};

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
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
