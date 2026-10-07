"use client";

import { useState, useTransition } from "react";
import { Calendar, ChevronLeft, ChevronRight, Save, Loader2, Plus, Minus, Utensils } from "lucide-react";
import { getDailyMeals, bulkSaveDailyMeals } from "@/server/actions/mealActions";
import { toast } from "sonner";

interface DailyRecordItem {
  userId: string;
  userName: string;
  userEmail: string;
  userMealStatus: boolean;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  note: string;
}

interface DailyMealLedgerProps {
  initialDate: string;
  initialRecords: DailyRecordItem[];
  canEdit: boolean;
}

export default function DailyMealLedger({ initialDate, initialRecords, canEdit }: DailyMealLedgerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [records, setRecords] = useState<DailyRecordItem[]>(initialRecords);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchDailyData = (dateStr: string) => {
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await getDailyMeals(dateStr);
        setRecords(res.records as any);
      } catch (err: any) {
        toast.error("Failed to fetch meal data.");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchDailyData(newDate);
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const dateStr = current.toISOString().split("T")[0];
    handleDateChange(dateStr);
  };

  const handleMealChange = (userId: string, field: "breakfast" | "lunch" | "dinner", value: number) => {
    const safeVal = Math.max(0, value);
    setRecords((prev) =>
      prev.map((item) => {
        if (item.userId === userId) {
          const updated = { ...item, [field]: safeVal };
          updated.totalMeals = updated.breakfast + updated.lunch + updated.dinner;
          return updated;
        }
        return item;
      })
    );
  };

  const handleStepMeal = (userId: string, field: "breakfast" | "lunch" | "dinner", step: number) => {
    setRecords((prev) =>
      prev.map((item) => {
        if (item.userId === userId) {
          const newCount = Math.max(0, item[field] + step);
          const updated = { ...item, [field]: newCount };
          updated.totalMeals = updated.breakfast + updated.lunch + updated.dinner;
          return updated;
        }
        return item;
      })
    );
  };

  const handleSetAllForUser = (userId: string, count: number) => {
    setRecords((prev) =>
      prev.map((item) => {
        if (item.userId === userId) {
          const updated = { ...item, breakfast: count, lunch: count, dinner: count };
          updated.totalMeals = count * 3;
          return updated;
        }
        return item;
      })
    );
  };

  const handleBatchSetAllActive = (count: number) => {
    setRecords((prev) =>
      prev.map((item) => {
        if (item.userMealStatus) {
          return {
            ...item,
            breakfast: count,
            lunch: count,
            dinner: count,
            totalMeals: count * 3,
          };
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date: selectedDate,
        records: records.map((r) => ({
          userId: r.userId,
          breakfast: r.breakfast,
          lunch: r.lunch,
          dinner: r.dinner,
          note: r.note,
        })),
      };

      const res = await bulkSaveDailyMeals(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Saved daily meals for ${selectedDate}`);
      }
    } catch (err: any) {
      toast.error("Failed to save meal records.");
    } finally {
      setSaving(false);
    }
  };

  const totalBreakfast = records.reduce((acc, r) => acc + r.breakfast, 0);
  const totalLunch = records.reduce((acc, r) => acc + r.lunch, 0);
  const totalDinner = records.reduce((acc, r) => acc + r.dinner, 0);
  const totalDayMeals = records.reduce((acc, r) => acc + r.totalMeals, 0);

  return (
    <div className="space-y-6">
      
      {/* Date Navigation & Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2 text-white">
            <Calendar className="w-4 h-4 text-blue-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent font-medium text-xs sm:text-sm focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleDateChange(new Date().toISOString().split("T")[0])}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Quick Actions & Save Button */}
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            <button
              onClick={() => handleBatchSetAllActive(1)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              All Standard (1)
            </button>
            <button
              onClick={() => handleBatchSetAllActive(0)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Reset All (0)
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Day's Ledger
            </button>
          </div>
        )}
      </div>

      {/* Daily Meal Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Breakfast</span>
          <div className="text-xl font-bold text-amber-400 mt-0.5">{totalBreakfast}</div>
        </div>
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Lunch</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{totalLunch}</div>
        </div>
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium uppercase">Dinner</span>
          <div className="text-xl font-bold text-indigo-400 mt-0.5">{totalDinner}</div>
        </div>
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center border border-slate-800/80 bg-blue-900/10">
          <span className="text-[11px] text-blue-400 font-medium uppercase">Total Daily Meals</span>
          <div className="text-xl font-extrabold text-blue-400 mt-0.5">{totalDayMeals}</div>
        </div>
      </div>

      {/* Native Mobile Stepper Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {records.map((r) => (
          <div
            key={r.userId}
            className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg"
          >
            {/* Header: Member info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-blue-400 font-bold flex items-center justify-center text-xs border border-slate-700">
                  {r.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm leading-tight">{r.userName}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{r.userEmail}</div>
                </div>
              </div>

              <span className="font-extrabold text-white bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs">
                Total: {r.totalMeals}
              </span>
            </div>

            {/* Steppers Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              
              {/* Breakfast Stepper */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Breakfast</span>
                {canEdit ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "breakfast", -0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-amber-400 text-sm">{r.breakfast}</span>
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "breakfast", 0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-amber-400 text-sm">{r.breakfast}</span>
                )}
              </div>

              {/* Lunch Stepper */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Lunch</span>
                {canEdit ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "lunch", -0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-emerald-400 text-sm">{r.lunch}</span>
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "lunch", 0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-emerald-400 text-sm">{r.lunch}</span>
                )}
              </div>

              {/* Dinner Stepper */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Dinner</span>
                {canEdit ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "dinner", -0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-indigo-400 text-sm">{r.dinner}</span>
                    <button
                      type="button"
                      onClick={() => handleStepMeal(r.userId, "dinner", 0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-indigo-400 text-sm">{r.dinner}</span>
                )}
              </div>

            </div>

            {/* Quick Set buttons for user */}
            {canEdit && (
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetAllForUser(r.userId, 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  1 each
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllForUser(r.userId, 0)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                >
                  Off
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Member Name</th>
                <th className="px-4 py-4 text-center">Breakfast</th>
                <th className="px-4 py-4 text-center">Lunch</th>
                <th className="px-4 py-4 text-center">Dinner</th>
                <th className="px-4 py-4 text-center">Total</th>
                {canEdit && <th className="px-6 py-4 text-right">Quick Set</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((r) => (
                <tr key={r.userId} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 font-semibold flex items-center justify-center text-xs border border-slate-700">
                        {r.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{r.userName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{r.userEmail}</span>
                          {!r.userMealStatus && (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Meals Paused
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Breakfast */}
                  <td className="px-4 py-4 text-center">
                    {canEdit ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={r.breakfast}
                        onChange={(e) => handleMealChange(r.userId, "breakfast", parseFloat(e.target.value) || 0)}
                        className="w-16 text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-amber-400 focus:outline-none focus:border-amber-400"
                      />
                    ) : (
                      <span className="font-semibold text-amber-400">{r.breakfast}</span>
                    )}
                  </td>

                  {/* Lunch */}
                  <td className="px-4 py-4 text-center">
                    {canEdit ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={r.lunch}
                        onChange={(e) => handleMealChange(r.userId, "lunch", parseFloat(e.target.value) || 0)}
                        className="w-16 text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-400"
                      />
                    ) : (
                      <span className="font-semibold text-emerald-400">{r.lunch}</span>
                    )}
                  </td>

                  {/* Dinner */}
                  <td className="px-4 py-4 text-center">
                    {canEdit ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={r.dinner}
                        onChange={(e) => handleMealChange(r.userId, "dinner", parseFloat(e.target.value) || 0)}
                        className="w-16 text-center py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-indigo-400 focus:outline-none focus:border-indigo-400"
                      />
                    ) : (
                      <span className="font-semibold text-indigo-400">{r.dinner}</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-4 text-center">
                    <span className="font-extrabold text-white bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">
                      {r.totalMeals}
                    </span>
                  </td>

                  {/* Quick Set */}
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetAllForUser(r.userId, 1)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
                        >
                          1 each
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAllForUser(r.userId, 0)}
                          className="px-2.5 py-1 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        >
                          Off
                        </button>
                      </div>
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
