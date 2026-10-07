"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  Zap,
  Flame,
  Droplets,
  UserCheck,
  Wifi,
  Home,
  Utensils,
  PlusCircle,
  Copy,
  Check,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

interface MemberInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any | null;
}

export default function MemberInvoiceModal({ isOpen, onClose, bill }: MemberInvoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const elec = bill.electricityShare || 0;
  const gas = bill.gasShare || 0;
  const water = bill.waterShare || 0;
  const khala = bill.khalaShare || 0;
  const wifi = bill.wifiShare || 0;
  const other = bill.otherCharges || 0;
  const totalUtil = bill.utilityShare || (elec + gas + water + khala + wifi + other);
  const bazar = bill.bazarDeposited || 0;
  const due = bill.dueAmount ?? (bill.totalBill - (bazar + bill.totalPaid));

  const isRefund = due < 0;
  const absDue = Math.abs(due);

  const getStatusBadge = () => {
    if (isRefund) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <ArrowDownRight className="w-4 h-4" /> REFUND: ৳{absDue.toFixed(0)}
        </span>
      );
    }
    if (due === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4" /> SETTLED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <ArrowUpRight className="w-4 h-4" /> PAY: ৳{absDue.toFixed(0)}
      </span>
    );
  };

  // Generate Copy-Paste text slip formatted strictly per specification
  const copySlipText = `📌 Monthly Mess Statement: ${bill.user.name} (${bill.month})
-----------------------------------------
• Rent: ${bill.roomRent.toLocaleString()} BDT
• Utilities (Internet + Khala + Electricity + Gas + Water): ${totalUtil.toLocaleString()} BDT
• Meals (${bill.totalMeals} @ ${bill.mealRate.toFixed(2)}): ${bill.mealCost.toLocaleString()} BDT
-----------------------------------------
• Total Gross Obligation: ${bill.totalBill.toLocaleString()} BDT
• Less Bazar Done: -${bazar.toLocaleString()} BDT
• Direct Paid: -${bill.totalPaid.toLocaleString()} BDT
-----------------------------------------
👉 ${isRefund ? `RECEIVABLE REFUND: ${absDue.toLocaleString()} BDT` : `FINAL PAYABLE TO MANAGER: ${absDue.toLocaleString()} BDT`}`;

  const handleCopySlip = () => {
    navigator.clipboard.writeText(copySlipText);
    setCopied(true);
    toast.success("Member slip copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Invoice Card */}
      <div className="relative w-full max-w-xl glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl text-slate-100 animate-scaleUp z-10 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Official Mess Invoice Slip
              </div>
              <h2 className="text-xl font-extrabold text-white">{bill.user.name}</h2>
              <p className="text-xs text-slate-400">{bill.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySlip}
              className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Copy Slip Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Slip"}
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" /> Print
            </button>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Billing Period</span>
            <span className="font-bold text-white flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> {bill.month}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Settlement Status</span>
            <div className="mt-0.5">{getStatusBadge()}</div>
          </div>

          <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
            <span className="text-slate-400 block">Generated Date</span>
            <span className="font-medium text-slate-300 mt-0.5 block">
              {new Date(bill.generatedAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Itemized Charges Table */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Itemized Obligation Breakdown (হিসাব বিবরণী)
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 divide-y divide-slate-800/80 text-sm">
            
            {/* 1. Room Rent */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-300">
                <Home className="w-4 h-4 text-blue-400" /> Room / Seat Rent (বাসা ভাড়া)
              </span>
              <span className="font-semibold text-white">৳{bill.roomRent.toFixed(2)}</span>
            </div>

            {/* 2. Meal Charges */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="flex items-center gap-2 text-slate-300">
                  <Utensils className="w-4 h-4 text-amber-400" /> Meal Cost (মিল খরচ)
                </span>
                <span className="text-xs text-slate-400 pl-6 block">
                  {bill.totalMeals} meals @ ৳{bill.mealRate.toFixed(2)} / meal
                </span>
              </div>
              <span className="font-semibold text-amber-400">৳{bill.mealCost.toFixed(2)}</span>
            </div>

            {/* 3. Shared Utilities Breakdown */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-4 h-4 text-purple-400" /> Shared Utilities Share
                </span>
                <span className="text-[11px] text-slate-400 pl-6 block">
                  Electricity: ৳{elec.toFixed(0)} | Gas: ৳{gas.toFixed(0)} | Khala: ৳{khala.toFixed(0)} | Wifi: ৳{wifi.toFixed(0)}
                </span>
              </div>
              <span className="font-semibold text-purple-400">৳{totalUtil.toFixed(2)}</span>
            </div>

          </div>
        </div>

        {/* Final Settlement Summary Card */}
        <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">1. Gross Individual Obligation:</span>
            <span className="text-base font-bold text-white">৳{bill.totalBill.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-emerald-400">
            <span className="font-medium">2. Less Bazar Deposited:</span>
            <span className="font-bold">- ৳{bazar.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-blue-400">
            <span className="font-medium">3. Less Direct Payments Recorded:</span>
            <span className="font-bold">- ৳{(bill.totalPaid || 0).toFixed(2)}</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-base">
            <span className="font-extrabold text-white">
              {isRefund ? "Final Receivable Refund:" : "Final Payable Balance:"}
            </span>
            <span className={`text-xl font-black ${isRefund ? "text-emerald-400" : "text-rose-400"}`}>
              {isRefund ? `Refund: ৳${absDue.toFixed(2)}` : `Pay: ৳${absDue.toFixed(2)}`}
            </span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
