"use client";

import { useState, useTransition } from "react";
import { Calendar, Utensils, DollarSign, Calculator, FileSpreadsheet } from "lucide-react";
import { getMonthlyMealSummary } from "@/server/actions/mealActions";
import { toast } from "sonner";

interface UserMonthlySummary {
  userId: string;
  userName: string;
  userEmail: string;
  userMealStatus: boolean;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
  activeDays: number;
  estimatedMealCost: number;
}

interface MonthlyMealSummaryProps {
  initialMonth: string;
  initialSummary: {
    messTotalMeals: number;
    totalFoodExpense: number;
    estimatedMealRate: number;
    userSummaries: UserMonthlySummary[];
  };
}

export default function MonthlyMealSummary({ initialMonth, initialSummary }: MonthlyMealSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setLoading(true);
    startTransition(async () => {
      try {
        const res = await getMonthlyMealSummary(monthStr);
        setSummary(res as any);
      } catch (err: any) {
        toast.error("Failed to fetch monthly summary.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Month Selector & Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Monthly Meal & Expense Overview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated meal counts and estimated meal rate calculation for the month.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-transparent font-medium text-xs sm:text-sm focus:outline-none cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Mess Meals</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{summary.messTotalMeals}</div>
          <p className="text-xs text-slate-400 mt-1">Meals consumed by all members</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Food Expenses</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">৳{summary.totalFoodExpense.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Total bazaar & food expense</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Estimated Meal Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            ৳{summary.estimatedMealRate.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cost per meal (Food Expense / Total Meals)</p>
        </div>

      </div>

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {summary.userSummaries.map((u) => (
          <div key={u.userId} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-blue-400 font-bold flex items-center justify-center text-xs border border-slate-700">
                  {u.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{u.userName}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{u.userEmail}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Est. Cost</span>
                <span className="font-extrabold text-emerald-400 text-base">৳{u.estimatedMealCost.toFixed(0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-amber-400 font-bold block">B-Fast</span>
                <span className="font-bold text-slate-200">{u.breakfast}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block">Lunch</span>
                <span className="font-bold text-slate-200">{u.lunch}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-400 font-bold block">Dinner</span>
                <span className="font-bold text-slate-200">{u.dinner}</span>
              </div>
              <div className="bg-slate-900 rounded-lg py-0.5">
                <span className="text-[10px] text-blue-400 font-bold block">Total</span>
                <span className="font-extrabold text-white">{u.totalMeals}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-4 py-4 text-center">Breakfast</th>
                <th className="px-4 py-4 text-center">Lunch</th>
                <th className="px-4 py-4 text-center">Dinner</th>
                <th className="px-4 py-4 text-center">Total Meals</th>
                <th className="px-6 py-4 text-right">Estimated Food Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.userSummaries.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Member Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 font-semibold flex items-center justify-center text-xs border border-slate-700">
                        {u.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.userName}</div>
                        <div className="text-xs text-slate-400">{u.userEmail}</div>
                      </div>
                    </div>
                  </td>

                  {/* Breakfast */}
                  <td className="px-4 py-4 text-center font-medium text-amber-400">{u.breakfast}</td>

                  {/* Lunch */}
                  <td className="px-4 py-4 text-center font-medium text-emerald-400">{u.lunch}</td>

                  {/* Dinner */}
                  <td className="px-4 py-4 text-center font-medium text-indigo-400">{u.dinner}</td>

                  {/* Total Meals */}
                  <td className="px-4 py-4 text-center">
                    <span className="font-extrabold text-white bg-slate-800 px-3 py-1 rounded-full text-xs border border-slate-700">
                      {u.totalMeals}
                    </span>
                  </td>

                  {/* Estimated Cost */}
                  <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    ৳{u.estimatedMealCost.toFixed(2)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
