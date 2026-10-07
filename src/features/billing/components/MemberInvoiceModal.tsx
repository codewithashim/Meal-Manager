"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  CheckCircle2,
  Printer,
  Calendar,
  Zap,
  Home,
  Utensils,
  Copy,
  Check,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800">
          <ArrowDownRight className="w-4 h-4 print:hidden" /> REFUND: ৳{absDue.toFixed(0)} (ফেরত পাবেন)
        </span>
      );
    }
    if (due === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-gray-100 print:text-gray-800">
          <CheckCircle2 className="w-4 h-4 print:hidden" /> SETTLED (পরিশোধিত)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 print:bg-rose-100 print:text-rose-800">
        <ArrowUpRight className="w-4 h-4 print:hidden" /> PAY: ৳{absDue.toFixed(0)} (পরিশোধ করুন)
      </span>
    );
  };

  // Generate Copy-Paste text slip
  const copySlipText = `📌 Member Monthly Statement: ${bill.user.name} (${bill.month})
-----------------------------------------
• Room Rent (বাসা ভাড়া): ${bill.roomRent.toLocaleString()} BDT
• Utilities & Maid (ইউটিলিটি ও খালা): ${totalUtil.toLocaleString()} BDT
• Food & Meals (মিল খরচ ${bill.totalMeals} @ ${bill.mealRate.toFixed(2)}): ${bill.mealCost.toLocaleString()} BDT
-----------------------------------------
• Total Gross Bill (মোট বিল): ${bill.totalBill.toLocaleString()} BDT
• Less Bazar Deposited (বাজার খরচ বাদ): -${bazar.toLocaleString()} BDT
• Less Payments Paid (অগ্রিম বাদ): -${(bill.totalPaid || 0).toLocaleString()} BDT
-----------------------------------------
👉 ${isRefund ? `REFUND RECEIVABLE (ফেরত পাবেন): ${absDue.toLocaleString()} BDT` : `FINAL PAYABLE (প্রদেয় টাকা): ${absDue.toLocaleString()} BDT`}`;

  const handleCopySlip = () => {
    navigator.clipboard.writeText(copySlipText);
    setCopied(true);
    toast.success("Member slip text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<Receipt className="w-6 h-6" />}
      title="Official Member Statement"
      subtitle={bill.user.name}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={handleCopySlip}
            className="px-3.5 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Copy Slip Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Slip"}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" /> Download PDF / Print
          </button>
        </div>
      }
    >
      {/* PRINTABLE INDIVIDUAL INVOICE CONTENT */}
      <div id="printable-member-invoice" className="space-y-5 print:space-y-4">
        
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b border-slate-800 print:border-black pb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 print:text-blue-700">
              MEAL MANAGER MONTHLY INVOICE SLIP
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white print:text-black mt-0.5">
              {bill.user.name}
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600">{bill.user.email}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 print:text-gray-600 block">Billing Period (মাস)</span>
            <span className="font-extrabold text-blue-400 print:text-blue-900 text-sm flex items-center gap-1 justify-end mt-0.5">
              <Calendar className="w-3.5 h-3.5 print:hidden" /> {bill.month}
            </span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between bg-slate-950/70 print:bg-gray-100 p-3.5 rounded-2xl border border-slate-800 print:border-gray-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-gray-600 block text-[11px]">Final Status (বর্তমান অবস্থা)</span>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>

          <div className="text-right">
            <span className="text-slate-400 print:text-gray-600 block text-[11px]">Statement Date</span>
            <span className="font-semibold text-slate-200 print:text-black mt-1 block">
              {new Date(bill.generatedAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Itemized Charge Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black">
            Itemized Charges (খরচের বিবরণী)
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 print:border-gray-400 bg-slate-950/80 print:bg-white divide-y divide-slate-800/80 print:divide-gray-300 text-xs sm:text-sm">
            
            {/* 1. Room Rent */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-300 print:text-black font-medium">
                <Home className="w-4 h-4 text-blue-400 print:hidden" /> Room / Seat Rent (বাসা ভাড়া)
              </span>
              <span className="font-bold text-white print:text-black">৳{bill.roomRent.toFixed(0)}</span>
            </div>

            {/* 2. Meals */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="flex items-center gap-2 text-slate-300 print:text-black font-medium">
                  <Utensils className="w-4 h-4 text-amber-400 print:hidden" /> Food & Meals (মিল খরচ)
                </span>
                <span className="text-[11px] text-slate-400 print:text-gray-600 pl-6 print:pl-0 block">
                  {bill.totalMeals} meals eaten @ ৳{bill.mealRate.toFixed(2)} / meal
                </span>
              </div>
              <span className="font-bold text-amber-400 print:text-black">৳{bill.mealCost.toFixed(0)}</span>
            </div>

            {/* 3. Shared Utilities Breakdown */}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="flex items-center gap-2 text-slate-300 print:text-black font-medium">
                  <Zap className="w-4 h-4 text-purple-400 print:hidden" /> Shared Utilities & Maid (ইউটিলিটি ও খালা বিল)
                </span>
                <span className="text-[11px] text-slate-400 print:text-gray-600 pl-6 print:pl-0 block">
                  Electricity: ৳{elec.toFixed(0)} | Gas: ৳{gas.toFixed(0)} | Maid/Khala: ৳{khala.toFixed(0)} | Wifi: ৳{wifi.toFixed(0)}
                </span>
              </div>
              <span className="font-bold text-purple-400 print:text-black">৳{totalUtil.toFixed(0)}</span>
            </div>

          </div>
        </div>

        {/* Final Settlement Calculation Sheet */}
        <div className="bg-slate-950/90 print:bg-gray-50 p-4 sm:p-5 rounded-2xl border border-slate-800 print:border-gray-400 space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 print:text-gray-700 font-medium">1. Total Invoiced Amount (মোট বিল):</span>
            <span className="text-sm sm:text-base font-bold text-white print:text-black">৳{bill.totalBill.toFixed(0)}</span>
          </div>

          <div className="flex items-center justify-between text-emerald-400 print:text-emerald-800">
            <span className="font-medium">2. Less Bazar Deposited (বাজারের টাকা জমা):</span>
            <span className="font-bold">- ৳{bazar.toFixed(0)}</span>
          </div>

          <div className="flex items-center justify-between text-blue-400 print:text-blue-800">
            <span className="font-medium">3. Less Direct Payments Paid (প্রদানকৃত টাকা):</span>
            <span className="font-bold">- ৳{(bill.totalPaid || 0).toFixed(0)}</span>
          </div>

          <div className="pt-3 border-t border-slate-800 print:border-gray-400 flex items-center justify-between text-sm sm:text-base">
            <span className="font-extrabold text-white print:text-black">
              {isRefund ? "Final Refund Receivable (ফেরত পাবেন):" : "Final Amount to Pay (প্রদেয় বাকি টাকা):"}
            </span>
            <span className={`text-lg sm:text-xl font-black ${isRefund ? "text-emerald-400 print:text-emerald-700" : "text-rose-400 print:text-rose-700"}`}>
              {isRefund ? `Refund: ৳${absDue.toFixed(0)}` : `Pay: ৳${absDue.toFixed(0)}`}
            </span>
          </div>
        </div>

        {/* Printable Manager Signature Line */}
        <div className="pt-6 print:pt-10 grid grid-cols-2 gap-4 border-t border-slate-800 print:border-gray-400 text-xs text-slate-400 print:text-black">
          <div className="text-center space-y-6">
            <div className="border-b border-dashed border-slate-700 print:border-gray-400 w-36 mx-auto" />
            <div>Member Signature</div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-dashed border-slate-700 print:border-gray-400 w-36 mx-auto" />
            <div>Mess Manager Signature</div>
          </div>
        </div>

      </div>
    </AppDrawer>
  );
}
