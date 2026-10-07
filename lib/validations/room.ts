import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  floor: z.number().int().min(0).default(1),
  capacity: z.number().int().min(1, "Capacity must be at least 1").default(2),
  status: z.enum(["AVAILABLE", "FULL", "MAINTENANCE"]).default("AVAILABLE"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial().extend({
  id: z.string(),
});

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const assignSeatSchema = z.object({
  userId: z.string().min(1, "User selection is required"),
  seatId: z.string().min(1, "Seat selection is required"),
});

export type AssignSeatInput = z.infer<typeof assignSeatSchema>;
