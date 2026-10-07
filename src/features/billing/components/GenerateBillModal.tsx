"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Loader2,
  Calendar,
  Zap,
  Flame,
  Droplets,
  UserCheck,
  Wifi,
  PlusCircle,
  Sparkles,
  Users,
  Calculator,
} from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import { generateMonthlyBills, getExpenseSummaryForMonth } from "@/server/actions/billingActions";
import { toast } from "sonner";

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth: string;
  onSuccess: () => void;
}

export default function GenerateBillModal({
  isOpen,
  onClose,
  defaultMonth,
  onSuccess,
}: GenerateBillModalProps) {
  const [mounted, setMounted] = useState(false);
  const [month, setMonth] = useState(defaultMonth);

  // Bill breakdown states (Total Mess Bills or Per-Member)
  const [isTotalMessBills, setIsTotalMessBills] = useState(true);
  const [electricityBill, setElectricityBill] = useState<number>(0);
  const [gasBill, setGasBill] = useState<number>(0);
  const [waterBill, setWaterBill] = useState<number>(0);
  const [khalaBill, setKhalaBill] = useState<number>(0);
  const [wifiBill, setWifiBill] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);

  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch expense summary whenever month changes or modal opens
  useEffect(() => {
    if (isOpen && mounted) {
      loadExpenseSummary(month);
    }
  }, [isOpen, mounted, month]);

  const loadExpenseSummary = async (targetMonth: string) => {
    setFetchingExpenses(true);
    try {
      const summary = await getExpenseSummaryForMonth(targetMonth);
      if (summary) {
        setActiveUsersCount(summary.activeUsersCount || 1);
      }
    } catch (err) {
      // ignore
    } finally {
      setFetchingExpenses(false);
    }
  };

  const handleAutoFillFromExpenses = async () => {
    setFetchingExpenses(true);
    try {
      const summary = await getExpenseSummaryForMonth(month);
      if (summary) {
        setActiveUsersCount(summary.activeUsersCount || 1);
        if (isTotalMessBills) {
          setElectricityBill(summary.totalElectricity || 0);
          setGasBill(summary.totalGas || 0);
          setWaterBill(summary.totalWater || 0);
          setKhalaBill(summary.totalKhala || 0);
          setWifiBill(summary.totalWifi || 0);
          setOtherCharges(summary.totalOther || 0);
        } else {
          setElectricityBill(Math.round(summary.perMember.electricity || 0));
          setGasBill(Math.round(summary.perMember.gas || 0));
          setWaterBill(Math.round(summary.perMember.water || 0));
          setKhalaBill(Math.round(summary.perMember.khala || 0));
          setWifiBill(Math.round(summary.perMember.wifi || 0));
          setOtherCharges(Math.round(summary.perMember.other || 0));
        }
        toast.success("Auto-filled totals from recorded expenses!");
      }
    } catch (err) {
      toast.error("Failed to auto-fetch recorded expenses.");
    } finally {
      setFetchingExpenses(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // Live calculation per member
  const count = Math.max(1, activeUsersCount);
  const perMemberElec = isTotalMessBills ? electricityBill / count : electricityBill;
  const perMemberGas = isTotalMessBills ? gasBill / count : gasBill;
  const perMemberWater = isTotalMessBills ? waterBill / count : waterBill;
  const perMemberKhala = isTotalMessBills ? khalaBill / count : khalaBill;
  const perMemberWifi = isTotalMessBills ? wifiBill / count : wifiBill;
  const perMemberOther = isTotalMessBills ? otherCharges / count : otherCharges;

  const totalPerMemberUtility =
    perMemberElec + perMemberGas + perMemberWater + perMemberKhala + perMemberWifi + perMemberOther;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await generateMonthlyBills({
        month,
        electricityBill,
        gasBill,
        waterBill,
        khalaBill,
        wifiBill,
        otherChargesPerMember: perMemberOther,
        utilitySharePerMember: 0,
        isTotalMessBills,
      });

      if ("error" in res && res.error) {
        toast.error(res.error);
      } else if ("count" in res) {
        toast.success(
          `Generated bills for ${res.count} members! Meal Rate: ৳${(res.mealRate ?? 0).toFixed(2)}`
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to generate monthly bills.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<Calculator className="w-6 h-6 text-blue-400" />}
      title="Mess Bill & Expense Calculator"
      subtitle="Transparently calculate & split Rent, Utilities, Khala, Wifi, and Meals."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="bill-drawer-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate & Publish Invoices
          </button>
        </div>
      }
    >
      {/* Quick Auto-Fill Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-blue-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Auto-fetch logged monthly expenses?</span>
        </div>
        <button
          type="button"
          onClick={handleAutoFillFromExpenses}
          disabled={fetchingExpenses}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {fetchingExpenses ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Auto-fill
        </button>
      </div>

      {/* Form */}
      <form id="bill-drawer-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
        
        {/* Target Month & Calculation Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Billing Month *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Calculation Input Mode
            </label>
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsTotalMessBills(true)}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  isTotalMessBills
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Total Mess Bills
              </button>
              <button
                type="button"
                onClick={() => setIsTotalMessBills(false)}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  !isTotalMessBills
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Per Member
              </button>
            </div>
          </div>
        </div>

        {/* Active Members Info */}
        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>
            Active Members Sharing Expenses:{" "}
            <strong className="text-white font-bold">{count} Members</strong>
          </span>
        </div>

        {/* Inputs Grid for Mess Expenses */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            Itemized Mess Utility & Service Bills ({isTotalMessBills ? "Total Mess Amount ৳" : "Per Member Amount ৳"})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Electricity */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity (বিদ্যুৎ বিল)
              </label>
              <input
                type="number"
                min="0"
                value={electricityBill || ""}
                onChange={(e) => setElectricityBill(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 3000" : "e.g. 500"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Gas */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Gas (গ্যাস / Gell বিল)
              </label>
              <input
                type="number"
                min="0"
                value={gasBill || ""}
                onChange={(e) => setGasBill(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 1200" : "e.g. 200"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Water */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Water (পানি বিল)
              </label>
              <input
                type="number"
                min="0"
                value={waterBill || ""}
                onChange={(e) => setWaterBill(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 600" : "e.g. 100"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Khala / Maid */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-pink-400" /> Khala / Cook (খালা বিল)
              </label>
              <input
                type="number"
                min="0"
                value={khalaBill || ""}
                onChange={(e) => setKhalaBill(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 3600" : "e.g. 600"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* WiFi */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-purple-400" /> Internet / WiFi (ওয়াইফাই)
              </label>
              <input
                type="number"
                min="0"
                value={wifiBill || ""}
                onChange={(e) => setWifiBill(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 1200" : "e.g. 200"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Other Charges */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Other / Maintenance
              </label>
              <input
                type="number"
                min="0"
                value={otherCharges || ""}
                onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                placeholder={isTotalMessBills ? "e.g. 600" : "e.g. 100"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

          </div>
        </div>

        {/* Live Preview Split Summary Card */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-semibold text-white">Live Split Breakdown ({count} members)</span>
            <span className="text-emerald-400 font-bold">
              Total Utility Share: ৳{Math.round(totalPerMemberUtility)} / member
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-amber-400 block font-medium">Electricity</span>
              <strong className="text-white">৳{perMemberElec.toFixed(0)}</strong>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-orange-400 block font-medium">Gas (Gell)</span>
              <strong className="text-white">৳{perMemberGas.toFixed(0)}</strong>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-cyan-400 block font-medium">Water</span>
              <strong className="text-white">৳{perMemberWater.toFixed(0)}</strong>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-pink-400 block font-medium">Khala</span>
              <strong className="text-white">৳{perMemberKhala.toFixed(0)}</strong>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-purple-400 block font-medium">WiFi</span>
              <strong className="text-white">৳{perMemberWifi.toFixed(0)}</strong>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-emerald-400 block font-medium">Other</span>
              <strong className="text-white">৳{perMemberOther.toFixed(0)}</strong>
            </div>
          </div>
        </div>

      </form>
    </AppDrawer>
  );
}
