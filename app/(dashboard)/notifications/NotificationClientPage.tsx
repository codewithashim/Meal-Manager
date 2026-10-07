"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCheck, Check, MessageSquare, Megaphone, Receipt, Shield } from "lucide-react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/server/actions/communicationActions";
import { toast } from "sonner";

interface NotificationClientPageProps {
  initialNotifications: any[];
  initialUnreadCount: number;
}

export default function NotificationClientPage({
  initialNotifications,
  initialUnreadCount,
}: NotificationClientPageProps) {
  const [notifications, setNotifications] = useState<any[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    startTransition(async () => {
      const res = await getUserNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      handleRefresh();
    } catch (err: any) {
      toast.error("Failed to mark as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success("All notifications marked as read.");
      handleRefresh();
    } catch (err: any) {
      toast.error("Failed to mark all as read.");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COMPLAINT":
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case "NOTICE":
        return <Megaphone className="w-4 h-4 text-blue-400" />;
      case "PAYMENT":
      case "BILL":
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-purple-400" />
            Notifications & System Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time updates regarding your meals, bills, complaints, and mess notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-lg font-medium text-white">No Notifications</h3>
            <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card rounded-2xl p-4 border transition flex items-start justify-between gap-4 ${
                !n.read ? "border-blue-500/30 bg-blue-950/10" : "border-slate-800 opacity-80"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {getTypeIcon(n.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                  <span className="text-[11px] text-slate-500 font-mono block mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
