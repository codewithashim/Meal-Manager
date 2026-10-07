"use client";

import { Role } from "@prisma/client";
import {
  UtensilsCrossed,
  Receipt,
  Wallet,
  FileSpreadsheet,
  BedDouble,
  MessageSquareWarning,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface QuickActionItem {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  color: string;
  badge?: string | null;
  badgeColor?: string | null;
}

interface DashboardQuickActionsProps {
  role: Role;
  pendingComplaints?: number;
  unpaidBills?: number;
}

export function DashboardQuickActions({
  role,
  pendingComplaints = 0,
  unpaidBills = 0,
}: DashboardQuickActionsProps) {
  const adminActions: QuickActionItem[] = [
    {
      title: "Daily Meal Ledger",
      desc: "Record & bulk edit daily meals",
      href: "/meals",
      icon: UtensilsCrossed,
      color: "emerald",
    },
    {
      title: "Add Mess Expense",
      desc: "Bazaar, utilities & staff salaries",
      href: "/expenses",
      icon: Receipt,
      color: "amber",
    },
    {
      title: "Receive Member Payment",
      desc: "Record rent & meal payments",
      href: "/payments",
      icon: Wallet,
      color: "blue",
    },
    {
      title: "Generate Bills",
      desc: "Calculate & issue monthly bills",
      href: "/bills",
      icon: FileSpreadsheet,
      color: "purple",
      badge: unpaidBills > 0 ? `${unpaidBills} Unpaid` : null,
      badgeColor: "rose",
    },
    {
      title: "Rooms & Seat Allocation",
      desc: "Assign seats to active members",
      href: "/rooms",
      icon: BedDouble,
      color: "indigo",
    },
    {
      title: "Service Tickets Desk",
      desc: "Manage maintenance & complaints",
      href: "/complaints",
      icon: MessageSquareWarning,
      color: "rose",
      badge: pendingComplaints > 0 ? `${pendingComplaints} Pending` : null,
      badgeColor: "amber",
    },
  ];

  const userActions: QuickActionItem[] = [
    {
      title: "My Meal Ledger",
      desc: "View daily logged meals & totals",
      href: "/meals",
      icon: UtensilsCrossed,
      color: "emerald",
    },
    {
      title: "My Bills & Statement",
      desc: "Check due payments & breakdown",
      href: "/bills",
      icon: FileSpreadsheet,
      color: "blue",
    },
    {
      title: "Payment Receipts",
      desc: "View transaction history",
      href: "/payments",
      icon: Wallet,
      color: "purple",
    },
    {
      title: "Submit Service Ticket",
      desc: "Report room, water or meal issues",
      href: "/complaints",
      icon: MessageSquareWarning,
      color: "amber",
    },
  ];

  const actions = role === Role.USER ? userActions : adminActions;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Quick Operational Shortcuts
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">One-tap navigation</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              href={action.href}
              className="glass-card glass-card-hover rounded-2xl p-4 border border-slate-800 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-3 rounded-xl border shrink-0 transition group-hover:scale-105 ${
                    action.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : action.color === "amber"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : action.color === "blue"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : action.color === "purple"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : action.color === "indigo"
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                          action.badgeColor === "rose"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{action.desc}</p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
