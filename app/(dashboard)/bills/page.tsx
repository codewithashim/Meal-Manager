import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMonthlyBills } from "@/server/actions/billingActions";
import BillClientPage from "./BillClientPage";

export const metadata = {
  title: "Monthly Invoices & Bills | Mess Mate",
  description: "View itemized monthly bills, meal costs, room rent, and payment status.",
};

export default async function BillsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const { bills, totalBilled, totalCollected, totalDue } = await getMonthlyBills(currentMonthStr);

  return (
    <BillClientPage
      initialBills={bills as any}
      initialBilled={totalBilled}
      initialCollected={totalCollected}
      initialDue={totalDue}
      initialMonth={currentMonthStr}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  );
}
