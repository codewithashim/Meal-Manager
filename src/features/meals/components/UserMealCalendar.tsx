"use client";

import { useState, useEffect } from "react";
import { Calendar, Utensils } from "lucide-react";
import { getUserMealHistory } from "@/server/actions/mealActions";
import { toast } from "sonner";

interface UserMealCalendarProps {
  userId: string;
  initialMonth: string;
}

export default function UserMealCalendar({ userId, initialMonth }: UserMealCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await getUserMealHistory(userId, selectedMonth);
        if (isMounted) setRecords(data);
      } catch (err: any) {
        toast.error("Failed to load your meal history.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [userId, selectedMonth]);

  const totalMonthMeals = records.reduce((acc, r) => acc + r.totalMeals, 0);

  return (
    <div className="space-y-6">
      
      {/* Header & Month Picker */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-400" />
            My Personal Meal Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily breakdown of your recorded meals for the month.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-blue-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-xs sm:text-sm focus:outline-none cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Stats Pill */}
      <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase">Your Total Meals this Month</div>
            <div className="text-xl font-bold text-white">{totalMonthMeals} meals</div>
          </div>
        </div>
      </div>

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {records.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No meal records found for this month.
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-white">{r.date}</span>
                <span className="font-extrabold text-white bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-0.5 rounded-full text-xs">
                  Day Total: {r.totalMeals}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">Breakfast</span>
                  <span className="font-bold text-slate-200">{r.breakfast}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold block">Lunch</span>
                  <span className="font-bold text-slate-200">{r.lunch}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold block">Dinner</span>
                  <span className="font-bold text-slate-200">{r.dinner}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-4 py-4 text-center">Breakfast</th>
                <th className="px-4 py-4 text-center">Lunch</th>
                <th className="px-4 py-4 text-center">Dinner</th>
                <th className="px-4 py-4 text-center">Total Meals</th>
                <th className="px-6 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No meal records found for this month.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-white">{r.date}</td>
                    <td className="px-4 py-4 text-center text-amber-400 font-semibold">{r.breakfast}</td>
                    <td className="px-4 py-4 text-center text-emerald-400 font-semibold">{r.lunch}</td>
                    <td className="px-4 py-4 text-center text-indigo-400 font-semibold">{r.dinner}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">
                        {r.totalMeals}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{r.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
