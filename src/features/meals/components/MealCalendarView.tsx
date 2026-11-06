"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Utensils,
  Users,
  Loader2,
  Edit3,
  FileSpreadsheet,
  Grid,
  LayoutList,
} from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import MealDayEditor from "@/features/meals/components/MealDayEditor";
import { getDailyMeals, getMessMonthDailyRecords, bulkSaveDailyMeals } from "@/server/actions/mealActions";
import { toast } from "sonner";

interface MealCalendarViewProps {
  currentUserRole: string;
  initialMonth: string;
}

type CalendarRecord = Awaited<ReturnType<typeof getMessMonthDailyRecords>>[number];
type DailyRecord = Awaited<ReturnType<typeof getDailyMeals>>["records"][number];
type Member = { id: string; name: string };

export default function MealCalendarView({
  currentUserRole,
  initialMonth,
}: MealCalendarViewProps) {
  const isManagerOrAdmin = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";
  
  const [selectedMonth, setSelectedMonth] = useState(initialMonth); // YYYY-MM
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"AGENDA" | "GRID">("AGENDA"); // "AGENDA" (mobile friendly list) or "GRID"
  
  const [records, setRecords] = useState<CalendarRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inspecting, setInspecting] = useState(false);

  // Inspector / Edit Drawer State
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [dayInspectRecords, setDayInspectRecords] = useState<DailyRecord[]>([]);
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMembers() {
      try {
        const result = await getDailyMeals();
        if (isMounted) {
          setMembers(result.records.map((record) => ({
            id: record.userId,
            name: record.userName,
          })));
        }
      } catch {
        if (isMounted) toast.error("Failed to load meal participants. Reload the page to try again.");
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getMessMonthDailyRecords(selectedMonth);
        if (isMounted) setRecords(data);
      } catch {
        if (isMounted) {
          setRecords([]);
          setLoadError(true);
          toast.error("Failed to load monthly meal records.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedMonth, refreshKey]);

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
  const dateRecordMap = new Map<string, CalendarRecord[]>();
  filteredRecords.forEach((r) => {
    const list = dateRecordMap.get(r.date) || [];
    list.push(r);
    dateRecordMap.set(r.date, list);
  });

  // Calculate Monthly KPIs
  const totalMealsMonth = filteredRecords.reduce((acc, r) => acc + r.totalMeals, 0);
  const activeDaysCount = [...dateRecordMap.values()].filter((day) => day.some((record) => record.totalMeals > 0)).length;
  const avgMealsPerDay = activeDaysCount > 0 ? (totalMealsMonth / activeDaysCount).toFixed(1) : "0.0";

  // Open Inspector Drawer for a date
  const handleDayClick = async (dateStr: string) => {
    if (inspecting || loading) return;
    setInspecting(true);
    try {
      const result = await getDailyMeals(dateStr);
      const available = selectedUserFilter === "ALL"
        ? result.records
        : result.records.filter((record) => record.userId === selectedUserFilter);
      if (available.length === 0) {
        toast.error("No active meal participant is available for this day.");
        return;
      }
      setSelectedDayDate(dateStr);
      setDayInspectRecords(available);
      setEditingModalOpen(true);
    } catch {
      toast.error("Failed to load daily meal entries.");
    } finally {
      setInspecting(false);
    }
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
        try {
          const fresh = await getMessMonthDailyRecords(selectedMonth);
          setRecords(fresh);
        } catch {
          setRecords([]);
          setLoadError(true);
          toast.error("Meals were saved, but the calendar could not be refreshed.");
        }
      }
    } catch {
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
                disabled={inspecting}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleTodayClick}
                disabled={inspecting}
                className="px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={handleNextMonth}
                disabled={inspecting}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 min-w-0">
              <CalendarIcon className="w-5 h-5 text-emerald-400 shrink-0" />
              {new Date(Date.UTC(yearNum, monthNum - 1, 1)).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
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
            {isManagerOrAdmin && <div className="relative flex-1 sm:w-52">
              <select
                aria-label="Filter by member"
                disabled={loadingMembers || inspecting}
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
            </div>}

          </div>

        </div>

        {/* Quick Month KPIs */}
        {!loading && !loadError && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          
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

          {isManagerOrAdmin && <div className="bg-slate-950/70 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Members Count</div>
              <div className="text-sm sm:text-base font-bold text-white">{loadingMembers ? "Loading..." : `${members.length} Members`}</div>
            </div>
          </div>}

        </div>}

      </div>

      {/* Main Monthly Content View */}
      {loading ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center justify-center gap-3 text-slate-400 border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Loading meal calendar...</span>
        </div>
      ) : loadError ? (
        <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
          <p>Could not load the meal calendar.</p>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white">Try again</button>
        </div>
      ) : viewMode === "AGENDA" ? (
        
        /* 📱 MOBILE AGENDA LIST VIEW (100% Mobile Friendly) */
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
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
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

              const dayRecords = dateRecordMap.get(dateStr) || [];
              const totalDayMeals = dayRecords.reduce((acc, r) => acc + r.totalMeals, 0);
              const totalB = dayRecords.reduce((acc, r) => acc + r.breakfast, 0);
              const totalL = dayRecords.reduce((acc, r) => acc + r.lunch, 0);
              const totalD = dayRecords.reduce((acc, r) => acc + r.dinner, 0);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit meals for ${dateStr}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void handleDayClick(dateStr);
                    }
                  }}
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
                        {totalDayMeals} meals
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
                    <span>{isManagerOrAdmin ? `${dayRecords.length} member entries` : dayRecords.length ? "Meals recorded" : "Not recorded"}</span>
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
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit meals for ${dateStr}`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void handleDayClick(dateStr);
                        }
                      }}
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
                            {totalDayMeals}
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
                        <span>{dayRecords.length > 0 ? (isManagerOrAdmin ? `${dayRecords.length} users` : "Recorded") : "Not recorded"}</span>
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

      <AppDrawer
        isOpen={editingModalOpen && !!selectedDayDate}
        onClose={() => { if (!saving) setEditingModalOpen(false); }}
        icon={<CalendarIcon className="w-5 h-5" />}
        title="Edit daily meals"
        subtitle={selectedDayDate ? new Date(`${selectedDayDate}T00:00:00Z`).toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }) : ""}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingModalOpen(false)}
              disabled={saving}
              className="min-h-11 flex-1 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-40 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDayEdits}
              disabled={saving}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50 sm:flex-none"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save meals"}
            </button>
          </div>
        }
      >
        <MealDayEditor
          records={dayInspectRecords}
          onChange={setDayInspectRecords}
          disabled={saving}
          isManagerOrAdmin={isManagerOrAdmin}
        />
      </AppDrawer>

    </div>
  );
}
