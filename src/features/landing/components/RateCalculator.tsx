"use client";

import { useState } from "react";
import { Coffee, Minus, Moon, Plus, Sun } from "lucide-react";

/*
 * Interactive sample of the formula BillingService uses:
 * meal rate = food bazaar ÷ meals eaten by the mess;
 * bill = meals × rate + seat rent + utility shares − bazaar deposited − payments.
 */
const FOOD_BAZAAR = 16500;
const OTHERS_MEALS = 268;
const YOUR_EARLIER_MEALS = 74;
const SEAT_RENT = 2150;
const UTILITIES = 1700;
const DEPOSITS = 2800 + 3000;

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: Moon },
] as const;
type MealKey = (typeof MEALS)[number]["key"];

const taka = (value: number, decimals = 0) =>
  `৳${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const num = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 1 });

export function RateCalculator() {
  const [today, setToday] = useState<Record<MealKey, number>>({ breakfast: 1, lunch: 1, dinner: 1 });

  const step = (key: MealKey, delta: number) =>
    setToday((current) => ({ ...current, [key]: Math.min(3, Math.max(0, current[key] + delta)) }));

  const yourMeals = YOUR_EARLIER_MEALS + today.breakfast + today.lunch + today.dinner;
  const messMeals = OTHERS_MEALS + yourMeals;
  const rate = FOOD_BAZAAR / messMeals;
  const mealCost = Math.round(yourMeals * rate);
  const due = mealCost + SEAT_RENT + UTILITIES - DEPOSITS;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Try it: today&rsquo;s meals</p>
        <span className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[11px] text-slate-500">Sample mess</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {MEALS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <Icon aria-hidden="true" className="mx-auto h-4 w-4 text-slate-500" />
            <p id={`calc-${key}`} className="mt-1.5 text-xs text-slate-400">
              {label}
            </p>
            <output aria-labelledby={`calc-${key}`} className="mt-1 block text-2xl font-semibold tabular-nums text-white">
              {num(today[key])}
            </output>
            <div className="mt-2 flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => step(key, -0.5)}
                disabled={today[key] <= 0}
                aria-label={`Half a ${label.toLowerCase()} less`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <Minus aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => step(key, 0.5)}
                disabled={today[key] >= 3}
                aria-label={`Half a ${label.toLowerCase()} more`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-white/[0.06] pt-5 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Meal rate</dt>
          <dd className="tabular-nums text-slate-200">
            {taka(FOOD_BAZAAR)} ÷ {num(messMeals)} = <span className="font-semibold text-white">{taka(rate, 2)}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Your meals this month</dt>
          <dd className="tabular-nums text-slate-200">
            {num(yourMeals)} × {taka(rate, 2)} = {taka(mealCost)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Rent, utilities &amp; khala</dt>
          <dd className="tabular-nums text-slate-200">{taka(SEAT_RENT + UTILITIES)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Bazaar deposited &amp; paid</dt>
          <dd className="tabular-nums text-slate-200">−{taka(DEPOSITS)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-400/[0.08] px-3 py-2.5">
          <dt className="font-medium text-amber-200">Still due</dt>
          <dd className="text-lg font-semibold tabular-nums text-amber-300">{taka(due)}</dd>
        </div>
      </dl>
    </div>
  );
}
