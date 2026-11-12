"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, getMessMonthStr, shiftMonth } from "@/lib/month";

interface MonthSelectorProps {
  value: string;
  onChange: (monthStr: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function MonthSelector({ value, onChange, disabled = false, className = "" }: MonthSelectorProps) {
  const currentMonth = getMessMonthStr();
  const isCurrent = value === currentMonth;
  const canGoNext = value < currentMonth;

  const select = (monthStr: string) => {
    if (monthStr && monthStr <= currentMonth) onChange(monthStr);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => select(shiftMonth(value, -1))}
        disabled={disabled}
        aria-label="Previous month"
        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <label className="relative flex items-center justify-center gap-2 min-w-[10.5rem] sm:min-w-[12.5rem] px-2 py-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer">
        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-white whitespace-nowrap">{formatMonthLabel(value)}</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
            isCurrent
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              : "text-slate-400 bg-slate-800 border-slate-700"
          }`}
        >
          {isCurrent ? "Current" : "Past"}
        </span>
        <input
          type="month"
          value={value}
          max={currentMonth}
          disabled={disabled}
          aria-label="Choose a month"
          onChange={(e) => select(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </label>

      <button
        type="button"
        onClick={() => select(shiftMonth(value, 1))}
        disabled={disabled || !canGoNext}
        aria-label="Next month"
        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrent && (
        <button
          type="button"
          onClick={() => select(currentMonth)}
          disabled={disabled}
          className="ml-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-40"
        >
          This month
        </button>
      )}
    </div>
  );
}
