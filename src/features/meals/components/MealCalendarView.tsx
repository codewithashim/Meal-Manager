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
  User,
  Users,
  Loader2,
  X,
  Edit3,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { getMessMonthDailyRecords, saveSingleMealRecord, bulkSaveDailyMeals } from "@/server/actions/mealActions";
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
  
  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector / Edit Modal State
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

  // Open Inspector Modal for a date
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
    <div className="space-y-6">
      
      {/* Top Controls & Month Navigator Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Month & Nav Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
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

            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              {new Date(Date.UTC(yearNum, monthNum - 1, 1)).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          {/* Member Filter Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium shrink-0">Filter Member:</span>
            <div className="relative w-full sm:w-56">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">🌐 All Mess Members Combined</option>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Meals</div>
              <div className="text-base font-bold text-white">{totalMealsMonth} meals</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Days</div>
              <div className="text-base font-bold text-white">{activeDaysCount} days</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Avg</div>
              <div className="text-base font-bold text-white">{avgMealsPerDay} / day</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Members Count</div>
              <div className="text-base font-bold text-white">{members.length || 1} Members</div>
            </div>
          </div>

        </div>

      </div>

      {/* Main Monthly Interactive Calendar Grid */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm font-medium">Loading meal calendar...</span>
          </div>
        ) : (
          <div>
            
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
              
              {/* Padding blank days before 1st of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`pad-${i}`}
                  className="min-h-[90px] sm:min-h-[110px] bg-slate-950/30 rounded-xl border border-slate-900/60 p-2 text-slate-700 opacity-40 select-none"
                />
              ))}

              {/* Month Days (1 to N) */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const padDayStr = String(dayNum).padStart(2, "0");
                const dateStr = `${selectedMonth}-${padDayStr}`;
                const isToday = dateStr === todayStr;

                const dayRecords = dateRecordMap.get(dateStr) || [];
                
                // Aggregate day totals
                const totalDayMeals = dayRecords.reduce((acc, r) => acc + r.totalMeals, 0);
                const totalB = dayRecords.reduce((acc, r) => acc + r.breakfast, 0);
                const totalL = dayRecords.reduce((acc, r) => acc + r.lunch, 0);
                const totalD = dayRecords.reduce((acc, r) => acc + r.dinner, 0);

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`min-h-[95px] sm:min-h-[115px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between group ${
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

                      {isToday && (
                        <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Today
                        </span>
                      )}

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
        )}

      </div>

      {/* Day Inspector & Quick Edit Modal */}
      {editingModalOpen && selectedDayDate && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
            onClick={() => setEditingModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl glass-card rounded-3xl p-5 sm:p-7 border border-slate-700/80 shadow-2xl text-slate-100 animate-scaleUp z-10 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Daily Meal Inspector: {selectedDayDate}
                  </h3>
                  <p className="text-xs text-slate-400">
                    View or update Breakfast, Lunch & Dinner counts for mess members.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Meal List */}
            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {dayInspectRecords.map((item, idx) => (
                <div
                  key={item.userId}
                  className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-white text-sm block">{item.userName}</span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      Total: {item.breakfast + item.lunch + item.dinner} meals
                    </span>
                  </div>

                  {/* Meal Counts Input Controls */}
                  <div className="flex items-center gap-2">
                    
                    {/* Breakfast */}
                    <div className="text-center">
                      <span className="text-[10px] text-amber-400 font-semibold block mb-0.5 flex items-center justify-center gap-0.5">
                        <Coffee className="w-3 h-3" /> B
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={item.breakfast}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...dayInspectRecords];
                          next[idx].breakfast = val;
                          next[idx].totalMeals = val + next[idx].lunch + next[idx].dinner;
                          setDayInspectRecords(next);
                        }}
                        className="w-14 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Lunch */}
                    <div className="text-center">
                      <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5 flex items-center justify-center gap-0.5">
                        <Sun className="w-3 h-3" /> L
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={item.lunch}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...dayInspectRecords];
                          next[idx].lunch = val;
                          next[idx].totalMeals = next[idx].breakfast + val + next[idx].dinner;
                          setDayInspectRecords(next);
                        }}
                        className="w-14 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Dinner */}
                    <div className="text-center">
                      <span className="text-[10px] text-indigo-400 font-semibold block mb-0.5 flex items-center justify-center gap-0.5">
                        <Moon className="w-3 h-3" /> D
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={item.dinner}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...dayInspectRecords];
                          next[idx].dinner = val;
                          next[idx].totalMeals = next[idx].breakfast + next[idx].lunch + val;
                          setDayInspectRecords(next);
                        }}
                        className="w-14 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveDayEdits}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
