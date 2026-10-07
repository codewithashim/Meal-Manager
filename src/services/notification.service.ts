import { db } from "@/services/db.service";

export class NotificationService {
  public static async getUserNotifications(userId: string) {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount };
  }

  public static async markAsRead(id: string, userId: string) {
    return await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  public static async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
