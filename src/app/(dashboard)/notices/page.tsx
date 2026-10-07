import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotices } from "@/server/actions/communicationActions";
import NoticeClientPage from "@/features/notices/components/NoticeClientPage";

export const metadata = {
  title: "Notice Board | Mess Mate",
  description: "View announcements, rule updates, and mess notices.",
};

export default async function NoticesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const notices = await getNotices();

  return (
    <NoticeClientPage
      initialNotices={notices as any}
      currentUserRole={session.user.role}
    />
  );
}
