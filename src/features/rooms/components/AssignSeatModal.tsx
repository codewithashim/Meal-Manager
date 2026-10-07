"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, Loader2 } from "lucide-react";
import { assignSeat } from "@/server/actions/roomActions";
import { toast } from "sonner";

interface UnassignedUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  monthlyRent: number;
}

interface AssignSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatId: string | null;
  seatNumber: string | null;
  roomName: string | null;
  unassignedUsers: UnassignedUser[];
  onSuccess: () => void;
}

export default function AssignSeatModal({
  isOpen,
  onClose,
  seatId,
  seatNumber,
  roomName,
  unassignedUsers,
  onSuccess,
}: AssignSeatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !seatId || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a member.");
      return;
    }

    setLoading(true);
    try {
      const res = await assignSeat({
        userId: selectedUserId,
        seatId,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Member assigned to seat successfully!");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error("Failed to assign member to seat.");
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
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Assign Seat Slot</h2>
                  <p className="text-xs text-slate-400">
                    Assigning to <span className="font-semibold text-emerald-400">{seatNumber}</span> ({roomName})
                  </p>
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
            <form id="assign-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Unassigned Member *</label>
                {unassignedUsers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-center">
                    All registered members currently have seat assignments!
                  </div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {unassignedUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
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
              form="assign-drawer-form"
              type="submit"
              disabled={loading || unassignedUsers.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign to Seat
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
