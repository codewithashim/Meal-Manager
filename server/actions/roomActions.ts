"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { enforcePermission } from "@/lib/permissions";
import { createRoomSchema, updateRoomSchema, assignSeatSchema, CreateRoomInput, UpdateRoomInput, AssignSeatInput } from "@/lib/validations/room";
import { revalidatePath } from "next/cache";

export async function getRooms() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "ROOMS", "READ");

  const rooms = await db.room.findMany({
    include: {
      seats: {
        include: {
          roomAssignments: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  monthlyRent: true,
                },
              },
            },
          },
        },
        orderBy: { seatNumber: "asc" },
      },
    },
    orderBy: [{ floor: "asc" }, { name: "asc" }],
  });

  return rooms.map((room) => {
    const totalSeats = room.seats.length;
    const occupiedSeats = room.seats.filter((s) => s.status === "OCCUPIED" || s.roomAssignments.length > 0).length;
    const vacantSeats = totalSeats - occupiedSeats;

    return {
      ...room,
      totalSeats,
      occupiedSeats,
      vacantSeats,
    };
  });
}

export async function getUnassignedUsers() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Fetch active users who do NOT have an active room assignment
  const assignedUserIds = await db.roomAssignment.findMany({
    where: { isActive: true },
    select: { userId: true },
  });

  const assignedIds = new Set(assignedUserIds.map((a) => a.userId));

  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      monthlyRent: true,
    },
    orderBy: { name: "asc" },
  });

  return users.filter((u) => !assignedIds.has(u.id));
}

export async function createRoom(data: CreateRoomInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "ROOMS", "CREATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = createRoomSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Create room
  const newRoom = await db.room.create({
    data: {
      name: parsed.data.name,
      floor: parsed.data.floor,
      capacity: parsed.data.capacity,
      status: parsed.data.status,
    },
  });

  // Automatically create seats for this room (e.g. S-101-1, S-101-2)
  const seatsData = Array.from({ length: parsed.data.capacity }).map((_, i) => ({
    roomId: newRoom.id,
    seatNumber: `${newRoom.name}-S${i + 1}`,
    status: "VACANT" as const,
  }));

  await db.seat.createMany({
    data: seatsData,
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_ROOM",
      entity: "Room",
      entityId: newRoom.id,
      details: `Created room ${newRoom.name} on floor ${newRoom.floor} with capacity ${newRoom.capacity}`,
    },
  });

  revalidatePath("/rooms");
  return { success: true, room: newRoom };
}

export async function updateRoom(data: UpdateRoomInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "ROOMS", "UPDATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = updateRoomSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;

  const room = await db.room.findUnique({
    where: { id },
    include: { seats: true },
  });
  if (!room) return { error: "Room not found." };

  const updatedRoom = await db.room.update({
    where: { id },
    data: fields,
  });

  // If capacity increased, create additional seats
  if (fields.capacity && fields.capacity > room.seats.length) {
    const existingCount = room.seats.length;
    const diff = fields.capacity - existingCount;

    const newSeats = Array.from({ length: diff }).map((_, i) => ({
      roomId: id,
      seatNumber: `${updatedRoom.name}-S${existingCount + i + 1}`,
      status: "VACANT" as const,
    }));

    await db.seat.createMany({
      data: newSeats,
    });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE_ROOM",
      entity: "Room",
      entityId: id,
      details: `Updated room ${updatedRoom.name}`,
    },
  });

  revalidatePath("/rooms");
  return { success: true, room: updatedRoom };
}

export async function deleteRoom(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "ROOMS", "DELETE");
  } catch (err: any) {
    return { error: err.message };
  }

  // Check if any seat in the room has active assignments
  const activeAssignments = await db.roomAssignment.findFirst({
    where: {
      seat: { roomId: id },
      isActive: true,
    },
  });

  if (activeAssignments) {
    return { error: "Cannot delete room with active member seat assignments." };
  }

  await db.room.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "DELETE_ROOM",
      entity: "Room",
      entityId: id,
      details: `Deleted room ${id}`,
    },
  });

  revalidatePath("/rooms");
  return { success: true };
}

export async function assignSeat(data: AssignSeatInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "ROOMS", "UPDATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = assignSeatSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { userId, seatId } = parsed.data;

  // Check if seat is vacant
  const seat = await db.seat.findUnique({
    where: { id: seatId },
    include: { room: true },
  });
  if (!seat) return { error: "Seat not found." };
  if (seat.status === "OCCUPIED") {
    return { error: "Seat is already occupied." };
  }

  // Deactivate any existing active assignment for this user
  await db.roomAssignment.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false, endDate: new Date() },
  });

  // Create new active assignment
  const assignment = await db.roomAssignment.create({
    data: {
      userId,
      seatId,
      startDate: new Date(),
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  // Update seat status to OCCUPIED
  await db.seat.update({
    where: { id: seatId },
    data: { status: "OCCUPIED" },
  });

  // Check if room is now full
  const vacantRemaining = await db.seat.count({
    where: { roomId: seat.roomId, status: "VACANT" },
  });

  if (vacantRemaining === 0) {
    await db.room.update({
      where: { id: seat.roomId },
      data: { status: "FULL" },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "ASSIGN_SEAT",
      entity: "RoomAssignment",
      entityId: assignment.id,
      details: `Assigned member ${assignment.user.email} to seat ${seat.seatNumber} in room ${seat.room.name}`,
    },
  });

  revalidatePath("/rooms");
  return { success: true, assignment };
}

export async function unassignSeat(assignmentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "ROOMS", "UPDATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const assignment = await db.roomAssignment.findUnique({
    where: { id: assignmentId },
    include: { seat: { include: { room: true } }, user: true },
  });

  if (!assignment) return { error: "Assignment not found." };

  // Deactivate assignment
  await db.roomAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false, endDate: new Date() },
  });

  // Update seat status to VACANT
  await db.seat.update({
    where: { id: assignment.seatId },
    data: { status: "VACANT" },
  });

  // Update room status to AVAILABLE if it was FULL
  if (assignment.seat.room.status === "FULL") {
    await db.room.update({
      where: { id: assignment.seat.roomId },
      data: { status: "AVAILABLE" },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UNASSIGN_SEAT",
      entity: "RoomAssignment",
      entityId: assignmentId,
      details: `Unassigned member ${assignment.user.email} from seat ${assignment.seat.seatNumber}`,
    },
  });

  revalidatePath("/rooms");
  return { success: true };
}
