"use client";

import { useState } from "react";
import DailyMealLedger from "@/features/meals/components/DailyMealLedger";
import MonthlyMealSummary from "@/features/meals/components/MonthlyMealSummary";
import UserMealCalendar from "@/features/meals/components/UserMealCalendar";
import MealCalendarView from "@/features/meals/components/MealCalendarView";
import { UtensilsCrossed, Calendar, FileSpreadsheet, User, Grid } from "lucide-react";

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
  
  const [activeTab, setActiveTab] = useState<"CALENDAR" | "DAILY" | "MONTHLY" | "MY_MEALS">("CALENDAR");

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            Meal Ledger & Interactive Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily meal counts, view interactive monthly calendars, and monitor mess meal rates.
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Touch-friendly & horizontal scrollable on mobile) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        
        {/* Interactive Calendar Tab */}
        <button
          onClick={() => setActiveTab("CALENDAR")}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "CALENDAR"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Grid className="w-4 h-4" /> Calendar View
        </button>

        <button
          onClick={() => setActiveTab("DAILY")}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "DAILY"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Calendar className="w-4 h-4" /> Daily Ledger
        </button>

        <button
          onClick={() => setActiveTab("MONTHLY")}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "MONTHLY"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Monthly Summary
        </button>

        <button
          onClick={() => setActiveTab("MY_MEALS")}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "MY_MEALS"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <User className="w-4 h-4" /> My Meals Log
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "CALENDAR" && (
        <MealCalendarView
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          initialMonth={initialMonth}
        />
      )}

      {activeTab === "DAILY" && (
        <DailyMealLedger
          initialDate={initialDate}
          initialRecords={initialDailyData.records}
          canEdit={true}
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
