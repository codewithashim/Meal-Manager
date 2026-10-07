"use client";

import { useState } from "react";
import {
  Receipt,
  MessageSquareWarning,
  Megaphone,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  createdBy: string;
}

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  userName: string;
  createdAt: string;
}

interface NoticeItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
}

interface TodayUserMeal {
  userName: string;
  mealStatus: boolean;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
}

interface DashboardActivityTabsProps {
  recentExpenses: ExpenseItem[];
  pendingComplaints: ComplaintItem[];
  latestNotices: NoticeItem[];
  todayBoarders: TodayUserMeal[];
}

export function DashboardActivityTabs({
  recentExpenses,
  pendingComplaints,
  latestNotices,
  todayBoarders,
}: DashboardActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<"expenses" | "boarders" | "complaints" | "notices">(
    "expenses"
  );

  return (
    <div className="glass-card rounded-3xl p-5 md:p-6 border border-slate-800 space-y-5">
      {/* Header & Tabs bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Operational Feed & Activity Stream
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of expenses, today&apos;s meals, complaints, and announcements
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "expenses"
                ? "bg-slate-800 text-amber-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Recent Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab("boarders")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "boarders"
                ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Today&apos;s Meals ({todayBoarders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "complaints"
                ? "bg-slate-800 text-rose-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Tickets ({pendingComplaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("notices")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "notices"
                ? "bg-slate-800 text-blue-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Notices ({latestNotices.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-3">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              No recent expenses logged for this month.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{exp.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold">
                          {exp.category}
                        </span>
                        <span>• {exp.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-amber-400">
                      -৳{exp.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <span>View All Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab Content 2: Today Boarders Meals */}
      {activeTab === "boarders" && (
        <div className="space-y-3">
          {todayBoarders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              No active boarder meal records found for today.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayBoarders.slice(0, 9).map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                      {b.userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{b.userName}</p>
                      <span
                        className={`text-[10px] font-extrabold ${
                          b.mealStatus ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {b.mealStatus ? "Meal Active" : "Paused"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      {b.totalMeals} Meals
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/meals"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Open Meal Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab Content 3: Complaints / Tickets */}
      {activeTab === "complaints" && (
        <div className="space-y-3">
          {pendingComplaints.length === 0 ? (
            <div className="text-center py-8 text-emerald-400/80 text-xs font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All clear! No pending service tickets requiring attention.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {pendingComplaints.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        c.priority === "URGENT" || c.priority === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{c.title}</h4>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            c.priority === "URGENT"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Reported by <span className="text-slate-300 font-semibold">{c.userName}</span> • {c.createdAt}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase shrink-0">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/complaints"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
            >
              <span>Manage Service Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab Content 4: Notices */}
      {activeTab === "notices" && (
        <div className="space-y-3">
          {latestNotices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              No active announcements posted on the notice board.
            </div>
          ) : (
            <div className="space-y-3">
              {latestNotices.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider">
                      Announcement • {n.createdAt}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        n.priority === "URGENT" || n.priority === "HIGH"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{n.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/notices"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
            >
              <span>Go to Notice Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
