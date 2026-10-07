"use client";

import { useState } from "react";
import { BedDouble, Layers, Users, UserCheck, UserPlus, LogOut, Edit2, Trash2, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { unassignSeat, deleteRoom } from "@/server/actions/roomActions";
import { toast } from "sonner";

interface SeatWithAssignment {
  id: string;
  seatNumber: string;
  status: "VACANT" | "OCCUPIED" | "RESERVED";
  roomAssignments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      monthlyRent: number;
    };
  }>;
}

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    floor: number;
    capacity: number;
    status: "AVAILABLE" | "FULL" | "MAINTENANCE";
    totalSeats: number;
    occupiedSeats: number;
    vacantSeats: number;
    seats: SeatWithAssignment[];
  };
  onEditRoom: (room: any) => void;
  onAssignSeat: (seatId: string, seatNumber: string, roomName: string) => void;
  onRefresh: () => void;
  canManage: boolean;
}

export default function RoomCard({ room, onEditRoom, onAssignSeat, onRefresh, canManage }: RoomCardProps) {
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const handleUnassign = async (assignmentId: string, memberName: string) => {
    if (!confirm(`Unassign ${memberName} from this seat?`)) return;

    setUnassigningId(assignmentId);
    try {
      const res = await unassignSeat(assignmentId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Unassigned ${memberName}.`);
        onRefresh();
      }
    } catch (err: any) {
      toast.error("Failed to unassign seat.");
    } finally {
      setUnassigningId(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!confirm(`Delete room "${room.name}"?`)) return;

    try {
      const res = await deleteRoom(room.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Deleted room ${room.name}.`);
        onRefresh();
      }
    } catch (err: any) {
      toast.error("Failed to delete room.");
    }
  };

  const occupancyPercent = Math.round((room.occupiedSeats / room.capacity) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Available
          </span>
        );
      case "FULL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Users className="w-3.5 h-3.5" /> Full
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Maintenance
          </span>
        );
    }
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
      
      {/* Room Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{room.name}</h3>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" /> Floor {room.floor}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(room.status)}
            {canManage && (
              <button
                onClick={() => onEditRoom(room)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Edit Room"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Occupancy</span>
            <span>
              <span className="text-white font-bold">{room.occupiedSeats}</span> / {room.capacity} seats ({occupancyPercent}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent === 100
                  ? "bg-blue-500"
                  : occupancyPercent > 0
                  ? "bg-emerald-500"
                  : "bg-slate-700"
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Seat Slots</span>
        <div className="grid grid-cols-1 gap-2">
          {room.seats.map((seat) => {
            const activeAssignment = seat.roomAssignments[0];
            const isOccupied = seat.status === "OCCUPIED" || Boolean(activeAssignment);

            return (
              <div
                key={seat.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  isOccupied
                    ? "bg-slate-900/90 border-slate-700/80"
                    : "bg-slate-950/40 border-dashed border-slate-800 hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      isOccupied
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {seat.seatNumber}
                  </span>

                  {isOccupied && activeAssignment ? (
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {activeAssignment.user.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{activeAssignment.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Vacant Seat</span>
                  )}
                </div>

                {canManage && (
                  <div>
                    {isOccupied && activeAssignment ? (
                      <button
                        onClick={() => handleUnassign(activeAssignment.id, activeAssignment.user.name)}
                        disabled={unassigningId === activeAssignment.id}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs flex items-center gap-1 transition"
                        title="Unassign Member"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onAssignSeat(seat.id, seat.seatNumber, room.name)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete room footer button */}
      {canManage && room.occupiedSeats === 0 && (
        <div className="pt-2 border-t border-slate-800/80 text-right">
          <button
            onClick={handleDeleteRoom}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Room
          </button>
        </div>
      )}

    </div>
  );
}
