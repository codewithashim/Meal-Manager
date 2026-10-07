"use client";

import { useState, useTransition } from "react";
import NoticeModal from "@/components/notices/NoticeModal";
import { Megaphone, Plus, Search, Calendar, User, Trash2, Shield, Bell } from "lucide-react";
import { getNotices, deleteNotice } from "@/server/actions/communicationActions";
import { toast } from "sonner";

interface NoticeClientPageProps {
  initialNotices: any[];
  currentUserRole: string;
}

export default function NoticeClientPage({ initialNotices, currentUserRole }: NoticeClientPageProps) {
  const [notices, setNotices] = useState<any[]>(initialNotices);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshed = await getNotices();
      setNotices(refreshed);
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete notice "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await deleteNotice(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Notice deleted.");
        handleRefresh();
      }
    } catch (err: any) {
      toast.error("Failed to delete notice.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-400" />
            Mess Notice Board
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Important announcements, rule updates, and mess notifications.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcement title or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* Notice Feed Grid */}
      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-lg font-medium text-white">No Notices Published</h3>
            <p className="text-sm text-slate-400 mt-1">There are no active announcements on the board.</p>
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div key={n.id} className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 space-y-4">
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(n.priority)}
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{n.title}</h3>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleDelete(n.id, n.title)}
                    disabled={deletingId === n.id}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {n.description}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Posted by <strong className="text-slate-200">{n.createdBy?.name || "Mess Admin"}</strong></span>
                </div>

                {n.expiryDate && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Valid until: {new Date(n.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Notice Modal */}
      <NoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
