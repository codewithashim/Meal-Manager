"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import MessCalculationSheet from "@/features/billing/components/MessCalculationSheet";
import MemberInvoiceModal from "@/features/billing/components/MemberInvoiceModal";
import FullMonthlyReportModal from "@/features/billing/components/FullMonthlyReportModal";
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Zap,
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
import MonthSelector from "@/shared/components/ui/MonthSelector";
import { setMonthInUrl } from "@/shared/hooks/useMonthParam";
import { formatMonthLabel } from "@/lib/month";

type BillsData = Awaited<ReturnType<typeof getMonthlyBills>>;

interface BillClientPageProps {
  initialData: BillsData;
  initialMonth: string;
  currentUserRole: string;
  currentUserId: string;
}

export default function BillClientPage({
  initialData,
  initialMonth,
  currentUserRole,
  currentUserId,
}: BillClientPageProps) {
  const [data, setData] = useState(initialData);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const { bills, totalBilled, totalCollected, totalDue, messSummary, isCurrentMonth, lastUpdated } = data;

  const [isFullReportModalOpen, setIsFullReportModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the invoice modals take loosely typed bills
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<any | null>(null);
  const [showSummarySheet, setShowSummarySheet] = useState(true);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";
  const myBill = bills.find((b) => b.userId === currentUserId) ?? null;

  // Every load re-syncs the month on the server, so this always shows up-to-date figures.
  const loadMonth = (monthStr: string) => {
    const request = ++requestId.current;
    startTransition(async () => {
      try {
        const res = await getMonthlyBills(monthStr);
        if (request === requestId.current) setData(res);
      } catch {
        if (request === requestId.current) toast.error("Could not load bills. Please try again.");
      }
    });
  };

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setMonthInUrl(monthStr);
    loadMonth(monthStr);
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
    <div className="space-y-6 animate-fadeIn pb-28 lg:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
            Mess Monthly Invoices & Bills (মেসের মাসিক বিল ও হিসাব)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Easy-to-understand breakdown of Room Rent, Meals, Electricity, Gas, Water, Maid (Khala), and WiFi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex items-center gap-2.5 w-full sm:w-auto">
          {/* Download Full Monthly PDF Report Button */}
          <button
            onClick={() => setIsFullReportModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" /> Download Full Monthly PDF
          </button>

          <button
            onClick={() => loadMonth(selectedMonth)}
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isPending ? "animate-spin" : ""}`} /> Refresh
          </button>

          {canManage && (
            <Link
              href={`/expenses?month=${selectedMonth}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" /> Log utility bill
            </Link>
          )}
        </div>
      </div>

      <div
        role="status"
        className={`rounded-2xl p-4 border text-xs sm:text-sm flex items-start gap-3 ${
          isCurrentMonth ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-slate-700 bg-slate-900/60 text-slate-300"
        }`}
      >
        <Zap className={`w-5 h-5 shrink-0 mt-0.5 ${isCurrentMonth ? "text-emerald-400" : "text-slate-400"}`} />
        <p>
          <strong className="text-white">
            {isCurrentMonth ? `${formatMonthLabel(selectedMonth)} is in progress.` : `${formatMonthLabel(selectedMonth)} is closed.`}
          </strong>{" "}
          Bills are calculated automatically from meals, bazaar, utility bills logged under Expenses, room rent and
          payments{isCurrentMonth ? ", and update the moment anything is logged." : ". Late corrections to this month still update them."}
          {lastUpdated && (
            <span className="block text-[11px] opacity-70 mt-0.5">
              Last changed {new Date(lastUpdated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
        </p>
      </div>

      {myBill && (
        <section className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                My bill · {formatMonthLabel(selectedMonth)}{isCurrentMonth ? " (so far)" : ""}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-300">
                <span>Total <strong className="text-white">৳{myBill.totalBill.toFixed(0)}</strong></span>
                <span>Bazaar <strong className="text-emerald-400">−৳{(myBill.bazarDeposited || 0).toFixed(0)}</strong></span>
                <span>Paid <strong className="text-emerald-400">−৳{myBill.totalPaid.toFixed(0)}</strong></span>
                <span className={`font-extrabold ${myBill.dueAmount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {myBill.dueAmount > 0 ? `Left to pay ৳${myBill.dueAmount.toFixed(0)}` : myBill.dueAmount < 0 ? `Refund ৳${Math.abs(myBill.dueAmount).toFixed(0)}` : "Settled"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedBillForInvoice(myBill)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4" /> View my slip
            </button>
          </div>
        </section>
      )}

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Billed (মোট বিল)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">৳{totalBilled.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Total invoiced amount for {formatMonthLabel(selectedMonth)}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Payments (সংগৃহীত)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">৳{totalCollected.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Direct payments received</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outstanding Due (মোট বকেয়া)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">৳{totalDue.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mt-1">Pending collection across members</p>
        </div>

      </div>

      {/* Easy Formula Explanation Callout */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800/90 bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              How Your Final Bill is Calculated (হিসাব যেভাবে হয়)
            </h3>
            <p className="text-xs text-slate-300 mt-1 sm:mt-0.5 leading-relaxed">
              <strong className="text-white">Final Balance (নিট হিসাব)</strong> = (Room Rent + Meal Cost + Shared Utilities) - (Bazar Money Deposited + Direct Paid)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
            Negative (-) = Refund to Member
          </span>
          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold text-[11px]">
            Positive (+) = Member Must Pay
          </span>
        </div>
      </div>

      {/* Month Selector Bar & Mess Summary Toggle */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <button
          onClick={() => setShowSummarySheet(!showSummarySheet)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 transition cursor-pointer active:scale-95"
        >
          {showSummarySheet ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
          {showSummarySheet ? "Hide Master Calculation Sheet" : "Show Master Calculation Sheet"}
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs sm:text-sm font-semibold text-white">Billing Month</span>
          <MonthSelector
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full sm:w-auto justify-between"
          />
        </div>
      </div>

      {/* Mess Central Calculation Sheet */}
      {showSummarySheet && messSummary && (
        <MessCalculationSheet summary={messSummary} monthStr={selectedMonth} />
      )}

      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3.5">
        {bills.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            No active members to bill for {formatMonthLabel(selectedMonth)}.
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
              <div key={b.id} className="glass-card rounded-2xl p-4 border border-slate-800/80 space-y-3.5 shadow-lg">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{b.user.name}</h3>
                    <div className="text-xs text-slate-400 truncate max-w-[170px]">{b.user.email}</div>
                  </div>
                  <div>
                    {isRefund ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ArrowDownRight className="w-3.5 h-3.5" /> Refund ৳{absDue.toFixed(0)}
                      </span>
                    ) : netDue === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Settled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Pay ৳{absDue.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Itemized Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Meals ({b.totalMeals})</span>
                    <span className="font-bold text-slate-200">৳{b.mealCost.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider">Rent</span>
                    <span className="font-bold text-slate-200">৳{b.roomRent.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">Utilities & Maid</span>
                    <span className="font-bold text-slate-200">৳{utilTotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* Invoice Footer Totals */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Bazar Deposited: ৳{bazar.toFixed(0)}</span>
                    <span className="font-extrabold text-white text-sm">Total Bill: ৳{b.totalBill.toFixed(0)}</span>
                  </div>

                  <button
                    onClick={() => setSelectedBillForInvoice(b)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-600 hover:text-white active:scale-95 transition cursor-pointer shrink-0"
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
                    No active members to bill for {formatMonthLabel(selectedMonth)}.
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
