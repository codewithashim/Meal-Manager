"use client";

import { useState, useTransition } from "react";
import ComplaintModal from "@/components/complaints/ComplaintModal";
import UpdateStatusModal from "@/components/complaints/UpdateStatusModal";
import { MessageSquareWarning, Plus, Search, Filter, AlertTriangle, CheckCircle2, Clock, XCircle, User } from "lucide-react";
import { getComplaints } from "@/server/actions/communicationActions";

interface ComplaintClientPageProps {
  initialComplaints: any[];
  currentUserRole: string;
}

export default function ComplaintClientPage({ initialComplaints, currentUserRole }: ComplaintClientPageProps) {
  const [complaints, setComplaints] = useState<any[]>(initialComplaints);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status update modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<{ id: string; status: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshed = await getComplaints(statusFilter, categoryFilter);
      setComplaints(refreshed);
    });
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    startTransition(async () => {
      const refreshed = await getComplaints(val, categoryFilter);
      setComplaints(refreshed);
    });
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    startTransition(async () => {
      const refreshed = await getComplaints(statusFilter, val);
      setComplaints(refreshed);
    });
  };

  const openStatusModal = (id: string, status: string) => {
    setSelectedComplaint({ id, status });
    setIsStatusModalOpen(true);
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-7 h-7 text-amber-400" />
            Member Complaints & Service Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit issues regarding mess facilities, food, utilities, or maintenance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Submit Complaint
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint title or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Status</option>
              <option value="PENDING" className="bg-slate-900">Pending</option>
              <option value="IN_PROGRESS" className="bg-slate-900">In Progress</option>
              <option value="RESOLVED" className="bg-slate-900">Resolved</option>
              <option value="REJECTED" className="bg-slate-900">Rejected</option>
            </select>
          </div>

        </div>

      </div>

      {/* Tickets List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComplaints.length === 0 ? (
          <div className="md:col-span-2 glass-card rounded-2xl p-12 text-center border border-slate-800">
            <MessageSquareWarning className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-lg font-medium text-white">No Tickets Found</h3>
            <p className="text-sm text-slate-400 mt-1">No complaints match your filters.</p>
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <div key={c.id} className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase">
                    {c.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(c.priority)}
                    {getStatusBadge(c.status)}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-1">{c.title}</h3>
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{c.description}</p>
              </div>

              {/* Admin Note if present */}
              {c.adminNote && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-blue-400 block mb-0.5">Manager Response:</span>
                  {c.adminNote}
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.user?.name || "Member"}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>{new Date(c.createdAt).toISOString().split("T")[0]}</span>
                  {canManage && (
                    <button
                      onClick={() => openStatusModal(c.id, c.status)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium transition"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        complaintId={selectedComplaint?.id || null}
        currentStatus={selectedComplaint?.status || null}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
