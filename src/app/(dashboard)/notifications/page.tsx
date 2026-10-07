import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/server/actions/communicationActions";
import NotificationClientPage from "@/features/notifications/components/NotificationClientPage";

export const metadata = {
  title: "Notifications | Meal Manager",
  description: "Real-time updates regarding your meals, bills, complaints, and notices.",
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
