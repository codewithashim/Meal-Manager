"use client";

import { Coffee, Minus, Moon, Plus, Sun } from "lucide-react";
import type { getDailyMeals } from "@/server/actions/mealActions";

type DailyRecord = Awaited<ReturnType<typeof getDailyMeals>>["records"][number];
type MealType = "breakfast" | "lunch" | "dinner";

const mealTypes = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-amber-400", background: "bg-amber-500/10" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "text-emerald-400", background: "bg-emerald-500/10" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "text-indigo-400", background: "bg-indigo-500/10" },
] as const;

interface MealDayEditorProps {
  records: DailyRecord[];
  onChange: (records: DailyRecord[]) => void;
  disabled: boolean;
  isManagerOrAdmin: boolean;
}

export default function MealDayEditor({ records, onChange, disabled, isManagerOrAdmin }: MealDayEditorProps) {
  const updateMeal = (userId: string, field: MealType, step: number) => {
    onChange(records.map((record) => record.userId === userId
      ? { ...record, [field]: Math.max(0, record[field] + step) }
      : record));
  };

  const setMeals = (userId: string, value: number) => {
    onChange(records.map((record) => record.userId === userId
      ? { ...record, breakfast: value, lunch: value, dinner: value }
      : record));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
        <p className="text-sm font-semibold text-slate-200">
          {isManagerOrAdmin ? "Adjust meals for each member" : "Adjust your meals"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Use the plus and minus buttons to change each count by 0.5. Save when you are finished.
        </p>
      </div>

      {records.map((record) => {
        const total = record.breakfast + record.lunch + record.dinner;
        return (
          <section key={record.userId} aria-label={`Meals for ${record.userName}`} className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/60 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-bold text-white">{record.userName}</h4>
                <p className="mt-1 text-xs text-slate-400">
                  {record.recordId ? "Saved entry" : "Suggested values - not saved yet"}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Day total</span>
                <span className="text-sm font-bold text-white" aria-live="polite">{total} {total === 1 ? "meal" : "meals"}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 px-4 sm:px-5">
              {mealTypes.map(({ key, label, icon: Icon, color, background }) => (
                <div key={key} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease ${label.toLowerCase()} for ${record.userName} by 0.5`}
                      disabled={disabled || record[key] <= 0}
                      onClick={() => updateMeal(record.userId, key, -0.5)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <output aria-label={`${label} count for ${record.userName}`} aria-live="polite" className={`min-w-10 text-center text-base font-bold tabular-nums ${color}`}>
                      {record[key]}
                    </output>
                    <button
                      type="button"
                      aria-label={`Increase ${label.toLowerCase()} for ${record.userName} by 0.5`}
                      disabled={disabled}
                      onClick={() => updateMeal(record.userId, key, 0.5)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 sm:px-5">
              <span className="text-xs font-medium text-slate-400">Quick set</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={disabled} onClick={() => setMeals(record.userId, 1)} className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-40">
                  1 of each
                </button>
                <button type="button" disabled={disabled} onClick={() => setMeals(record.userId, 0)} className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-40">
                  Clear meals
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
