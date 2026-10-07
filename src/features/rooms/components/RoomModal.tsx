"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, BedDouble, Save, Loader2, Layers, Users } from "lucide-react";
import { createRoom, updateRoom } from "@/server/actions/roomActions";
import { toast } from "sonner";

export interface RoomData {
  id?: string;
  name: string;
  floor: number;
  capacity: number;
  status: "AVAILABLE" | "FULL" | "MAINTENANCE";
}

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: RoomData | null;
  onSuccess: () => void;
}

export default function RoomModal({ isOpen, onClose, roomToEdit, onSuccess }: RoomModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    floor: 1,
    capacity: 2,
    status: "AVAILABLE" as "AVAILABLE" | "FULL" | "MAINTENANCE",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (roomToEdit) {
      setFormData({
        name: roomToEdit.name || "",
        floor: roomToEdit.floor || 1,
        capacity: roomToEdit.capacity || 2,
        status: roomToEdit.status || "AVAILABLE",
      });
    } else {
      setFormData({
        name: "",
        floor: 1,
        capacity: 2,
        status: "AVAILABLE",
      });
    }
  }, [roomToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (roomToEdit && roomToEdit.id) {
        const res = await updateRoom({
          id: roomToEdit.id,
          ...formData,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Room updated successfully!");
          onSuccess();
          onClose();
        }
      } else {
        const res = await createRoom(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Room created successfully!");
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred.");
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
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {roomToEdit ? "Edit Room Details" : "Add New Room"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {roomToEdit ? "Modify room capacity or status." : "Create a room and auto-generate seat slots."}
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
            <form id="room-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Room Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room Name / Number *</label>
                <div className="relative">
                  <BedDouble className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Room 101 or North Wing A"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Floor Level */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Floor Level *</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Seat Capacity *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                    />
                  </div>
                </div>

              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                >
                  <option value="AVAILABLE">AVAILABLE (Seats Vacant)</option>
                  <option value="FULL">FULL (Fully Occupied)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Under Repair)</option>
                </select>
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
              form="room-drawer-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {roomToEdit ? "Save Changes" : "Create Room"}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
