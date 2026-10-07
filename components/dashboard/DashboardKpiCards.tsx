"use client";

import { Role } from "@prisma/client";
import {
  Utensils,
  TrendingUp,
  Receipt,
  Wallet,
  Users,
  BedDouble,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Sparkles,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";

interface AdminKpiProps {
  estimatedMealRate: number;
  totalFoodExpense: number;
  messTotalMeals: number;
  todayMealsCount: {
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;
  };
  totalExpenses: number;
  totalPayments: number;
  netBalance: number;
  occupiedSeats: number;
  totalCapacity: number;
  roomCount: number;
  activeMealUsers: number;
  userCount: number;
  pendingComplaints: number;
  unpaidBills: number;
}

interface UserKpiProps {
  myTotalMeals: number;
  myEstimatedCost: number;
  myCurrentBill: {
    totalBill: number;
    dueAmount: number;
    totalPaid: number;
    status: string;
    month: string;
  } | null;
  mySeatInfo: {
    roomName: string;
    floor: number;
    seatNumber: string;
  } | null;
  estimatedMealRate: number;
  myPendingComplaints: number;
}

interface DashboardKpiCardsProps {
  role: Role;
  adminKpis: AdminKpiProps;
  userKpis: UserKpiProps;
}

export function DashboardKpiCards({ role, adminKpis, userKpis }: DashboardKpiCardsProps) {
  if (role === Role.USER) {
    const bill = userKpis.myCurrentBill;
    const seat = userKpis.mySeatInfo;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Consumed Meals */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
            <Utensils className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Meals Consumed
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">{userKpis.myTotalMeals}</h3>
              <span className="text-xs font-semibold text-slate-400">meals this month</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              Est. Meal Cost:{" "}
              <span className="text-emerald-400 font-bold">
                ৳{userKpis.myEstimatedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          {/* Mini progress visualization */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (userKpis.myTotalMeals / 90) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Current Meal Rate */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Mess Meal Rate
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-black text-blue-400">
                ৳{userKpis.estimatedMealRate.toFixed(2)}
              </h3>
              <span className="text-xs text-slate-400 font-semibold">/ meal</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Calculated live from food bazaar expenses</p>
          </div>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Mess Total Meals:</span>
            <span className="font-bold text-slate-200">{adminKpis.messTotalMeals}</span>
          </div>
        </div>

        {/* Card 3: My Current Month Bill */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Bill Status
            </span>
            <div
              className={`p-2.5 rounded-2xl border ${
                bill?.status === "PAID"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : bill?.status === "OVERDUE"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white">
                ৳{(bill ? bill.dueAmount : 0).toLocaleString()}
              </h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  bill?.status === "PAID"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : bill?.status === "OVERDUE"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {bill ? bill.status : "NO BILL YET"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {bill
                ? `Total Bill: ৳${bill.totalBill.toLocaleString()} (Paid: ৳${bill.totalPaid.toLocaleString()})`
                : "No bill generated for this month"}
            </p>
          </div>
          <Link
            href="/bills"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
          >
            <span>View Bill Statement</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: My Seat & Room */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Seat & Room
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div>
            {seat ? (
              <>
                <h3 className="text-2xl font-black text-purple-300">
                  {seat.roomName} • Seat {seat.seatNumber}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Floor: {seat.floor}</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-slate-400">Unassigned</h3>
                <p className="text-xs text-slate-500 mt-1">Contact manager for seat allocation</p>
              </>
            )}
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Active Support Tickets:</span>
            <span className="font-bold text-amber-400">{userKpis.myPendingComplaints}</span>
          </div>
        </div>
      </div>
    );
  }

  // Admin / Manager KPI View
  const occupancyPercent =
    adminKpis.totalCapacity > 0
      ? Math.round((adminKpis.occupiedSeats / adminKpis.totalCapacity) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Live Estimated Meal Rate */}
      <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Live Est. Meal Rate
          </span>
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Utensils className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-3xl font-black text-emerald-400">
              ৳{adminKpis.estimatedMealRate.toFixed(2)}
            </h3>
            <span className="text-xs font-semibold text-slate-400">/ meal</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Food Cost:{" "}
            <span className="text-slate-200 font-semibold">
              ৳{adminKpis.totalFoodExpense.toLocaleString()}
            </span>{" "}
            ÷ {adminKpis.messTotalMeals} Meals
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full"
            style={{ width: `${Math.min(100, (adminKpis.estimatedMealRate / 80) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Today's Meal Pulse */}
      <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Today&apos;s Meal Counter
          </span>
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">
              {adminKpis.todayMealsCount.total}
            </h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {adminKpis.activeMealUsers} active boarders
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>{adminKpis.todayMealsCount.breakfast} B</span>
            </div>
            <div className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-yellow-400" />
              <span>{adminKpis.todayMealsCount.lunch} L</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>{adminKpis.todayMealsCount.dinner} D</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Net Reserve & Collections */}
      <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Net Cash Liquidity
          </span>
          <div
            className={`p-2.5 rounded-2xl border ${
              adminKpis.netBalance >= 0
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3
              className={`text-3xl font-black ${
                adminKpis.netBalance >= 0 ? "text-blue-400" : "text-rose-400"
              }`}
            >
              ৳{adminKpis.netBalance.toLocaleString()}
            </h3>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                adminKpis.netBalance >= 0 ? "bg-blue-500/20 text-blue-300" : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {adminKpis.netBalance >= 0 ? "Surplus" : "Deficit"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Collected: ৳{adminKpis.totalPayments.toLocaleString()}</span>
            <span>Spent: ৳{adminKpis.totalExpenses.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* 4. Occupancy Rate */}
      <div className="glass-card glass-card-hover rounded-3xl p-5 border border-slate-800 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Seat Occupancy
          </span>
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">
              {adminKpis.occupiedSeats} / {adminKpis.totalCapacity}
            </h3>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              {occupancyPercent}% Occupied
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Across {adminKpis.roomCount} rooms • {adminKpis.userCount} registered members
          </p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
