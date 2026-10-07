"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AVAILABLE_PERMISSIONS, Resource } from "@/lib/permissions";
import { updateUserPermissions } from "@/server/actions/userActions";
import { toast } from "sonner";
import { ShieldCheck, X, CheckCircle2, Lock, Loader2, KeyRound } from "lucide-react";

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
  } | null;
  onSuccess: () => void;
}

export default function AccessControlModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: AccessControlModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.permissions || []);
    } else {
      setSelectedPermissions([]);
    }
  }, [user]);

  if (!isOpen || !mounted || !user) return null;

  const isPermissionSelected = (id: string) => selectedPermissions.includes(id);

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSelectAll = () => {
    const all = AVAILABLE_PERMISSIONS.map((p) => p.id);
    setSelectedPermissions(all);
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) return;
      const res = await updateUserPermissions(user.id, selectedPermissions);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Updated access control permissions for ${user.name}`);
        onSuccess();
        onClose();
      }
    } catch {
      toast.error("Failed to update access permissions.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6 z-10 animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Access Control Management
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure feature access permissions for{" "}
                  <span className="text-purple-300 font-bold">{user.name}</span> ({user.email})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Alert */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Default Base Role:</span>
              <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-slate-400 hover:text-slate-300 transition cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Permissions Matrix Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isSelected = isPermissionSelected(perm.id);
                return (
                  <div
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isSelected
                        ? "bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-950/30"
                        : "bg-slate-950/40 border-slate-800/90 hover:border-slate-700"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isSelected
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{perm.label}</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Access Permissions</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
