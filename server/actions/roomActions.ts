"use server";

import { auth } from "@/auth";
import { RoomService } from "@/features/rooms/services/room.service";
import { revalidatePath } from "next/cache";

export async function getRooms() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await RoomService.getRooms(session.user.role, session.user.permissions);
}

export async function getUnassignedUsers() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await RoomService.getUnassignedUsers(session.user.role, session.user.permissions);
}

export async function createRoom(data: { name: string; floor: number; capacity: number }) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await RoomService.createRoom(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/rooms");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateRoom(data: { id: string; name: string; floor: number; capacity: number }) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await RoomService.updateRoom(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/rooms");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteRoom(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await RoomService.deleteRoom(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id
    );
    if (result.success) revalidatePath("/rooms");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function assignSeat(
  input: string | { seatId: string; userId: string },
  userIdParam?: string
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  let seatId: string;
  let userId: string;

  if (typeof input === "object") {
    seatId = input.seatId;
    userId = input.userId;
  } else {
    seatId = input;
    userId = userIdParam!;
  }

  try {
    const result = await RoomService.assignSeat(
      session.user.id,
      session.user.role,
      session.user.permissions,
      seatId,
      userId
    );
    if (result.success) revalidatePath("/rooms");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function unassignSeat(seatId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await RoomService.unassignSeat(
      session.user.id,
      session.user.role,
      session.user.permissions,
      seatId
    );
    if (result.success) revalidatePath("/rooms");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}
