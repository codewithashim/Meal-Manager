"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, Calendar, DollarSign, CreditCard } from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import { recordPayment } from "@/server/actions/billingActions";
import { paymentMethods } from "@/lib/validations/billing";
import { toast } from "sonner";
import { getUsers } from "@/server/actions/userActions";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth: string;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  defaultMonth,
  onSuccess,
}: RecordPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    month: defaultMonth,
    paymentMethod: "CASH" as typeof paymentMethods[number],
    transactionId: "",
    note: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      getUsers()
        .then((data) => setUsers(data as any))
        .catch(() => toast.error("Failed to load members"))
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      toast.error("Please select a member.");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Recorded payment of ৳${formData.amount} successfully!`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<Wallet className="w-5 h-5 text-emerald-400" />}
      title="Record Member Payment"
      subtitle="Receive cash, bKash, Nagad, or bank payments."
      maxWidth="md"
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
            form="payment-drawer-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Payment
          </button>
        </div>
      }
    >
      {/* Form */}
      <form id="payment-drawer-form" onSubmit={handleSubmit} className="space-y-4">
        
        {/* Member Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Select Member *</label>
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
            required
          >
            <option value="">-- Select Member --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Amount (৳) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="number"
                min="1"
                step="any"
                required
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="3500"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white font-semibold"
              />
            </div>
          </div>

          {/* Target Month */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bill Month *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="month"
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
              />
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method *</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
              >
                <option value="CASH">CASH</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Transaction ID</label>
            <input
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              placeholder="TrxID / Reference"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
            />
          </div>

        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Payment Received Date *</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
          />
        </div>

      </form>
    </AppDrawer>
  );
}
