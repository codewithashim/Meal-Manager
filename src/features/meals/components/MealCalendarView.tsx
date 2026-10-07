"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Utensils,
  Sun,
  Moon,
  Coffee,
  Users,
  Loader2,
  Edit3,
  FileSpreadsheet,
  Grid,
  LayoutList,
  Minus,
  Plus,
} from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import { getMessMonthDailyRecords, bulkSaveDailyMeals } from "@/server/actions/mealActions";
import { getUsers } from "@/server/actions/userActions";
import { toast } from "sonner";

interface MealCalendarViewProps {
  currentUserId: string;
  currentUserRole: string;
  initialMonth: string;
}

export default function MealCalendarView({
  currentUserId,
  currentUserRole,
  initialMonth,
}: MealCalendarViewProps) {
  const isManagerOrAdmin = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";
  
  const [selectedMonth, setSelectedMonth] = useState(initialMonth); // YYYY-MM
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL"); // "ALL" or userId
  const [viewMode, setViewMode] = useState<"AGENDA" | "GRID">("AGENDA"); // "AGENDA" (mobile friendly list) or "GRID"
  
  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector / Edit Drawer State
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [dayInspectRecords, setDayInspectRecords] = useState<any[]>([]);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res: any = await getUsers();
        if (Array.isArray(res)) setMembers(res);
        else if (res && res.users) setMembers(res.users);
      } catch (err) {
        // ignore
      }
    }
    loadMembers();
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await getMessMonthDailyRecords(selectedMonth);
        if (isMounted) setRecords(data);
      } catch (err) {
        toast.error("Failed to load monthly meal records.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedMonth]);

  // Calendar Date Math
  const [yearNum, monthNum] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getDate();
  const firstDayOfWeek = new Date(Date.UTC(yearNum, monthNum - 1, 1)).getUTCDay(); // 0 = Sun

  const todayStr = new Date().toISOString().split("T")[0];

  const handlePrevMonth = () => {
    const prevDate = new Date(Date.UTC(yearNum, monthNum - 2, 1));
    const prevStr = prevDate.toISOString().substring(0, 7);
    setSelectedMonth(prevStr);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(Date.UTC(yearNum, monthNum, 1));
    const nextStr = nextDate.toISOString().substring(0, 7);
    setSelectedMonth(nextStr);
  };

  const handleTodayClick = () => {
    const curStr = new Date().toISOString().substring(0, 7);
    setSelectedMonth(curStr);
  };

  // Filter records by member if a specific user is selected
  const filteredRecords = selectedUserFilter === "ALL"
    ? records
    : records.filter((r) => r.userId === selectedUserFilter);

  // Group records by YYYY-MM-DD
  const dateRecordMap = new Map<string, any[]>();
  filteredRecords.forEach((r) => {
    const list = dateRecordMap.get(r.date) || [];
    list.push(r);
    dateRecordMap.set(r.date, list);
  });

  // Calculate Monthly KPIs
  const totalMealsMonth = filteredRecords.reduce((acc, r) => acc + r.totalMeals, 0);
  const activeDaysCount = dateRecordMap.size;
  const avgMealsPerDay = activeDaysCount > 0 ? (totalMealsMonth / activeDaysCount).toFixed(1) : "0.0";

  // Open Inspector Drawer for a date
  const handleDayClick = (dateStr: string) => {
    setSelectedDayDate(dateStr);
    
    // Find records for this date
    const dayRecords = records.filter((r) => r.date === dateStr);
    
    // Build inspection items for all active members
    const activeMembers = members.length > 0 ? members : [{ id: currentUserId, name: "You" }];
    const combined = activeMembers.map((m) => {
      const existing = dayRecords.find((r) => r.userId === m.id);
      return {
        userId: m.id,
        userName: m.name,
        breakfast: existing ? existing.breakfast : m.mealStatus ? 1 : 0,
        lunch: existing ? existing.lunch : m.mealStatus ? 1 : 0,
        dinner: existing ? existing.dinner : m.mealStatus ? 1 : 0,
        totalMeals: existing ? existing.totalMeals : m.mealStatus ? 3 : 0,
        note: existing?.note || "",
      };
    });

    setDayInspectRecords(combined);
    setEditingModalOpen(true);
  };

  // Save Day Edits
  const handleSaveDayEdits = async () => {
    if (!selectedDayDate) return;
    setSaving(true);
    try {
      const res = await bulkSaveDailyMeals({
        date: selectedDayDate,
        records: dayInspectRecords.map((r) => ({
          userId: r.userId,
          breakfast: Number(r.breakfast),
          lunch: Number(r.lunch),
          dinner: Number(r.dinner),
          note: r.note,
        })),
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Updated meal entries for ${selectedDayDate}`);
        setEditingModalOpen(false);
        // Refresh records
        const fresh = await getMessMonthDailyRecords(selectedMonth);
        setRecords(fresh);
      }
    } catch (err) {
      toast.error("Failed to save meal record updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Controls & Month Navigator Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-xl">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Month & Nav Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleTodayClick}
                className="px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={handleNextMonth}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              {new Date(Date.UTC(yearNum, monthNum - 1, 1)).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          {/* Member Filter Selector & View Mode Switcher */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* View Switcher (Agenda vs Grid) */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("AGENDA")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "AGENDA"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Mobile Agenda List View"
              >
                <LayoutList className="w-3.5 h-3.5" /> Agenda
              </button>
              <button
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="7-Day Calendar Grid View"
              >
                <Grid className="w-3.5 h-3.5" /> Grid
              </button>
            </div>

            {/* Member Filter Dropdown */}
            <div className="relative flex-1 sm:w-52">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">🌐 All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Quick Month KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-950/70 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Meals</div>
              <div className="text-sm sm:text-base font-bold text-white">{totalMealsMonth} meals</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Days</div>
              <div className="text-sm sm:text-base font-bold text-white">{activeDaysCount} days</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Avg</div>
              <div className="text-sm sm:text-base font-bold text-white">{avgMealsPerDay} / day</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Members Count</div>
              <div className="text-sm sm:text-base font-bold text-white">{members.length || 1} Members</div>
            </div>
          </div>

        </div>

      </div>

      {/* Main Monthly Content View */}
      {loading ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center justify-center gap-3 text-slate-400 border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Loading meal calendar...</span>
        </div>
      ) : viewMode === "AGENDA" ? (
        
        /* 📱 MOBILE AGENDA LIST VIEW (100% Mobile Friendly) */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Daily Meals Agenda ({selectedMonth})</span>
            <span className="text-[11px] text-emerald-400 font-normal">Tap any day to inspect & edit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const padDayStr = String(dayNum).padStart(2, "0");
              const dateStr = `${selectedMonth}-${padDayStr}`;
              const isToday = dateStr === todayStr;

              const dateObj = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

              const dayRecords = dateRecordMap.get(dateStr) || [];
              const totalDayMeals = dayRecords.reduce((acc, r) => acc + r.totalMeals, 0);
              const totalB = dayRecords.reduce((acc, r) => acc + r.breakfast, 0);
              const totalL = dayRecords.reduce((acc, r) => acc + r.lunch, 0);
              const totalD = dayRecords.reduce((acc, r) => acc + r.dinner, 0);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`glass-card rounded-2xl p-4 border transition cursor-pointer space-y-3 shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    isToday
                      ? "bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/80 shadow-emerald-950/40"
                      : totalDayMeals > 0
                      ? "border-slate-800 hover:border-slate-700 bg-slate-900/90"
                      : "border-slate-800/60 bg-slate-950/40 opacity-70"
                  }`}
                >
                  {/* Top Bar: Date, Day, Today Badge, Total Meals */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-black px-2.5 py-1 rounded-xl font-mono ${
                          isToday ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-white"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <div>
                        <span className="font-bold text-white text-xs">{dayName}</span>
                        <span className="text-[10px] text-slate-400 block">{dateStr}</span>
                      </div>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black border ${
                          totalDayMeals > 0
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}
                      >
                        {totalDayMeals.toFixed(selectedUserFilter === "ALL" ? 0 : 1)} meals
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Meal Breakdown Pills */}
                  {totalDayMeals > 0 ? (
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-1.5">
                        <span className="text-[10px] text-amber-400 font-bold block">Breakfast</span>
                        <span className="font-bold text-amber-300 text-sm">🍳 {totalB}</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5">
                        <span className="text-[10px] text-emerald-400 font-bold block">Lunch</span>
                        <span className="font-bold text-emerald-300 text-sm">🍲 {totalL}</span>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-1.5">
                        <span className="text-[10px] text-indigo-400 font-bold block">Dinner</span>
                        <span className="font-bold text-indigo-300 text-sm">🌙 {totalD}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-1.5 italic bg-slate-950/40 rounded-xl border border-slate-900">
                      No meals logged for this day
                    </div>
                  )}

                  {/* Footer: User count */}
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>{dayRecords.length} active member entries</span>
                    <span className="text-blue-400 font-medium hover:underline">Inspect Drawer &rarr;</span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* 📅 7-DAY CALENDAR GRID VIEW */
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[680px]">
              
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <div className="py-2 text-rose-400">Sun</div>
                <div className="py-2">Mon</div>
                <div className="py-2">Tue</div>
                <div className="py-2">Wed</div>
                <div className="py-2">Thu</div>
                <div className="py-2">Fri</div>
                <div className="py-2 text-emerald-400">Sat</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                
                {/* Blank padding days */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[100px] bg-slate-950/30 rounded-xl border border-slate-900/60 p-2 text-slate-700 opacity-40 select-none"
                  />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const padDayStr = String(dayNum).padStart(2, "0");
                  const dateStr = `${selectedMonth}-${padDayStr}`;
                  const isToday = dateStr === todayStr;

                  const dayRecords = dateRecordMap.get(dateStr) || [];
                  const totalDayMeals = dayRecords.reduce((acc, r) => acc + r.totalMeals, 0);
                  const totalB = dayRecords.reduce((acc, r) => acc + r.breakfast, 0);
                  const totalL = dayRecords.reduce((acc, r) => acc + r.lunch, 0);
                  const totalD = dayRecords.reduce((acc, r) => acc + r.dinner, 0);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className={`min-h-[105px] p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between group ${
                        isToday
                          ? "bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/50"
                          : totalDayMeals > 0
                          ? "bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/60 hover:bg-slate-900 border-slate-900/80 text-slate-500"
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                            isToday
                              ? "bg-emerald-500 text-slate-950 font-black"
                              : "text-white group-hover:text-emerald-400"
                          }`}
                        >
                          {dayNum}
                        </span>

                        {totalDayMeals > 0 && (
                          <span className="font-extrabold text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                            {totalDayMeals.toFixed(selectedUserFilter === "ALL" ? 0 : 1)}
                          </span>
                        )}
                      </div>

                      {/* Meal Chips */}
                      {totalDayMeals > 0 ? (
                        <div className="space-y-1 my-1">
                          <div className="grid grid-cols-3 gap-0.5 text-[9px] font-semibold text-center">
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded py-0.5" title="Breakfast">
                              🍳 {totalB}
                            </span>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded py-0.5" title="Lunch">
                              🍲 {totalL}
                            </span>
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded py-0.5" title="Dinner">
                              🌙 {totalD}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 text-center py-2 italic font-mono">
                          No Meals
                        </div>
                      )}

                      {/* Footer Action Hint */}
                      <div className="text-[9px] text-slate-500 group-hover:text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/40">
                        <span>{dayRecords.length > 0 ? `${dayRecords.length} users` : "Off"}</span>
                        <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-emerald-400" />
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>
          </div>
        </div>

      )}

      {/* Reusable AppDrawer for Daily Inspector */}
      <AppDrawer
        isOpen={editingModalOpen && !!selectedDayDate}
        onClose={() => setEditingModalOpen(false)}
        icon={<CalendarIcon className="w-5 h-5" />}
        title={`Daily Meal Inspector: ${selectedDayDate}`}
        subtitle="Tap + or - to update Breakfast, Lunch & Dinner for members."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDayEdits}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {dayInspectRecords.map((item, idx) => (
            <div
              key={item.userId}
              className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="font-bold text-white text-sm block">{item.userName}</span>
                <span className="text-xs text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  Total: {item.breakfast + item.lunch + item.dinner} meals
                </span>
              </div>

              {/* Meal Steppers: Breakfast, Lunch, Dinner */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                
                {/* Breakfast */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-0.5">
                    <Coffee className="w-3 h-3" /> Breakfast
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        const cur = next[idx].breakfast;
                        next[idx].breakfast = Math.max(0, cur - 0.5);
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-extrabold text-amber-400 text-xs">
                      {item.breakfast}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        next[idx].breakfast += 0.5;
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Lunch */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                    <Sun className="w-3 h-3" /> Lunch
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        const cur = next[idx].lunch;
                        next[idx].lunch = Math.max(0, cur - 0.5);
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-extrabold text-emerald-400 text-xs">
                      {item.lunch}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        next[idx].lunch += 0.5;
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Dinner */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-0.5">
                    <Moon className="w-3 h-3" /> Dinner
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        const cur = next[idx].dinner;
                        next[idx].dinner = Math.max(0, cur - 0.5);
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-extrabold text-indigo-400 text-xs">
                      {item.dinner}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...dayInspectRecords];
                        next[idx].dinner += 0.5;
                        setDayInspectRecords(next);
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </AppDrawer>

    </div>
  );
}
