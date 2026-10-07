"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  FileText,
  Calendar,
  Calculator,
  Copy,
  Check,
  Home,
  Zap,
  Flame,
  UserCheck,
  Wifi,
  Utensils,
} from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import { toast } from "sonner";

interface FullMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthStr: string;
  messSummary: any;
  bills: any[];
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
  messName?: string;
}

export default function FullMonthlyReportModal({
  isOpen,
  onClose,
  monthStr,
  messSummary,
  bills,
  totalBilled,
  totalCollected,
  totalDue,
  messName = "My Boarding Mess",
}: FullMonthlyReportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalFood = messSummary?.totalFoodExpense || 0;
  const totalMeals = messSummary?.totalMessMeals || 0;
  const mealRate = messSummary?.mealRate || 0;
  const activeMembers = messSummary?.activeMembersCount || bills.length || 1;

  const totalElectricity = messSummary?.totalElectricity || 0;
  const totalGas = messSummary?.totalGas || 0;
  const totalWater = messSummary?.totalWater || 0;
  const totalKhala = messSummary?.totalKhala || 0;
  const totalWifi = messSummary?.totalWifi || 0;
  const totalRent = messSummary?.totalRent || 0;
  const totalOther = messSummary?.totalOther || 0;

  const perMemberElectricity = messSummary?.perMemberElectricity || (totalElectricity / activeMembers);
  const perMemberGas = messSummary?.perMemberGas || (totalGas / activeMembers);
  const perMemberWater = messSummary?.perMemberWater || (totalWater / activeMembers);
  const perMemberKhala = messSummary?.perMemberKhala || (totalKhala / activeMembers);
  const perMemberWifi = messSummary?.perMemberWifi || (totalWifi / activeMembers);
  const perMemberOther = messSummary?.perMemberOther || (totalOther / activeMembers);

  const handleCopySummary = () => {
    let summaryText = `📋 Mess Monthly Official Report (${monthStr}) - ${messName}\n`;
    summaryText += `==================================================\n`;
    summaryText += `FINANCIAL OVERVIEW:\n`;
    summaryText += `• Total Billed: ৳${totalBilled.toLocaleString()}\n`;
    summaryText += `• Total Collected: ৳${totalCollected.toLocaleString()}\n`;
    summaryText += `• Outstanding Due: ৳${totalDue.toLocaleString()}\n\n`;

    summaryText += `CENTRAL EXPENSE BREAKDOWN:\n`;
    summaryText += `• Total House Rent: ৳${totalRent.toLocaleString()}\n`;
    summaryText += `• Food Expense: ৳${totalFood.toLocaleString()} (${totalMeals} meals @ ৳${mealRate.toFixed(2)}/meal)\n`;
    summaryText += `• Electricity Bill: ৳${totalElectricity.toLocaleString()} (৳${perMemberElectricity.toFixed(0)}/member)\n`;
    summaryText += `• Internet / WiFi Bill: ৳${totalWifi.toLocaleString()} (৳${perMemberWifi.toFixed(0)}/member)\n`;
    summaryText += `• Khala / Maid Salary: ৳${totalKhala.toLocaleString()} (৳${perMemberKhala.toFixed(0)}/member)\n`;
    summaryText += `• Gas Bill: ৳${totalGas.toLocaleString()} (৳${perMemberGas.toFixed(0)}/member)\n`;
    summaryText += `• Water Bill: ৳${totalWater.toLocaleString()} (৳${perMemberWater.toFixed(0)}/member)\n`;
    summaryText += `==================================================\n\n`;

    summaryText += `MEMBER INDIVIDUAL BREAKDOWN:\n`;
    bills.forEach((b, idx) => {
      const elec = b.electricityShare || perMemberElectricity;
      const gas = b.gasShare || perMemberGas;
      const water = b.waterShare || perMemberWater;
      const khala = b.khalaShare || perMemberKhala;
      const wifi = b.wifiShare || perMemberWifi;
      const other = b.otherCharges || perMemberOther;
      const utilTotal = b.utilityShare || (elec + gas + water + khala + wifi + other);
      const bazar = b.bazarDeposited || 0;
      const netDue = b.dueAmount ?? (b.totalBill - (bazar + b.totalPaid));
      const isRefund = netDue < 0;
      const absDue = Math.abs(netDue);

      summaryText += `${idx + 1}. ${b.user.name}:\n`;
      summaryText += `   - House Rent: ৳${b.roomRent}\n`;
      summaryText += `   - Meal Cost: ৳${b.mealCost.toFixed(0)} (${b.totalMeals} meals @ ৳${b.mealRate.toFixed(1)})\n`;
      summaryText += `   - Utilities & Services: ৳${utilTotal.toFixed(0)} (Elec: ৳${elec.toFixed(0)}, Khala: ৳${khala.toFixed(0)}, Wifi: ৳${wifi.toFixed(0)}, Gas: ৳${gas.toFixed(0)})\n`;
      summaryText += `   - Total Invoiced: ৳${b.totalBill.toFixed(0)}\n`;
      summaryText += `   - Bazar Deposited: -৳${bazar.toFixed(0)}\n`;
      summaryText += `   👉 ${isRefund ? `REFUND RECEIVABLE: ৳${absDue.toFixed(0)}` : netDue === 0 ? "SETTLED" : `FINAL PAYABLE: ৳${absDue.toFixed(0)}`}\n\n`;
    });

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast.success("Detailed monthly report summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<FileText className="w-6 h-6" />}
      title="Full Monthly PDF Report"
      subtitle={`Detailed printable statement & breakdown for ${monthStr}`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Full Summary"}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" /> Download PDF / Print
          </button>
        </div>
      }
    >
      {/* PRINTABLE DOCUMENT CONTENT */}
      <div id="printable-monthly-report" className="space-y-6 print:space-y-4">
        
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:border-black print:pb-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 print:text-blue-700">
              MESS-MATE MONTHLY INVOICES & BILLS STATEMENT REPORT
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black tracking-tight mt-1">
              {messName}
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
              Detailed Itemized Expenses: House Rent, Internet, Electricity, Maid (Khala), Gas & Meals
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-900/80 print:bg-gray-100 p-3.5 rounded-2xl border border-slate-800 print:border-gray-300">
            <div className="text-xs text-slate-400 print:text-gray-600">Billing Period (মাস)</div>
            <div className="text-base font-extrabold text-blue-400 print:text-blue-900 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4" /> {monthStr}
            </div>
            <div className="text-[10px] text-slate-500 print:text-gray-500 mt-1">
              Generated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Key Overview KPIs */}
        <div className="grid grid-cols-3 gap-3 print:gap-2">
          <div className="bg-slate-950/70 print:bg-gray-50 p-3.5 rounded-2xl border border-slate-800 print:border-gray-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-600 block">
              Total Billed (মোট খরচের বিল)
            </span>
            <span className="text-lg sm:text-xl font-black text-white print:text-black mt-1 block">
              ৳{totalBilled.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 print:bg-gray-50 p-3.5 rounded-2xl border border-slate-800 print:border-gray-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-600 block">
              Total Collected (সংগৃহীত টাকা)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 print:text-emerald-700 mt-1 block">
              ৳{totalCollected.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 print:bg-gray-50 p-3.5 rounded-2xl border border-slate-800 print:border-gray-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-600 block">
              Outstanding Due (বকেয়া পাওনা)
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-400 print:text-rose-700 mt-1 block">
              ৳{totalDue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* EXPLICIT CENTRAL EXPENSES BREAKDOWN SECTION (House Rent, Internet, Electricity, Khala, Gas, Water) */}
        <div className="bg-slate-950/80 print:bg-gray-50 p-4 sm:p-5 rounded-2xl border border-slate-800 print:border-gray-400 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-gray-300 pb-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 print:text-blue-800 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Itemized Utility & House Expense Summary (মেসের সার্বিক খরচের হিসাব)
            </span>
            <span className="text-xs text-slate-300 print:text-gray-700 font-bold">
              {activeMembers} Active Members
            </span>
          </div>

          {/* 6-Card Grid: House Rent, Electricity, Internet, Khala, Gas, Meals */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs print:text-[10px]">
            
            {/* 1. House Rent */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-blue-400 print:text-blue-800 font-bold flex items-center gap-1">
                <Home className="w-3 h-3" /> House Rent (বাসা ভাড়া)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalRent.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">Total Mess House Rent</div>
            </div>

            {/* 2. Electricity */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-amber-400 print:text-amber-800 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Electricity (বিদ্যুৎ)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalElectricity.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">৳{perMemberElectricity.toFixed(0)} / member</div>
            </div>

            {/* 3. Internet / WiFi */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-purple-400 print:text-purple-800 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Internet (ওয়াইফাই)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalWifi.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">৳{perMemberWifi.toFixed(0)} / member</div>
            </div>

            {/* 4. Khala / Maid Salary */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-pink-400 print:text-pink-800 font-bold flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Khala (বুয়া/খালা)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalKhala.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">৳{perMemberKhala.toFixed(0)} / member</div>
            </div>

            {/* 5. Gas Bill */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-orange-400 print:text-orange-800 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> Gas Bill (গ্যাস)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalGas.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">৳{perMemberGas.toFixed(0)} / member</div>
            </div>

            {/* 6. Food & Meal Rate */}
            <div className="p-3 bg-slate-900/90 print:bg-white rounded-xl border border-slate-800 print:border-gray-300 space-y-1">
              <div className="text-[10px] text-emerald-400 print:text-emerald-800 font-bold flex items-center gap-1">
                <Utensils className="w-3 h-3" /> Food & Meals (মিল)
              </div>
              <div className="font-extrabold text-white print:text-black text-sm">৳{totalFood.toLocaleString()}</div>
              <div className="text-[9px] text-slate-400 print:text-gray-600">Rate: ৳{mealRate.toFixed(2)} ({totalMeals} meals)</div>
            </div>

          </div>
        </div>

        {/* Full Itemized Member Breakdown Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
            Detailed Member Statements & Itemized Charges (সকল সদস্যের হিসাব)
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 print:border-gray-400 bg-slate-950/80 print:bg-white">
            <table className="w-full text-left text-xs print:text-[10px] text-slate-300 print:text-black">
              <thead className="bg-slate-900 print:bg-gray-200 text-slate-400 print:text-black font-bold uppercase border-b border-slate-800 print:border-gray-400">
                <tr>
                  <th className="px-3 py-2.5">Member Name</th>
                  <th className="px-2 py-2.5 text-center">House Rent</th>
                  <th className="px-2 py-2.5 text-center">Shared Utilities</th>
                  <th className="px-2 py-2.5 text-center">Meals</th>
                  <th className="px-2 py-2.5 text-center">Meal Cost</th>
                  <th className="px-2 py-2.5 text-right">Total Bill</th>
                  <th className="px-2 py-2.5 text-right">Bazar Done</th>
                  <th className="px-3 py-2.5 text-center">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                {bills.map((b) => {
                  const elec = b.electricityShare || perMemberElectricity;
                  const gas = b.gasShare || perMemberGas;
                  const water = b.waterShare || perMemberWater;
                  const khala = b.khalaShare || perMemberKhala;
                  const wifi = b.wifiShare || perMemberWifi;
                  const other = b.otherCharges || perMemberOther;
                  const utilTotal = b.utilityShare || (elec + gas + water + khala + wifi + other);
                  const bazar = b.bazarDeposited || 0;
                  const netDue = b.dueAmount ?? (b.totalBill - (bazar + b.totalPaid));
                  const isRefund = netDue < 0;
                  const absDue = Math.abs(netDue);

                  return (
                    <tr key={b.id} className="hover:bg-slate-900/50 print:hover:bg-transparent">
                      {/* Member Name */}
                      <td className="px-3 py-2.5 font-semibold text-white print:text-black">
                        <div>{b.user.name}</div>
                        <div className="text-[10px] text-slate-400 print:text-gray-600 font-normal">{b.user.email}</div>
                      </td>

                      {/* House Rent */}
                      <td className="px-2 py-2.5 text-center font-bold text-blue-400 print:text-black">
                        ৳{b.roomRent.toLocaleString()}
                      </td>

                      {/* Shared Utilities Breakdown Tooltip/Detail */}
                      <td className="px-2 py-2.5 text-center font-semibold text-purple-400 print:text-black">
                        <div>৳{utilTotal.toFixed(0)}</div>
                        <div className="text-[9px] text-slate-400 print:text-gray-600 font-normal">
                          (Elec: ৳{elec.toFixed(0)}, Khala: ৳{khala.toFixed(0)}, Wifi: ৳{wifi.toFixed(0)})
                        </div>
                      </td>

                      {/* Meals Count */}
                      <td className="px-2 py-2.5 text-center text-slate-300 print:text-black font-medium">
                        {b.totalMeals} meals
                      </td>

                      {/* Meal Cost */}
                      <td className="px-2 py-2.5 text-center font-semibold text-amber-400 print:text-black">
                        ৳{b.mealCost.toFixed(0)}
                      </td>

                      {/* Total Invoiced Bill */}
                      <td className="px-2 py-2.5 text-right font-extrabold text-white print:text-black">
                        ৳{b.totalBill.toFixed(0)}
                      </td>

                      {/* Bazar Deposited */}
                      <td className="px-2 py-2.5 text-right font-bold text-emerald-400 print:text-black">
                        ৳{bazar.toFixed(0)}
                      </td>

                      {/* Net Final Status */}
                      <td className="px-3 py-2.5 text-center font-bold">
                        {isRefund ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800 text-[10px]">
                            Refund: ৳{absDue.toFixed(0)}
                          </span>
                        ) : netDue === 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 print:bg-gray-100 print:text-gray-800 text-[10px]">
                            Settled
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 print:bg-rose-100 print:text-rose-800 text-[10px]">
                            Pay: ৳{absDue.toFixed(0)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="pt-8 print:pt-12 grid grid-cols-2 gap-8 border-t border-slate-800 print:border-gray-400 text-xs text-slate-400 print:text-black">
          <div className="text-center space-y-8">
            <div className="border-b border-dashed border-slate-700 print:border-gray-400 w-48 mx-auto" />
            <div>Prepared By (Mess Manager Signature)</div>
          </div>

          <div className="text-center space-y-8">
            <div className="border-b border-dashed border-slate-700 print:border-gray-400 w-48 mx-auto" />
            <div>Verified & Approved By (Audit / Mess Committee)</div>
          </div>
        </div>

      </div>
    </AppDrawer>
  );
}
