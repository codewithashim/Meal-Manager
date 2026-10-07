import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role } from "@prisma/client";

export type ServiceResult<T = any> =
  | { success: true; error?: undefined; [key: string]: any }
  | { success?: false; error: string };

export class RoomService {
  public static async getRooms(actorRole: Role, actorPermissions?: string[]) {
    PermissionService.enforce(actorRole, "ROOMS", "READ", actorPermissions);

    return await db.room.findMany({
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
    });
  }

  public static async getUnassignedUsers(actorRole: Role, actorPermissions?: string[]) {
    PermissionService.enforce(actorRole, "ROOMS", "READ", actorPermissions);

    const activeAssignments = await db.roomAssignment.findMany({
      where: { isActive: true },
      select: { userId: true },
    });
    const assignedUserIds = activeAssignments.map((a) => a.userId);

    return await db.user.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: assignedUserIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  }

  public static async createRoom(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: { name: string; floor: number; capacity: number }
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "ROOMS", "MANAGE", actorPermissions);

    const room = await db.room.create({
      data: {
        name: data.name,
        floor: data.floor,
        capacity: data.capacity,
      },
    });

    const seatOperations = Array.from({ length: data.capacity }).map((_, i) =>
      db.seat.create({
        data: {
          roomId: room.id,
          seatNumber: String.fromCharCode(65 + i), // A, B, C...
        },
      })
    );

    await db.$transaction(seatOperations);

    await AuditService.logActivity({
      actorId,
      action: "CREATE_ROOM",
      entity: "Room",
      entityId: room.id,
      details: `Created room ${room.name} (Floor ${room.floor}) with ${data.capacity} seats`,
    });

    return { success: true, room };
  }

  public static async updateRoom(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: { id: string; name: string; floor: number; capacity: number }
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "ROOMS", "MANAGE", actorPermissions);

    const updated = await db.room.update({
      where: { id: data.id },
      data: {
        name: data.name,
        floor: data.floor,
        capacity: data.capacity,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_ROOM",
      entity: "Room",
      entityId: data.id,
      details: `Updated room ${data.name} details`,
    });

    return { success: true, room: updated };
  }

  public static async deleteRoom(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "ROOMS", "MANAGE", actorPermissions);

    const room = await db.room.findUnique({ where: { id } });
    if (!room) return { error: "Room not found." };

    await db.room.delete({ where: { id } });

    await AuditService.logActivity({
      actorId,
      action: "DELETE_ROOM",
      entity: "Room",
      entityId: id,
      details: `Deleted room ${room.name}`,
    });

    return { success: true };
  }

  public static async assignSeat(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    seatId: string,
    userId: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "ROOMS", "MANAGE", actorPermissions);

    const seat = await db.seat.findUnique({ where: { id: seatId } });
    if (!seat) return { error: "Seat not found." };

    await db.roomAssignment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    const assignment = await db.roomAssignment.create({
      data: {
        seatId,
        userId,
        isActive: true,
      },
    });

    await db.seat.update({
      where: { id: seatId },
      data: { status: "OCCUPIED" },
    });

    await AuditService.logActivity({
      actorId,
      action: "ASSIGN_SEAT",
      entity: "Seat",
      entityId: seatId,
      details: `Assigned user ${userId} to seat ${seat.seatNumber}`,
    });

    return { success: true, assignment };
  }

  public static async unassignSeat(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    seatId: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "ROOMS", "MANAGE", actorPermissions);

    await db.roomAssignment.updateMany({
      where: { seatId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    await db.seat.update({
      where: { id: seatId },
      data: { status: "VACANT" },
    });

    await AuditService.logActivity({
      actorId,
      action: "UNASSIGN_SEAT",
      entity: "Seat",
      entityId: seatId,
      details: `Unassigned occupants from seat ${seatId}`,
    });

    return { success: true };
  }
}
