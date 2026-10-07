"use client";

import { useState, useTransition } from "react";
import GenerateBillModal from "@/components/bills/GenerateBillModal";
import { FileSpreadsheet, Plus, Calendar, CheckCircle2, AlertCircle, Clock, Receipt } from "lucide-react";
import { getMonthlyBills } from "@/server/actions/billingActions";

interface BillClientPageProps {
  initialBills: any[];
  initialBilled: number;
  initialCollected: number;
  initialDue: number;
  initialMonth: string;
  currentUserRole: string;
  currentUserId: string;
}

export default function BillClientPage({
  initialBills,
  initialBilled,
  initialCollected,
  initialDue,
  initialMonth,
  currentUserRole,
  currentUserId,
}: BillClientPageProps) {
  const [bills, setBills] = useState<any[]>(initialBills);
  const [totalBilled, setTotalBilled] = useState(initialBilled);
  const [totalCollected, setTotalCollected] = useState(initialCollected);
  const [totalDue, setTotalDue] = useState(initialDue);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    startTransition(async () => {
      const res = await getMonthlyBills(monthStr);
      setBills(res.bills);
      setTotalBilled(res.totalBilled);
      setTotalCollected(res.totalCollected);
      setTotalDue(res.totalDue);
    });
  };

  const handleRefresh = async () => {
    handleMonthChange(selectedMonth);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-500" />
            Monthly Member Invoices & Bills
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Itemized breakdown of meal costs, room rent, utilities, and payment status.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Calculate & Generate Bills
          </button>
        )}
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">৳{totalBilled.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Total invoiced amount for {selectedMonth}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Payments</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">৳{totalCollected.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Payments received</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outstanding Due</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">৳{totalDue.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Pending collection</p>
        </div>

      </div>

      {/* Month Selector Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
        <div className="text-xs sm:text-sm font-semibold text-white">Billing Period</div>
        <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2 text-white">
          <Calendar className="w-4 h-4 text-blue-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-transparent font-medium text-xs sm:text-sm focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {bills.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No monthly bills generated yet for {selectedMonth}.
          </div>
        ) : (
          bills.map((b) => (
            <div key={b.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{b.user.name}</h3>
                  <div className="text-xs text-slate-400">{b.user.email}</div>
                </div>
                <div>{getStatusBadge(b.status)}</div>
              </div>

              {/* Itemized Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">Meals ({b.totalMeals})</span>
                  <span className="font-bold text-slate-200">৳{b.mealCost.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-400 font-bold block">Rent</span>
                  <span className="font-bold text-slate-200">৳{b.roomRent.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-400 font-bold block">Utilities</span>
                  <span className="font-bold text-slate-200">৳{(b.utilityShare + b.otherCharges).toFixed(0)}</span>
                </div>
              </div>

              {/* Invoice Footer Totals */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Invoiced</span>
                  <span className="font-extrabold text-white text-base">৳{b.totalBill.toFixed(0)}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-rose-400 font-bold block uppercase">Due Balance</span>
                  <span className="font-extrabold text-rose-400 text-base">৳{b.dueAmount.toFixed(0)}</span>
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
                <th className="px-6 py-4">Member</th>
                <th className="px-4 py-4 text-center">Meals & Rate</th>
                <th className="px-4 py-4 text-center">Meal Cost</th>
                <th className="px-4 py-4 text-center">Room Rent</th>
                <th className="px-4 py-4 text-center">Utilities</th>
                <th className="px-6 py-4 text-right">Total Bill</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Due Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No monthly bills generated yet for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Member */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{b.user.name}</div>
                      <div className="text-xs text-slate-400">{b.user.email}</div>
                    </td>

                    {/* Meals Count & Rate */}
                    <td className="px-4 py-4 text-center">
                      <div className="font-medium text-white">{b.totalMeals} meals</div>
                      <div className="text-[11px] text-slate-400">@ ৳{b.mealRate.toFixed(1)}/meal</div>
                    </td>

                    {/* Meal Cost */}
                    <td className="px-4 py-4 text-center font-semibold text-amber-400">
                      ৳{b.mealCost.toFixed(0)}
                    </td>

                    {/* Room Rent */}
                    <td className="px-4 py-4 text-center font-semibold text-blue-400">
                      ৳{b.roomRent.toFixed(0)}
                    </td>

                    {/* Utility & Other Share */}
                    <td className="px-4 py-4 text-center font-semibold text-purple-400">
                      ৳{(b.utilityShare + b.otherCharges).toFixed(0)}
                    </td>

                    {/* Total Bill */}
                    <td className="px-6 py-4 text-right font-extrabold text-white text-base">
                      ৳{b.totalBill.toFixed(0)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(b.status)}
                    </td>

                    {/* Due Amount */}
                    <td className="px-6 py-4 text-right font-bold text-rose-400">
                      ৳{b.dueAmount.toFixed(0)}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMonth={selectedMonth}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
