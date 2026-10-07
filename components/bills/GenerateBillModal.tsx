"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileSpreadsheet, Loader2, Calendar, Zap, PlusCircle } from "lucide-react";
import { generateMonthlyBills } from "@/server/actions/billingActions";
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
  const [utilityShare, setUtilityShare] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await generateMonthlyBills({
        month,
        utilitySharePerMember: utilityShare,
        otherChargesPerMember: otherCharges,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Generated bills for ${res.count} members! Meal Rate: ৳${(res.mealRate ?? 0).toFixed(2)}`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to generate monthly bills.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-auto flex justify-end">
        <div className="w-full sm:w-[480px] glass-drawer p-5 sm:p-6 flex flex-col justify-between overflow-y-auto shadow-2xl text-slate-100 animate-slideLeft h-full">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Generate Monthly Invoices</h2>
                  <p className="text-xs text-slate-400">Calculate meal cost + rent + utilities for all members.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form id="bill-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Target Month */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Billing Month *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Utility Share */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Utility Share per Member (৳)</label>
                <div className="relative">
                  <Zap className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    value={utilityShare}
                    onChange={(e) => setUtilityShare(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500 (Electricity, Gas, Internet)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                  />
                </div>
              </div>

              {/* Other Charges */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Other / Maintenance Charges (৳)</label>
                <div className="relative">
                  <PlusCircle className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 100 (Cook salary share)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 mt-6 border-t border-slate-800 flex items-center justify-end gap-3 pb-8 sm:pb-0">
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Bills Now
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
