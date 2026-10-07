"use client";

import { useState } from "react";
import DailyMealLedger from "@/components/meals/DailyMealLedger";
import MonthlyMealSummary from "@/components/meals/MonthlyMealSummary";
import UserMealCalendar from "@/components/meals/UserMealCalendar";
import { UtensilsCrossed, Calendar, FileSpreadsheet, User } from "lucide-react";

interface MealClientPageProps {
  currentUserId: string;
  currentUserRole: string;
  initialDailyData: any;
  initialMonthlyData: any;
  initialDate: string;
  initialMonth: string;
}

export default function MealClientPage({
  currentUserId,
  currentUserRole,
  initialDailyData,
  initialMonthlyData,
  initialDate,
  initialMonth,
}: MealClientPageProps) {
  const isManagerOrAdmin = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";
  const [activeTab, setActiveTab] = useState<"DAILY" | "MONTHLY" | "MY_MEALS">(
    isManagerOrAdmin ? "DAILY" : "MY_MEALS"
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-emerald-400" />
            Meal Ledger & Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage daily meal counts, view monthly meal totals, and calculate estimated meal rates.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {isManagerOrAdmin && (
          <>
            <button
              onClick={() => setActiveTab("DAILY")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "DAILY"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Calendar className="w-4 h-4" /> Daily Ledger
            </button>

            <button
              onClick={() => setActiveTab("MONTHLY")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "MONTHLY"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Monthly Summary
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("MY_MEALS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "MY_MEALS"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <User className="w-4 h-4" /> My Meals
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "DAILY" && (
        <DailyMealLedger
          initialDate={initialDate}
          initialRecords={initialDailyData.records}
          canEdit={isManagerOrAdmin}
        />
      )}

      {activeTab === "MONTHLY" && (
        <MonthlyMealSummary
          initialMonth={initialMonth}
          initialSummary={initialMonthlyData}
        />
      )}

      {activeTab === "MY_MEALS" && (
        <UserMealCalendar
          userId={currentUserId}
          initialMonth={initialMonth}
        />
      )}

    </div>
  );
}
