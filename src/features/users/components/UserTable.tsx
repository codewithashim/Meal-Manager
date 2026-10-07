"use client";

import { useState } from "react";
import { UserData } from "./UserModal";
import {
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  Utensils,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { deleteUser, toggleMealStatus } from "@/server/actions/userActions";
import { toast } from "sonner";

interface UserTableProps {
  users: UserData[];
  onEdit: (user: UserData) => void;
  onRefresh: () => void;
  onAccessControl?: (user: UserData) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function UserTable({
  users,
  onEdit,
  onRefresh,
  onAccessControl,
  currentUserId,
  currentUserRole,
}: UserTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete member "${name}"?`)) return;

    setDeletingId(id);
    try {
      const res = await deleteUser(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Deleted ${name} successfully.`);
        onRefresh();
      }
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleMeal = async (user: UserData) => {
    if (!user.id) return;
    try {
      const res = await toggleMealStatus(user.id, user.mealStatus);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Meal status updated for ${user.name}`);
        onRefresh();
      }
    } catch {
      toast.error("Failed to update meal status.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Shield className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <UserCheck className="w-3.5 h-3.5" /> Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Member
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Suspended
          </span>
        );
    }
  };

  if (users.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
          <UserCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No Members Found</h3>
        <p className="text-sm text-slate-400">
          No user accounts match your current filter or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Native Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-base leading-tight">{u.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span className="truncate max-w-[180px]">{u.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {getRoleBadge(u.role)}
                {getStatusBadge(u.status)}
              </div>
            </div>

            {/* Granted Custom Permissions pill tags if any */}
            {u.permissions && u.permissions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 bg-purple-950/20 p-2 rounded-xl border border-purple-800/40 text-[10px]">
                <span className="font-bold text-purple-300">Access Granted:</span>
                {u.permissions.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono font-bold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Info details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Monthly Rent</span>
                <span className="font-bold text-white text-sm">৳{u.monthlyRent.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="text-slate-200 font-mono truncate block">{u.phone || "N/A"}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
              <button
                onClick={() => handleToggleMeal(u)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  u.mealStatus
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                {u.mealStatus ? "Meals On" : "Meals Off"}
              </button>

              {currentUserRole === "ADMIN" && (
                <button
                  onClick={() => onAccessControl && onAccessControl(u)}
                  className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition"
                  title="Access Control & Feature Permissions"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onEdit(u)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Edit Member"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {currentUserRole === "ADMIN" && u.id !== currentUserId && (
                <button
                  onClick={() => u.id && handleDelete(u.id, u.name)}
                  disabled={deletingId === u.id}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                  title="Delete Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Member Info</th>
                <th className="px-6 py-4">Role & Granted Access</th>
                <th className="px-6 py-4">Meals</th>
                <th className="px-6 py-4">Monthly Rent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Member Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                          </span>
                          {u.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" /> {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Granted Permissions */}
                  <td className="px-6 py-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {getRoleBadge(u.role)}
                      {getStatusBadge(u.status)}
                    </div>

                    {u.permissions && u.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {u.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase font-mono font-bold"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic block">
                        Default role permissions
                      </span>
                    )}
                  </td>

                  {/* Meals Participation */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleMeal(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                        u.mealStatus
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      {u.mealStatus ? "Meals On" : "Meals Off"}
                    </button>
                  </td>

                  {/* Monthly Rent */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">৳{u.monthlyRent.toLocaleString()}</span>
                    <span className="text-xs text-slate-400"> / mo</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUserRole === "ADMIN" && (
                        <button
                          onClick={() => onAccessControl && onAccessControl(u)}
                          className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition cursor-pointer"
                          title="Access Control & Permissions"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onEdit(u)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {currentUserRole === "ADMIN" && u.id !== currentUserId && (
                        <button
                          onClick={() => u.id && handleDelete(u.id, u.name)}
                          disabled={deletingId === u.id}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
