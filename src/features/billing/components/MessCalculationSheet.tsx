"use client";

import {
  Utensils,
  Zap,
  Flame,
  Droplets,
  UserCheck,
  Wifi,
  PlusCircle,
  Users,
  PieChart,
  Calculator,
  HelpCircle,
} from "lucide-react";

interface MessCalculationSheetProps {
  summary: {
    activeMembersCount: number;
    totalMessMeals: number;
    mealRate: number;
    totalFoodExpense: number;
    totalElectricity: number;
    totalGas: number;
    totalWater: number;
    totalKhala: number;
    totalWifi: number;
    totalOther: number;
    totalRent: number;
    perMemberElectricity: number;
    perMemberGas: number;
    perMemberWater: number;
    perMemberKhala: number;
    perMemberWifi: number;
    perMemberOther: number;
  };
  monthStr: string;
}

export default function MessCalculationSheet({ summary, monthStr }: MessCalculationSheetProps) {
  if (!summary) return null;

  const totalSharedUtilityPerMember =
    summary.perMemberElectricity +
    summary.perMemberGas +
    summary.perMemberWater +
    summary.perMemberKhala +
    summary.perMemberWifi +
    summary.perMemberOther;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-5 shadow-xl bg-gradient-to-b from-slate-900/90 to-slate-950/90">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Mess Master Calculation & Cost Breakdown (মেসের সার্বিক হিসাব)
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {monthStr}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Clear itemized mess expenses split equally among {summary.activeMembersCount} active members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 self-start sm:self-auto">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Active Members: <strong className="text-white font-bold">{summary.activeMembersCount} জন</strong></span>
        </div>
      </div>

      {/* Grid of Key Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Meal & Food Formula */}
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-4 h-4" /> Food & Meal Rate (মিল রেট)
            </span>
            <span className="text-xs font-bold text-amber-400">
              ৳{summary.mealRate.toFixed(2)} / meal
            </span>
          </div>
          
          <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Food Spent:</span>
              <span className="font-semibold text-white">৳{summary.totalFoodExpense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Meals Eaten:</span>
              <span className="font-semibold text-white">{summary.totalMessMeals} meals</span>
            </div>
            <div className="text-[11px] text-amber-400/90 pt-1.5 border-t border-slate-800 mt-1 font-mono">
              Meal Rate = ৳{summary.totalFoodExpense.toLocaleString()} ÷ {summary.totalMessMeals || 1} = ৳{summary.mealRate.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 2. Shared Utilities Split */}
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4" /> Shared Utilities (ইউটিলিটি)
            </span>
            <span className="text-xs font-bold text-purple-400">
              ৳{Math.round(totalSharedUtilityPerMember)} / member
            </span>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Electricity (বিদ্যুৎ):</span>
              <span className="font-semibold text-white">৳{summary.perMemberElectricity.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gas Bill (গ্যাস):</span>
              <span className="font-semibold text-white">৳{summary.perMemberGas.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Water & WiFi (পানি ও ইন্টারনেট):</span>
              <span className="font-semibold text-white">
                ৳{(summary.perMemberWater + summary.perMemberWifi).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Khala & House Management */}
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Maid & House Rent (খালা ও বাসা)
            </span>
            <span className="text-xs font-bold text-pink-400">
              ৳{Math.round(summary.perMemberKhala + summary.perMemberOther)} / member
            </span>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Khala (Cook) Salary:</span>
              <span className="font-semibold text-white">৳{summary.perMemberKhala.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">House Rent Total:</span>
              <span className="font-semibold text-white">৳{summary.totalRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Other Maintenance:</span>
              <span className="font-semibold text-white">৳{summary.perMemberOther.toFixed(0)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Itemized Quick Icons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
        
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" /> Electricity (বিদ্যুৎ)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberElectricity.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalElectricity}</span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-orange-400 font-semibold flex items-center justify-center gap-1">
            <Flame className="w-3 h-3" /> Gas (গ্যাস)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberGas.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalGas}</span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-cyan-400 font-semibold flex items-center justify-center gap-1">
            <Droplets className="w-3 h-3" /> Water (পানি)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberWater.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalWater}</span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-pink-400 font-semibold flex items-center justify-center gap-1">
            <UserCheck className="w-3 h-3" /> Khala (খালা বিল)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberKhala.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalKhala}</span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-purple-400 font-semibold flex items-center justify-center gap-1">
            <Wifi className="w-3 h-3" /> WiFi (ইন্টারনেট)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberWifi.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalWifi}</span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
            <PlusCircle className="w-3 h-3" /> Other (অন্যান্য)
          </div>
          <div className="font-bold text-white text-sm mt-0.5">৳{summary.perMemberOther.toFixed(0)}</div>
          <span className="text-[9px] text-slate-500">Total: ৳{summary.totalOther}</span>
        </div>

      </div>

    </div>
  );
}
