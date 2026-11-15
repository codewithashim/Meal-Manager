"use client";

import { useState } from "react";
import DailyMealLedger from "@/features/meals/components/DailyMealLedger";
import MonthlyMealSummary from "@/features/meals/components/MonthlyMealSummary";
import UserMealCalendar from "@/features/meals/components/UserMealCalendar";
import MealCalendarView from "@/features/meals/components/MealCalendarView";
import MonthSelector from "@/shared/components/ui/MonthSelector";
import { setMonthInUrl } from "@/shared/hooks/useMonthParam";
import { getDefaultDateForMonth } from "@/lib/month";
import { UtensilsCrossed, Calendar, FileSpreadsheet, User, Grid } from "lucide-react";
import type { getDailyMeals, getMonthlyMealSummary } from "@/server/actions/mealActions";

interface MealClientPageProps {
  currentUserId: string;
  currentUserRole: string;
  initialDailyData: Awaited<ReturnType<typeof getDailyMeals>>;
  initialMonthlyData: Awaited<ReturnType<typeof getMonthlyMealSummary>> | null;
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
  // One month drives every tab, so switching tabs never loses the selection.
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setMonthInUrl(monthStr);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-28 lg:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            Meal Ledger & Interactive Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isManagerOrAdmin
              ? "Track daily meal counts, view monthly calendars, and monitor mess meal rates."
              : "View and update your own daily meals."}
          </p>
        </div>

        <MonthSelector
          value={selectedMonth}
          onChange={handleMonthChange}
          className="w-full sm:w-auto justify-between"
        />
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

        {isManagerOrAdmin && <button
          onClick={() => setActiveTab("MONTHLY")}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
            activeTab === "MONTHLY"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Monthly Summary
        </button>}

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
          currentUserRole={currentUserRole}
          month={selectedMonth}
        />
      )}

      {activeTab === "DAILY" && (
        <DailyMealLedger
          key={selectedMonth}
          month={selectedMonth}
          initialDate={initialDate.startsWith(selectedMonth) ? initialDate : getDefaultDateForMonth(selectedMonth)}
          initialRecords={initialDailyData.records}
          canEdit={true}
        />
      )}

      {activeTab === "MONTHLY" && initialMonthlyData && (
        <MonthlyMealSummary
          key={selectedMonth}
          month={selectedMonth}
          initialSummary={initialMonthlyData}
        />
      )}

      {activeTab === "MY_MEALS" && (
        <UserMealCalendar
          userId={currentUserId}
          month={selectedMonth}
        />
      )}

    </div>
  );
}
