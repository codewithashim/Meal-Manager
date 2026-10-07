"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageSquareWarning, Loader2, Tag, AlertTriangle, FileText } from "lucide-react";
import { createComplaint } from "@/server/actions/communicationActions";
import { complaintCategories, priorities } from "@/lib/validations/communication";
import { toast } from "sonner";

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComplaintModal({ isOpen, onClose, onSuccess }: ComplaintModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "MAINTENANCE" as typeof complaintCategories[number],
    priority: "MEDIUM" as typeof priorities[number],
    description: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createComplaint(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Complaint ticket submitted successfully!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to submit complaint.");
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
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Submit Service Ticket</h2>
                  <p className="text-xs text-slate-400">Report issues regarding food, maintenance, or utilities.</p>
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
            <form id="complaint-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Issue Title *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. WiFi not working in Room 102"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    >
                      {complaintCategories.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority *</label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    >
                      <option value="LOW" className="bg-slate-900 text-slate-300">LOW</option>
                      <option value="MEDIUM" className="bg-slate-900 text-blue-400">MEDIUM</option>
                      <option value="HIGH" className="bg-slate-900 text-amber-400">HIGH</option>
                      <option value="URGENT" className="bg-slate-900 text-rose-400">URGENT</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
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
              form="complaint-drawer-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Ticket
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
