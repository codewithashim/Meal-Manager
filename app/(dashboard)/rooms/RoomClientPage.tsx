"use client";

import { useState, useTransition } from "react";
import RoomCard from "@/components/rooms/RoomCard";
import RoomModal, { RoomData } from "@/components/rooms/RoomModal";
import AssignSeatModal from "@/components/rooms/AssignSeatModal";
import { BedDouble, Plus, Search, Filter, Layers, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { getRooms, getUnassignedUsers } from "@/server/actions/roomActions";

interface RoomClientPageProps {
  initialRooms: any[];
  initialUnassignedUsers: any[];
  currentUserId: string;
  currentUserRole: string;
}

export default function RoomClientPage({
  initialRooms,
  initialUnassignedUsers,
  currentUserId,
  currentUserRole,
}: RoomClientPageProps) {
  const [rooms, setRooms] = useState<any[]>(initialRooms);
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>(initialUnassignedUsers);
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState<RoomData | null>(null);

  // Seat Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ seatId: string; seatNumber: string; roomName: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  const handleRefresh = async () => {
    startTransition(async () => {
      const refreshedRooms = await getRooms();
      const refreshedUnassigned = await getUnassignedUsers();
      setRooms(refreshedRooms as any);
      setUnassignedUsers(refreshedUnassigned as any);
    });
  };

  const openCreateRoomModal = () => {
    setSelectedRoomToEdit(null);
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: any) => {
    setSelectedRoomToEdit(room);
    setIsRoomModalOpen(true);
  };

  const openAssignSeatModal = (seatId: string, seatNumber: string, roomName: string) => {
    setAssignTarget({ seatId, seatNumber, roomName });
    setIsAssignModalOpen(true);
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFloor = floorFilter === "ALL" || r.floor.toString() === floorFilter;
    return matchesSearch && matchesFloor;
  });

  // Unique floors for filter dropdown
  const uniqueFloors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  // Overall KPI statistics
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalOccupied = rooms.reduce((acc, r) => acc + r.occupiedSeats, 0);
  const totalVacant = totalCapacity - totalOccupied;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-blue-500" />
            Rooms & Seat Allocation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage floor plans, room capacities, seat slots, and member room assignments.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateRoomModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add New Room
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rooms</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalRooms}</div>
          <p className="text-xs text-slate-400 mt-1">Configured mess rooms</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Capacity</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{totalCapacity} seats</div>
          <p className="text-xs text-slate-400 mt-1">Max member accommodation</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Occupied Seats</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{totalOccupied}</div>
          <p className="text-xs text-slate-400 mt-1">Currently assigned members</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vacant Seats</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{totalVacant}</div>
          <p className="text-xs text-slate-400 mt-1">Available for new members</p>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room by name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-300 w-full md:w-auto">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Floor:</span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Floors</option>
            {uniqueFloors.map((f) => (
              <option key={f} value={f.toString()} className="bg-slate-900">
                Floor {f}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Rooms Cards Grid */}
      {filteredRooms.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <BedDouble className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-white">No Rooms Found</h3>
          <p className="text-sm text-slate-400 mt-1">
            No rooms match your filter criteria or no rooms have been added yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEditRoom={openEditRoomModal}
              onAssignSeat={openAssignSeatModal}
              onRefresh={handleRefresh}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomToEdit={selectedRoomToEdit}
        onSuccess={handleRefresh}
      />

      {/* Assign Member to Seat Modal */}
      <AssignSeatModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        seatId={assignTarget?.seatId || null}
        seatNumber={assignTarget?.seatNumber || null}
        roomName={assignTarget?.roomName || null}
        unassignedUsers={unassignedUsers}
        onSuccess={handleRefresh}
      />

    </div>
  );
}
