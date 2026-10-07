import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "USER"]).default("USER"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  monthlyRent: z.number().min(0).default(0),
  nidNumber: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  mealStatus: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string(),
  password: z.string().min(6).optional().or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
