import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/server/actions/communicationActions";
import NotificationClientPage from "./NotificationClientPage";

export const metadata = {
  title: "Notifications | Mess Mate",
  description: "Real-time updates regarding your meals, bills, complaints, and mess notices.",
};

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { notifications, unreadCount } = await getUserNotifications();

  return (
    <NotificationClientPage
      initialNotifications={notifications as any}
      initialUnreadCount={unreadCount}
    />
  );
}
