"use client";

import { useState, useTransition } from "react";
import { UserData } from "@/components/users/UserModal";
import UserTable from "@/components/users/UserTable";
import UserModal from "@/components/users/UserModal";
import AccessControlModal from "@/components/users/AccessControlModal";
import { Users, UserPlus, Search, Filter, ShieldCheck, Utensils, AlertCircle } from "lucide-react";
import { getUsers } from "@/server/actions/userActions";

interface UserClientPageProps {
  initialUsers: UserData[];
  currentUserId: string;
  currentUserRole: string;
}

export default function UserClientPage({ initialUsers, currentUserId, currentUserRole }: UserClientPageProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
  const [accessControlUser, setAccessControlUser] = useState<UserData | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshed = await getUsers(search, roleFilter, statusFilter);
      setUsers(refreshed as any);
    });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    startTransition(async () => {
      const filtered = await getUsers(val, roleFilter, statusFilter);
      setUsers(filtered as any);
    });
  };

  const handleRoleChange = (val: string) => {
    setRoleFilter(val);
    startTransition(async () => {
      const filtered = await getUsers(search, val, statusFilter);
      setUsers(filtered as any);
    });
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    startTransition(async () => {
      const filtered = await getUsers(search, roleFilter, val);
      setUsers(filtered as any);
    });
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const openAccessControlModal = (user: UserData) => {
    setAccessControlUser(user);
    setIsAccessControlOpen(true);
  };

  // Stats calculation
  const totalMembers = users.length;
  const activeMeals = users.filter((u) => u.mealStatus && u.status === "ACTIVE").length;
  const managersAndAdmins = users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER").length;
  const inactiveCount = users.filter((u) => u.status !== "ACTIVE").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            Member Directory & Access Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage mess members, grant feature access control permissions, assign roles, and track meal status.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Members</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalMembers}</div>
          <p className="text-xs text-slate-400 mt-1">Registered accounts</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Meals</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{activeMeals}</div>
          <p className="text-xs text-slate-400 mt-1">Members currently eating</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Staff & Admins</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{managersAndAdmins}</div>
          <p className="text-xs text-slate-400 mt-1">Admins & Managers</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inactive / Suspended</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{inactiveCount}</div>
          <p className="text-xs text-slate-400 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search member by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Roles</option>
              <option value="ADMIN" className="bg-slate-900">Admin</option>
              <option value="MANAGER" className="bg-slate-900">Manager</option>
              <option value="USER" className="bg-slate-900">General Member</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-300">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Status</option>
              <option value="ACTIVE" className="bg-slate-900">Active</option>
              <option value="INACTIVE" className="bg-slate-900">Inactive</option>
              <option value="SUSPENDED" className="bg-slate-900">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        onEdit={openEditModal}
        onAccessControl={openAccessControlModal}
        onRefresh={handleRefresh}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />

      {/* Add / Edit Member Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={selectedUser}
        onSuccess={handleRefresh}
      />

      {/* Access Control Modal */}
      <AccessControlModal
        isOpen={isAccessControlOpen}
        onClose={() => setIsAccessControlOpen(false)}
        user={accessControlUser}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
