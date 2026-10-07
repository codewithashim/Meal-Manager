"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus, Save, Loader2, User, Phone, Mail, CreditCard, Lock } from "lucide-react";
import { createUser, updateUser } from "@/server/actions/userActions";
import { toast } from "sonner";

export interface UserData {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "ADMIN" | "MANAGER" | "USER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  monthlyRent: number;
  mealStatus: boolean;
  permissions?: string[];
  nidNumber?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  occupation?: string | null;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserData | null;
  onSuccess: () => void;
}

export default function UserModal({ isOpen, onClose, userToEdit, onSuccess }: UserModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER" as "ADMIN" | "MANAGER" | "USER",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "SUSPENDED",
    monthlyRent: 0,
    mealStatus: true,
    nidNumber: "",
    emergencyContact: "",
    address: "",
    occupation: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        phone: userToEdit.phone || "",
        password: "",
        role: userToEdit.role || "USER",
        status: userToEdit.status || "ACTIVE",
        monthlyRent: userToEdit.monthlyRent || 0,
        mealStatus: userToEdit.mealStatus ?? true,
        nidNumber: userToEdit.nidNumber || "",
        emergencyContact: userToEdit.emergencyContact || "",
        address: userToEdit.address || "",
        occupation: userToEdit.occupation || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "USER",
        status: "ACTIVE",
        monthlyRent: 0,
        mealStatus: true,
        nidNumber: "",
        emergencyContact: "",
        address: "",
        occupation: "",
      });
    }
  }, [userToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userToEdit && userToEdit.id) {
        const res = await updateUser({
          id: userToEdit.id,
          ...formData,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("User updated successfully!");
          onSuccess();
          onClose();
        }
      } else {
        if (!formData.password) {
          toast.error("Password is required for new users.");
          setLoading(false);
          return;
        }

        const res = await createUser(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("User created successfully!");
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred.");
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
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  {userToEdit ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {userToEdit ? "Edit Member Profile" : "Register Member"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {userToEdit ? "Update member details, role, or rent." : "Add a new member to the mess."}
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
            <form id="user-drawer-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password {userToEdit ? "(Leave blank to keep unchanged)" : "*"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required={!userToEdit}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={userToEdit ? "••••••••" : "Min 6 characters"}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                  >
                    <option value="USER">General Member</option>
                    <option value="MANAGER">Mess Manager</option>
                    <option value="ADMIN">Super Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Room Rent (৳)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                  />
                </div>
              </div>

              {/* Meal Participation Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Daily Meal Status</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mealStatus: !formData.mealStatus })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.mealStatus ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.mealStatus ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="Student / Engineer"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
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
              form="user-drawer-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {userToEdit ? "Save Changes" : "Create User"}
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
