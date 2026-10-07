"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, KeyRound, History, UserCheck, Lock, CheckCircle2 } from "lucide-react";
import AccessControlModal from "@/components/users/AccessControlModal";
import { getUsers } from "@/server/actions/userActions";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  timestamp: Date;
  actor: {
    name: string;
    email: string;
  };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions?: string[];
}

interface AuditLogsClientPageProps {
  initialLogs: AuditLogItem[];
  initialUsers: UserItem[];
}

export function AuditLogsClientPage({ initialLogs, initialUsers }: AuditLogsClientPageProps) {
  const [activeTab, setActiveTab] = useState<"access" | "audit">("access");
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers as any);
    });
  };

  const openAccessModal = (user: UserItem) => {
    setSelectedUser(user);
    setIsAccessModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-purple-400" />
            Access Control & Security Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage granular feature access control permissions for all users and inspect system security audit trails.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("access")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "access"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>User Access Control</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "audit"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Logs ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: User Access Control Center */}
      {activeTab === "access" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Granular Feature Permissions Matrix</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Admins can configure individual feature permissions (Meals, Expenses, Payments, Bills, Rooms, Users, Complaints, Notices, Audit Logs) for any member. When granted, the user receives access automatically in their navigation sidebar & server operations.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User Member</th>
                    <th className="px-6 py-4">Base Role</th>
                    <th className="px-6 py-4">Active Custom Permissions</th>
                    <th className="px-6 py-4 text-right">Access Control Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {u.permissions && u.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {u.permissions.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono font-bold"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Default role permissions
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openAccessModal(u)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Configure Access</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & System Audit Logs Stream */}
      {activeTab === "audit" && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{log.actor.name}</div>
                        <div className="text-xs text-slate-400">{log.actor.email}</div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{log.entity}</td>

                      <td className="px-6 py-4 text-xs text-slate-300">{log.details || "-"}</td>

                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Access Control Modal */}
      <AccessControlModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        user={selectedUser}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
