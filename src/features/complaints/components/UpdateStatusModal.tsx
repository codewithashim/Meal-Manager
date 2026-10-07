"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { updateComplaintStatus } from "@/server/actions/communicationActions";
import { complaintStatuses } from "@/lib/validations/communication";
import { toast } from "sonner";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string | null;
  currentStatus: string | null;
  onSuccess: () => void;
}

export default function UpdateStatusModal({
  isOpen,
  onClose,
  complaintId,
  currentStatus,
  onSuccess,
}: UpdateStatusModalProps) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<typeof complaintStatuses[number]>(
    (currentStatus as any) || "IN_PROGRESS"
  );
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !complaintId || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateComplaintStatus({
        id: complaintId,
        status,
        adminNote,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Complaint status updated to ${status}`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to update status.");
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
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Update Ticket Resolution</h2>
                  <p className="text-xs text-slate-400">Change resolution status & add manager response.</p>
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
            <form id="status-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                >
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Work Underway)</option>
                  <option value="RESOLVED">RESOLVED (Fixed & Closed)</option>
                  <option value="REJECTED">REJECTED (Invalid / Declined)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Manager Response Note</label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Electrician fixed the connection..."
                  className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                />
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
              form="status-drawer-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Status
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
