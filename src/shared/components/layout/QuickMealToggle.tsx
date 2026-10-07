"use client";

import { useState } from "react";
import { toggleMealStatus } from "@/server/actions/userActions";
import { toast } from "sonner";
import { UtensilsCrossed, Power, Loader2 } from "lucide-react";

interface QuickMealToggleProps {
  userId: string;
  initialStatus: boolean;
}

export function QuickMealToggle({ userId, initialStatus }: QuickMealToggleProps) {
  const [mealStatus, setMealStatus] = useState<boolean>(initialStatus);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newStatus = !mealStatus;
    setMealStatus(newStatus); // Optimistic UI update

    try {
      const res = await toggleMealStatus(userId, mealStatus);
      if (res.error) {
        setMealStatus(mealStatus); // revert on error
        toast.error(res.error);
      } else {
        toast.success(
          newStatus
            ? "Your meal status is now ACTIVE! Meals will be logged automatically."
            : "Your meal status is now OFF (PAUSED). No automatic meals logged."
        );
      }
    } catch {
      setMealStatus(mealStatus);
      toast.error("Failed to update meal status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4 transition hover:border-slate-700">
      <div className="flex items-center gap-3">
        <div
          className={`p-3 rounded-xl border transition ${
            mealStatus
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-800/80 text-slate-400 border-slate-700"
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              My Meal Status
            </h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                mealStatus
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {mealStatus ? "Active" : "Paused / Off"}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            {mealStatus
              ? "Receiving daily meal counts"
              : "Meal counting paused for you"}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition duration-200 active:scale-95 disabled:opacity-50 cursor-pointer ${
          mealStatus
            ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
        ) : (
          <Power className={`w-3.5 h-3.5 ${mealStatus ? "text-slate-400" : "text-white"}`} />
        )}
        <span>{mealStatus ? "Pause Meals" : "Activate Meals"}</span>
      </button>
    </div>
  );
}
