import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getComplaints } from "@/server/actions/communicationActions";
import ComplaintClientPage from "@/features/complaints/components/ComplaintClientPage";

export const metadata = {
  title: "Service Tickets & Complaints | Mess Mate",
  description: "Submit issues regarding mess facilities, food, utilities, or maintenance.",
};

export default async function ComplaintsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const complaints = await getComplaints();

  return (
    <ComplaintClientPage
      initialComplaints={complaints as any}
      currentUserRole={session.user.role}
    />
  );
}
