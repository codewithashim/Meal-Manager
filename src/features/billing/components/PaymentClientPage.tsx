"use client";

import { useState, useTransition } from "react";
import RecordPaymentModal from "@/features/billing/components/RecordPaymentModal";
import { Wallet, Plus, Calendar, Search, CheckCircle2 } from "lucide-react";
import { getPayments } from "@/server/actions/billingActions";

interface PaymentClientPageProps {
  initialPayments: any[];
  initialCollected: number;
  initialMonth: string;
  currentUserRole: string;
}

export default function PaymentClientPage({
  initialPayments,
  initialCollected,
  initialMonth,
  currentUserRole,
}: PaymentClientPageProps) {
  const [payments, setPayments] = useState<any[]>(initialPayments);
  const [totalCollected, setTotalCollected] = useState(initialCollected);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    startTransition(async () => {
      const res = await getPayments(monthStr);
      setPayments(res.payments);
      setTotalCollected(res.totalCollected);
    });
  };

  const handleRefresh = async () => {
    handleMonthChange(selectedMonth);
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "BKASH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/30">
            bKash
          </span>
        );
      case "NAGAD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Nagad
          </span>
        );
      case "BANK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Bank Transfer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Cash
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-400" />
            Member Payments & Collections
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Record member rent & meal payments via Cash, bKash, Nagad, or Bank.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
      </div>

      {/* Total Collected KPI Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Collected ({selectedMonth})</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">৳{totalCollected.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Received member payments for selected month</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
      </div>

      {/* Search & Month Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by member name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
          />
        </div>

        <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white w-full md:w-auto">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-transparent font-medium text-xs sm:text-sm focus:outline-none cursor-pointer w-full"
          />
        </div>

      </div>

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No payments recorded for this period.
          </div>
        ) : (
          filteredPayments.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{p.user.name}</h3>
                  <div className="text-xs text-slate-400">{p.user.email}</div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-emerald-400 text-lg">৳{p.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  {getMethodBadge(p.paymentMethod)}
                  {p.transactionId && <span className="font-mono text-[10px] text-slate-400">({p.transactionId})</span>}
                </div>

                <span className="font-mono text-[11px] text-slate-500">
                  {new Date(p.date).toISOString().split("T")[0]}
                </span>
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
                <th className="px-6 py-4">Bill Month</th>
                <th className="px-6 py-4">Method & TrxID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No payments recorded for this period.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{p.user.name}</div>
                      <div className="text-xs text-slate-400">{p.user.email}</div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-white">{p.month}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMethodBadge(p.paymentMethod)}
                        {p.transactionId && (
                          <span className="text-xs font-mono text-slate-400">({p.transactionId})</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(p.date).toISOString().split("T")[0]}
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-emerald-400 text-base">
                      ৳{p.amount.toLocaleString()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMonth={selectedMonth}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
