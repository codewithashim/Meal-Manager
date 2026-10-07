"use client";

import { Role } from "@prisma/client";
import { Sparkles, Calendar, Building2, ShieldCheck, UserCheck, UtensilsCrossed, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { QuickMealToggle } from "./QuickMealToggle";

interface DashboardHeaderProps {
  userName: string;
  userRole: Role;
  userId: string;
  mealStatus: boolean;
  messName?: string;
  roomInfo?: string | null;
}

export function DashboardHeader({
  userName,
  userRole,
  userId,
  mealStatus,
  messName = "MessMate Boarding",
  roomInfo,
}: DashboardHeaderProps) {
  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-4">
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 md:p-8 shadow-2xl">
        {/* Glow accent spheres */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                {messName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {formattedDate}
              </span>
              {roomInfo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  {roomInfo}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {getGreeting()}, {userName}! 👋
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {userRole === Role.USER
                ? "Track your daily meals, current month dues, and mess announcements all in one place."
                : "Real-time mess overview, meal calculations, financial liquidity, and operational metrics."}
            </p>
          </div>

          {/* Role pill & Header Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Role:{" "}
              <span className="text-emerald-400 font-mono font-bold uppercase tracking-wider">
                {userRole}
              </span>
            </div>

            {/* Role specific Header button */}
            {userRole === Role.USER ? (
              <Link
                href="/meals"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>My Meal History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/meals"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Meal Ledger</span>
                </Link>
                <Link
                  href="/expenses"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Meal Toggle Bar for Members */}
      {userRole === Role.USER && (
        <QuickMealToggle userId={userId} initialStatus={mealStatus} />
      )}
    </div>
  );
}
