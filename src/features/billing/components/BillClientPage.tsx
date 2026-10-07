"use client";

import { useState, useTransition } from "react";
import GenerateBillModal from "@/features/billing/components/GenerateBillModal";
import MessCalculationSheet from "@/features/billing/components/MessCalculationSheet";
import MemberInvoiceModal from "@/features/billing/components/MemberInvoiceModal";
import FullMonthlyReportModal from "@/features/billing/components/FullMonthlyReportModal";
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Eye,
  ChevronDown,
  ChevronUp,
  Printer,
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { getMonthlyBills } from "@/server/actions/billingActions";

interface BillClientPageProps {
  initialBills: any[];
  initialBilled: number;
  initialCollected: number;
  initialDue: number;
  initialMessSummary?: any;
  initialMonth: string;
  currentUserRole: string;
  currentUserId: string;
}

export default function BillClientPage({
  initialBills,
  initialBilled,
  initialCollected,
  initialDue,
  initialMessSummary,
  initialMonth,
  currentUserRole,
  currentUserId,
}: BillClientPageProps) {
  const [bills, setBills] = useState<any[]>(initialBills);
  const [totalBilled, setTotalBilled] = useState(initialBilled);
  const [totalCollected, setTotalCollected] = useState(initialCollected);
  const [totalDue, setTotalDue] = useState(initialDue);
  const [messSummary, setMessSummary] = useState<any>(initialMessSummary);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isFullReportModalOpen, setIsFullReportModalOpen] = useState(false);
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<any | null>(null);
  const [showSummarySheet, setShowSummarySheet] = useState(true);

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
      if (res.messSummary) {
        setMessSummary(res.messSummary);
      }
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid (পরিশোধিত)
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Partial (আংশিক)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid (বাকি)
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
            Mess Monthly Invoices & Bills (মেসের মাসিক বিল ও হিসাব)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Easy-to-understand breakdown of Room Rent, Meals, Electricity, Gas, Water, Maid (Khala), and WiFi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Full Monthly PDF Report Button */}
          <button
            onClick={() => setIsFullReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition hover:scale-[1.02] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" /> Download Full Monthly PDF
          </button>

          {canManage && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Calculate & Generate Bills
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed (মোট বিল)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">৳{totalBilled.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Total invoiced amount for {selectedMonth}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Payments (সংগৃহীত)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">৳{totalCollected.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Direct payments received</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outstanding Due (মোট বকেয়া)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">৳{totalDue.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Pending collection across members</p>
        </div>

      </div>

      {/* Easy Formula Explanation Callout */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              How Your Final Bill is Calculated (হিসাব যেভাবে হয়)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              <strong className="text-white">Final Balance (নিট হিসাব)</strong> = (Room Rent + Meal Cost + Shared Utilities) - (Bazar Money Deposited + Direct Paid)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
            Negative (-) = Refund to Member
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">
            Positive (+) = Member Must Pay
          </span>
        </div>
      </div>

      {/* Month Selector Bar & Mess Summary Toggle */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummarySheet(!showSummarySheet)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            {showSummarySheet ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
            {showSummarySheet ? "Hide Master Calculation Sheet" : "Show Master Calculation Sheet"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-white">Select Billing Month:</span>
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
      </div>

      {/* Mess Central Calculation Sheet */}
      {showSummarySheet && messSummary && (
        <MessCalculationSheet summary={messSummary} monthStr={selectedMonth} />
      )}

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {bills.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No monthly bills generated yet for {selectedMonth}.
          </div>
        ) : (
          bills.map((b) => {
            const elec = b.electricityShare || 0;
            const gas = b.gasShare || 0;
            const water = b.waterShare || 0;
            const khala = b.khalaShare || 0;
            const wifi = b.wifiShare || 0;
            const other = b.otherCharges || 0;
            const utilTotal = b.utilityShare || (elec + gas + water + khala + wifi + other);
            const bazar = b.bazarDeposited || 0;
            const netDue = b.dueAmount ?? (b.totalBill - (bazar + b.totalPaid));
            const isRefund = netDue < 0;
            const absDue = Math.abs(netDue);

            return (
              <div key={b.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
                
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{b.user.name}</h3>
                    <div className="text-xs text-slate-400">{b.user.email}</div>
                  </div>
                  <div>
                    {isRefund ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Refund ৳{absDue.toFixed(0)}
                      </span>
                    ) : netDue === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Settled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Pay ৳{absDue.toFixed(0)}
                      </span>
                    )}
                  </div>
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
                    <span className="text-[10px] text-purple-400 font-bold block">Utilities & Maid</span>
                    <span className="font-bold text-slate-200">৳{utilTotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* Invoice Footer Totals */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Bazar Deposited: ৳{bazar.toFixed(0)}</span>
                    <span className="font-extrabold text-white text-sm">Total Bill: ৳{b.totalBill.toFixed(0)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedBillForInvoice(b)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View & PDF Slip
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Member (মেম্বার)</th>
                <th className="px-3 py-4 text-center">Room Rent (বাসা ভাড়া)</th>
                <th className="px-3 py-4 text-center">Utilities & Maid (ইউটিলিটি)</th>
                <th className="px-3 py-4 text-center">Meals Eaten (মিল)</th>
                <th className="px-3 py-4 text-center">Meal Cost (মিল খরচ)</th>
                <th className="px-3 py-4 text-right">Total Bill (মোট খরচ)</th>
                <th className="px-3 py-4 text-right">Bazar Deposited (বাজার জমা)</th>
                <th className="px-5 py-4 text-center">Final Balance (নিট হিসাব)</th>
                <th className="px-4 py-4 text-center">Invoice Slip (রসিদ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    No monthly bills generated yet for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                bills.map((b) => {
                  const elec = b.electricityShare || 0;
                  const gas = b.gasShare || 0;
                  const water = b.waterShare || 0;
                  const khala = b.khalaShare || 0;
                  const wifi = b.wifiShare || 0;
                  const other = b.otherCharges || 0;
                  const utilTotal = b.utilityShare || (elec + gas + water + khala + wifi + other);
                  const bazar = b.bazarDeposited || 0;
                  const netDue = b.dueAmount ?? (b.totalBill - (bazar + b.totalPaid));
                  const isRefund = netDue < 0;
                  const absDue = Math.abs(netDue);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Member */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{b.user.name}</div>
                        <div className="text-xs text-slate-400">{b.user.email}</div>
                      </td>

                      {/* Room Rent */}
                      <td className="px-3 py-4 text-center font-semibold text-blue-400">
                        ৳{b.roomRent.toLocaleString()}
                      </td>

                      {/* Shared Utilities */}
                      <td className="px-3 py-4 text-center font-semibold text-purple-400">
                        ৳{utilTotal.toFixed(0)}
                      </td>

                      {/* Meals Count & Rate */}
                      <td className="px-3 py-4 text-center">
                        <div className="font-medium text-white">{b.totalMeals} meals</div>
                        <div className="text-[10px] text-slate-400">@ ৳{b.mealRate.toFixed(1)}</div>
                      </td>

                      {/* Meal Cost */}
                      <td className="px-3 py-4 text-center font-semibold text-amber-400">
                        ৳{b.mealCost.toFixed(0)}
                      </td>

                      {/* Total Bill */}
                      <td className="px-3 py-4 text-right font-extrabold text-white">
                        ৳{b.totalBill.toFixed(0)}
                      </td>

                      {/* Bazar Deposited */}
                      <td className="px-3 py-4 text-right font-bold text-emerald-400">
                        ৳{bazar.toFixed(0)}
                      </td>

                      {/* Net Balance (Pay / Refund) */}
                      <td className="px-5 py-4 text-center">
                        {isRefund ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Refund: ৳{absDue.toFixed(0)}
                          </span>
                        ) : netDue === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Pay: ৳{absDue.toFixed(0)}
                          </span>
                        )}
                      </td>

                      {/* View & PDF Itemized Invoice Slip */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setSelectedBillForInvoice(b)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center justify-center gap-1 mx-auto text-xs font-medium"
                          title="View & PDF Invoice Slip"
                        >
                          <Eye className="w-4 h-4" /> Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        defaultMonth={selectedMonth}
        onSuccess={handleRefresh}
      />

      {/* Member Itemized Invoice Modal */}
      <MemberInvoiceModal
        isOpen={!!selectedBillForInvoice}
        onClose={() => setSelectedBillForInvoice(null)}
        bill={selectedBillForInvoice}
      />

      {/* Full Monthly PDF Report Modal */}
      <FullMonthlyReportModal
        isOpen={isFullReportModalOpen}
        onClose={() => setIsFullReportModalOpen(false)}
        monthStr={selectedMonth}
        messSummary={messSummary}
        bills={bills}
        totalBilled={totalBilled}
        totalCollected={totalCollected}
        totalDue={totalDue}
      />

    </div>
  );
}
