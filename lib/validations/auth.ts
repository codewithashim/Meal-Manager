import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "USER"]).default("USER"),
  monthlyRent: z.number().min(0).default(0),
  nidNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

export type RegisterMemberInput = z.infer<typeof registerMemberSchema>;
